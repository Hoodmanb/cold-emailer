const crypto = require('crypto');
const { asErrorMessage } = require('./safeError');

const ALGORITHM = 'aes-256-cbc';
const KEY_BYTES = 32;
const IV_BYTES = 16;

function isHexString(value, expectedLength) {
  if (typeof value !== 'string') return false;
  if (!value.trim()) return false;
  if (expectedLength && value.length !== expectedLength) return false;
  return /^[0-9a-fA-F]+$/.test(value);
}

const getSecretKey = () => {
  const key = process.env.CRYPTO_SECRET_KEY;
  if (!key) throw new Error('CRYPTO_SECRET_KEY env variable is not set');
  if (!isHexString(key, KEY_BYTES * 2)) {
    throw new Error('CRYPTO_SECRET_KEY must be a 64-character hex string');
  }
  return Buffer.from(key, 'hex');
};

/**
 * Encrypt a plain-text password using AES-256-CBC.
 * Returns { encryptedPassword, iv } — both as hex strings.
 */
const encrypt = (plainPassword) => {
  if (typeof plainPassword !== 'string' || !plainPassword.trim()) {
    throw new Error('encrypt() requires a non-empty string input');
  }
  const secretKey = getSecretKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, secretKey, iv);
  let encrypted = cipher.update(plainPassword, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    encryptedPassword: encrypted,
  };
};

/**
 * Decrypt an AES-256-CBC encrypted password.
 */
const decrypt = (encryptedPassword, ivHex) => {
  try {
    if (!isHexString(ivHex, IV_BYTES * 2)) return null;
    if (!isHexString(encryptedPassword)) return null;

    const secretKey = getSecretKey();
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      secretKey,
      Buffer.from(ivHex, 'hex')
    );
    let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.warn(`[encryption] decrypt failed safely: ${asErrorMessage(err)}`);
    return null;
  }
};

module.exports = { encrypt, decrypt };
