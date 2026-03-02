/**
 * Shared JWT helper for consistent token handling across all auth functions
 */

// Convert string to ArrayBuffer using TextEncoder
function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to URL-safe base64
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Convert base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  // Add padding if needed
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const base64Standard = base64
    .replace(/-/g, '+')
    .replace(/_/g, '/') + padding;
  
  const binary = atob(base64Standard);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Create a JWT with consistent structure and signing
 */
export async function createJWT(
  payload: Record<string, any>,
  secret: string,
  expiresIn = '24h'
): Promise<string> {
  // Calculate expiration
  const hoursMatch = expiresIn.match(/(\d+)h/);
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 24;
  const exp = Math.floor(Date.now() / 1000) + (hours * 3600);
  
  // Create header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // Create payload with standard claims
  const fullPayload = {
    ...payload,
    exp,
    iat: Math.floor(Date.now() / 1000),
    iss: 'ggj-auth'
  };
  
  // Encode header and payload
  const encodedHeader = bufferToBase64Url(
    stringToBuffer(JSON.stringify(header))
  );
  const encodedPayload = bufferToBase64Url(
    stringToBuffer(JSON.stringify(fullPayload))
  );
  
  // Create signature
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    stringToBuffer(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    stringToBuffer(signingInput)
  );
  
  const encodedSignature = bufferToBase64Url(signature);
  
  return `${signingInput}.${encodedSignature}`;
}

/**
 * Verify and decode a JWT
 */
export async function verifyJWT(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: any; error?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // Verify signature
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      stringToBuffer(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBuffer = base64ToBuffer(encodedSignature);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      stringToBuffer(signingInput)
    );
    
    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    // Decode payload
    const payloadBuffer = base64ToBuffer(encodedPayload);
    const payloadString = new TextDecoder().decode(payloadBuffer);
    const payload = JSON.parse(payloadString);
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, payload };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Token verification failed' 
    };
  }
}

/**
 * Generate a secure random code for auth exchanges
 */
export function generateAuthCode(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToBase64Url(bytes.buffer);
}

/**
 * Hash a password using PBKDF2 (until we can use bcrypt/argon2)
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  // Generate salt if not provided
  if (!salt) {
    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    salt = bufferToBase64Url(saltBytes.buffer);
  }
  
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = base64ToBuffer(salt);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hash = bufferToBase64Url(hashBuffer);
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [salt, hash] = storedHash.split(':');
    const newHash = await hashPassword(password, salt);
    return newHash === storedHash;
  } catch {
    return false;
  }
}