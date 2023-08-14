import crypto from "crypto";

// Used to generate cryptographically random user identifier (for VC and voting purpose, to preserve privacy)
export function generateRandomHex() {
  // 16 random bytes (this is generally considered resistant to brute-force attack and often used as API token)
  const randomBytes = new Uint8Array(16);
  crypto.webcrypto.getRandomValues(randomBytes);
  return Buffer.from(randomBytes).toString("hex");
}

// Generate cryptographically random 6 digits code for email validation.
// Standard practice, used by Ory for example.
// Though Node's crypto functions - which are based on OpenSSL - aren't the most secure compared to libsodium, it's enough for this purpose as we also rate-limit the number of attempts.
export function generateOneTimeCode(): number {
  return crypto.randomInt(0, 999999);
}

export function generateUUID() {
  return crypto.webcrypto.randomUUID();
}
