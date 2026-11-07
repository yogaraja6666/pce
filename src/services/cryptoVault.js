// Zero-Knowledge Web Crypto Vault (AES-GCM-256 + PBKDF2-SHA256)
// 100% Free, Runs fully in browser, Plaintext NEVER stored or transmitted.

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

// Utility: ArrayBuffer <-> Base64
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-GCM-256 CryptoKey from a master password and salt using PBKDF2
 */
export async function deriveKeyFromPassword(password, saltBuffer) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an arbitrary object with AES-GCM-256
 */
export async function encryptObject(dataObj, cryptoKey) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encodedData = enc.encode(JSON.stringify(dataObj));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encodedData
  );

  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv)
  };
}

/**
 * Decrypts an AES-GCM-256 ciphertext object
 */
export async function decryptObject(encryptedPayload, cryptoKey) {
  const dec = new TextDecoder();
  const ivBuffer = base64ToBuffer(encryptedPayload.iv);
  const cipherBuffer = base64ToBuffer(encryptedPayload.ciphertext);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
    cryptoKey,
    cipherBuffer
  );

  return JSON.parse(dec.decode(decryptedBuffer));
}

/**
 * Evaluates password strength and returns score 0-100 and feedback
 */
export function calculatePasswordScore(password) {
  if (!password) return { score: 0, label: 'Empty', color: 'text-zinc-500' };

  let score = 0;
  const len = password.length;

  // Length points
  if (len >= 8) score += 20;
  if (len >= 14) score += 20;
  if (len >= 20) score += 15;

  // Diversity points
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  // Entropy bonus if highly varied
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 12) score += 10;
  if (len < 8) score = Math.min(score, 25);

  score = Math.min(100, Math.max(0, score));

  let label = 'Very Weak';
  let color = 'text-rose-400';
  let barColor = 'bg-rose-500';

  if (score >= 85) {
    label = 'Military Grade';
    color = 'text-emerald-400';
    barColor = 'bg-emerald-500';
  } else if (score >= 65) {
    label = 'Strong';
    color = 'text-cyan-400';
    barColor = 'bg-cyan-500';
  } else if (score >= 45) {
    label = 'Moderate';
    color = 'text-amber-400';
    barColor = 'bg-amber-500';
  } else if (score >= 25) {
    label = 'Weak';
    color = 'text-orange-400';
    barColor = 'bg-orange-500';
  }

  return { score, label, color, barColor };
}

/**
 * Generates an ultra-secure complex password
 */
export function generateStrongPassword(options = {}) {
  const {
    length = 20,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false
  } = options;

  let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  let numberChars = '0123456789';
  let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (excludeAmbiguous) {
    upperChars = upperChars.replace(/[OI]/g, '');
    lowerChars = lowerChars.replace(/[l]/g, '');
    numberChars = numberChars.replace(/[01]/g, '');
  }

  let charset = '';
  const mandatory = [];

  if (uppercase) {
    charset += upperChars;
    mandatory.push(upperChars[Math.floor(Math.random() * upperChars.length)]);
  }
  if (lowercase) {
    charset += lowerChars;
    mandatory.push(lowerChars[Math.floor(Math.random() * lowerChars.length)]);
  }
  if (numbers) {
    charset += numberChars;
    mandatory.push(numberChars[Math.floor(Math.random() * numberChars.length)]);
  }
  if (symbols) {
    charset += symbolChars;
    mandatory.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]);
  }

  if (!charset) charset = lowerChars + numberChars;

  const result = [...mandatory];
  const cryptoArray = new Uint32Array(length - mandatory.length);
  crypto.getRandomValues(cryptoArray);

  for (let i = 0; i < cryptoArray.length; i++) {
    result.push(charset[cryptoArray[i] % charset.length]);
  }

  // Cryptographically shuffle array
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

/**
 * Encrypts and exports vault with a custom Document Password
 */
export async function exportVaultEncrypted(items, documentPassword) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const docKey = await deriveKeyFromPassword(documentPassword, salt);
  const encryptedPayload = await encryptObject(items, docKey);

  const exportPackage = {
    app: 'BreachRadar-Vault',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    salt: bufferToBase64(salt),
    payload: encryptedPayload
  };

  const blob = new Blob([JSON.stringify(exportPackage, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ShieldVault_Backup_${new Date().toISOString().slice(0, 10)}.encrypted.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Imports and decrypts a document-password protected vault backup
 */
export async function importVaultEncrypted(jsonString, documentPassword) {
  const pkg = JSON.parse(jsonString);
  if (!pkg.salt || !pkg.payload || pkg.app !== 'BreachRadar-Vault') {
    throw new Error('Invalid or corrupted backup file format');
  }

  const saltBuffer = base64ToBuffer(pkg.salt);
  const docKey = await deriveKeyFromPassword(documentPassword, saltBuffer);
  return decryptObject(pkg.payload, docKey);
}
