// Criptografia AES-256-GCM no lado do cliente
// As senhas NUNCA chegam ao servidor em texto claro

const ALGO = "AES-GCM";
const KEY_LENGTH = 256;
const ITERATIONS = 310_000; // PBKDF2 — OWASP 2024

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin) as unknown as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as unknown as ArrayBuffer, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptPassword(plaintext: string, pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  // Formato: base64(salt + iv + ciphertext)
  const combined = new Uint8Array(salt.length + iv.length + cipherBuffer.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(cipherBuffer), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptPassword(encrypted: string, pin: string): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const key = await deriveKey(pin, salt);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plainBuffer);
}

// Hash de PIN para validação local (não armazenado no servidor)
export async function hashPin(pin: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(pin + "casa-portal-salt-v1")
  );
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
