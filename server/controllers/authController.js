const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { findUserByEmail, findUserById, createUser } = require("../repositories/userRepository");
const { signToken } = require("../utils/token");
const { successResponse } = require("../utils/response");
const { AuthError } = require("../shared/errors/customErrors");

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    userVersion: user.userVersion || 1,
    createdAt: user.createdAt,
    role: user.role || "user",
  };
}

const signup = async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!name || !email || !password) {
    throw new Error("name, email and password are required");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const existing = findUserByEmail(email);
  if (existing) {
    res.status(409);
    throw new Error("Email is already in use");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  
  const created = createUser(user);
  const token = signToken(created);

  return successResponse(res, {
    status: 201,
    message: "Signup successful",
    data: {
      token,
      user: sanitizeUser(created),
    },
  });
};

const login = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) {
    throw new Error("email and password are required");
  }

  const user = findUserByEmail(email);
  if (!user) {
    throw new AuthError("Invalid credentials", "AUTH_INVALID_CREDENTIALS");
  }

  const ok = await bcrypt.compare(password, String(user.passwordHash || ""));
  if (!ok) {
    throw new AuthError("Invalid credentials", "AUTH_INVALID_CREDENTIALS");
  }

  const token = signToken(user);

  return successResponse(res, {
    status: 200,
    message: "Login successful",
    data: {
      token,
      user: sanitizeUser(user),
    },
  });
};

const me = (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  
  return successResponse(res, {
    status: 200,
    message: "User loaded successfully",
    data: sanitizeUser(user),
  });
};

module.exports = { signup, login, me };
