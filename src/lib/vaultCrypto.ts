// Criptografia do Cofre de Senhas — tudo roda no navegador.
// O PIN nunca é enviado ao servidor; só a chave derivada (em memória,
// nunca persistida) e as senhas já criptografadas chegam ao Supabase.

const PBKDF2_ITERATIONS = 150_000;

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function base64ToBytes(b64: string) {
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export function randomSaltB64() {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
}

async function deriveRawKeyBytes(pin: string, saltB64: string) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: base64ToBytes(saltB64), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

export interface VaultKey {
  key: CryptoKey;
  verifierB64: string;
}

export async function deriveVaultKey(pin: string, saltB64: string): Promise<VaultKey> {
  const rawBytes = await deriveRawKeyBytes(pin, saltB64);
  const key = await crypto.subtle.importKey("raw", rawBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  const verifierBits = await crypto.subtle.digest("SHA-256", rawBytes);
  const verifierB64 = bytesToBase64(new Uint8Array(verifierBits));
  return { key, verifierB64 };
}

export async function encryptString(key: CryptoKey, plaintext: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptString(key: CryptoKey, payload: string) {
  const [ivB64, dataB64] = payload.split(":");
  const iv = base64ToBytes(ivB64);
  const data = base64ToBytes(dataB64);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(plainBuf);
}
