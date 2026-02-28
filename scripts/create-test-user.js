// Script to create a test user with a known password
const crypto = require('crypto');

// This must match the JWT_SECRET in the edge function
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-from-blink-secrets';

async function hashPassword(password) {
  const data = password + JWT_SECRET;
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

async function main() {
  const testPassword = 'TestPassword123!';
  const hashedPassword = await hashPassword(testPassword);
  
  console.log('Test User Details:');
  console.log('Email: test@globalgoalsjam.org');
  console.log('Password: TestPassword123!');
  console.log('Password Hash:', hashedPassword);
  console.log('');
  console.log('SQL to create user:');
  console.log(`
INSERT INTO users (
  id, 
  email, 
  display_name, 
  role, 
  status, 
  password_hash, 
  created_at, 
  updated_at
) VALUES (
  'user_test_${Date.now()}',
  'test@globalgoalsjam.org',
  'Test User',
  'participant',
  'approved',
  '${hashedPassword}',
  datetime('now'),
  datetime('now')
);
  `);
}

main();