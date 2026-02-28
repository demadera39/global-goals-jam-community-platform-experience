// Script to generate password hash for admin setup
import bcrypt from 'bcryptjs';

async function hashPassword() {
  const password = 'jordan23!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Password hash for jordan23!:');
  console.log(hash);
  
  const adminId = 'admin_' + Date.now();
  console.log('\nSQL to create admin user:');
  console.log(`INSERT INTO users (id, email, display_name, role, status, password_hash, created_at, updated_at)
VALUES ('${adminId}', 'demadera@marcovanhout.com', 'Marco van Hout', 'admin', 'active', '${hash}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

hashPassword();