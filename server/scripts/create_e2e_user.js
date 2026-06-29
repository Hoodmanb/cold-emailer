const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createE2EUser() {
  const email = 'e2e-user@careerbot.test';
  const password = 'E2eTestPassword123!';

  console.log(`Checking if E2E user exists: ${email}`);

  // Fetch users to see if already exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    console.log(`User already exists (ID: ${existingUser.id}). Resetting password to ensure correctness...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: password, email_confirm: true }
    );
    if (updateError) {
      console.error('Error resetting password:', updateError.message);
      process.exit(1);
    }
    console.log('Password reset successfully!');
  } else {
    console.log('User does not exist. Creating new user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createError) {
      console.error('Error creating user:', createError.message);
      process.exit(1);
    }
    console.log('User created successfully:', newUser.user.id);
  }
}

createE2EUser().then(() => {
  console.log('Done!');
  process.exit(0);
});
