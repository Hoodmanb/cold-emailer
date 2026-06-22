const { findUserByEmail, findUserById, createUser } = require('../repositories/userRepository');
const { defaultBillingFields } = require('../repositories/billingUserRepository');
const { successResponse } = require('../utils/response');
const { AuthError } = require('../shared/errors/customErrors');
const supabaseAdmin = require('../utils/supabaseAdmin');
const supabasePublic = require('../utils/supabaseClient');

/**
 * Build the sanitized user object returned to the client.
 * Billing summary is loaded lazily to avoid circular deps.
 */
async function sanitizeUser(user) {
  const billingService = require('../services/billing/billingService');
  const billing = await billingService.getBillingSummary(user.id);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    userVersion: user.userVersion || 1,
    createdAt: user.createdAt,
    role: user.role || 'user',
    billingType: billing.billingType,
    credits: billing.credits,
    gatewayAccess: billing.gatewayAccess,
    hasAccess: billing.hasAccess,
    starredTemplates: Array.isArray(user.starredTemplates) ? user.starredTemplates : [],
  };
}

/**
 * POST /api/auth/signup
 * Creates a Supabase Auth user, then creates the app-level user record.
 * Returns the Supabase access_token so the client can store and reuse it.
 */
const signup = async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!name || !email || !password) {
    throw new Error('name, email and password are required');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Check for duplicate in our own user table first
  const existing = await findUserByEmail(email);
  if (existing) {
    res.status(409);
    throw new Error('Email is already in use');
  }

  // Create the Supabase Auth user via the admin client (no email confirmation required)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,               // auto-confirm so user can log in immediately
    app_metadata: { role: 'user' },
    user_metadata: { name },
  });

  if (authError) {
    // If Supabase already has this email, surface a friendly message
    if (authError.message?.toLowerCase().includes('already registered')) {
      res.status(409);
      throw new Error('Email is already in use');
    }
    throw new Error(authError.message || 'Could not create auth user');
  }

  const supabaseUser = authData.user;

  // Create the matching application-level user record using the same UUID
  const appUser = {
    id: supabaseUser.id,      // use Supabase UID as primary key
    name,
    email,
    createdAt: supabaseUser.created_at || new Date().toISOString(),
    ...defaultBillingFields({ grandfathered: false }),
  };

  const created = await createUser(appUser);

  // Sign the user in to get a real session / access_token
  const { data: sessionData, error: sessionError } =
    await supabasePublic.auth.signInWithPassword({ email, password });

  if (sessionError || !sessionData?.session) {
    throw new Error(sessionError?.message || 'Signup succeeded but could not create session');
  }

  const { access_token } = sessionData.session;

  return successResponse(res, {
    status: 201,
    message: 'Signup successful',
    data: {
      token: access_token,
      user: await sanitizeUser(created),
    },
  });
};

/**
 * POST /api/auth/login
 * Authenticates via Supabase, then returns the access_token plus app-level user profile.
 */
const login = async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) {
    throw new Error('email and password are required');
  }

  // Let Supabase handle credential verification
  const { data: sessionData, error: authError } =
    await supabasePublic.auth.signInWithPassword({ email, password });

  if (authError || !sessionData?.session) {
    throw new AuthError(
      authError?.message || 'Invalid credentials',
      'AUTH_INVALID_CREDENTIALS'
    );
  }

  const { access_token } = sessionData.session;
  const supabaseUserId = sessionData.user.id;

  // Load the application-level user record
  const user = await findUserById(supabaseUserId);
  if (!user) {
    // Edge case: Supabase auth user exists but no app record — create a minimal one
    const fallback = {
      id: supabaseUserId,
      name: sessionData.user.user_metadata?.name || email.split('@')[0],
      email,
      createdAt: new Date().toISOString(),
      ...defaultBillingFields({ grandfathered: false }),
    };
    await createUser(fallback);
    const created = await findUserById(supabaseUserId);
    return successResponse(res, {
      status: 200,
      message: 'Login successful',
      data: { token: access_token, user: await sanitizeUser(created || fallback) },
    });
  }

  return successResponse(res, {
    status: 200,
    message: 'Login successful',
    data: { token: access_token, user: await sanitizeUser(user) },
  });
};

/**
 * GET /api/auth/me  (protected by requireAuth middleware)
 * Returns the current authenticated user's app-level profile.
 */
const me = async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const sanitizedUser = await sanitizeUser(user);
  sanitizedUser.role = req.user.role; // Ensure the role from the authenticated request is forwarded
  return successResponse(res, {
    status: 200,
    message: 'User loaded successfully',
    data: sanitizedUser,
  });
};

/**
 * POST /api/auth/reset-password
 * Sends a Supabase password-reset email.
 */
const resetPassword = async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) throw new Error('email is required');

  const { error } = await supabasePublic.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/reset-password`,
  });

  if (error) throw new Error(error.message);

  return successResponse(res, {
    status: 200,
    message: 'Password reset email sent',
    data: null,
  });
};

module.exports = { signup, login, me, resetPassword };
