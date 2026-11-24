import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { requireEnv } from "./env";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const SEPARATOR = ".";

function parseKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== KEY_BYTES)
    throw new Error(`TOKEN_ENCRYPTION_KEY must be ${KEY_BYTES} bytes, base64 encoded`);
  return key;
}

/** Encrypts to `iv.authTag.ciphertext` (base64 parts). The key comes from the environment by default. */
export function encrypt(
  plaintext: string,
  base64Key: string = requireEnv("TOKEN_ENCRYPTION_KEY"),
): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, parseKey(base64Key), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext]
    .map((part) => part.toString("base64"))
    .join(SEPARATOR);
}

export function decrypt(
  payload: string,
  base64Key: string = requireEnv("TOKEN_ENCRYPTION_KEY"),
): string {
  const [iv, authTag, ciphertext] = payload
    .split(SEPARATOR)
    .map((part) => Buffer.from(part, "base64"));
  if (!iv || !authTag || !ciphertext) throw new Error("Malformed encrypted payload");
  const decipher = createDecipheriv(ALGORITHM, parseKey(base64Key), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
