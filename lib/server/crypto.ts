import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

import { getServerEnv } from "@/lib/env";

function getEncryptionKey() {
  return createHash("sha256")
    .update(getServerEnv().DEVICE_CREDENTIALS_AES_KEY)
    .digest();
}

export function encryptJson(value: unknown) {
  const iv = randomBytes(12);
  const key = getEncryptionKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptJson<T>(ciphertext: string): T {
  const [ivB64, tagB64, payloadB64] = ciphertext.split(".");
  if (!ivB64 || !tagB64 || !payloadB64) {
    throw new Error("Malformed encrypted payload");
  }

  const key = getEncryptionKey();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadB64, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8")) as T;
}
