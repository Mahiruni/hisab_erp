import { createHash } from "node:crypto";
import { ValidationError } from "../validation";

const blockedPasswords = new Set([
  "password", "password1", "password123", "qwerty123", "1234567890", "admin123", "welcome123",
  "letmein123", "hisabtech", "hisabtech123", "ethiopia123", "changeme123",
]);

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function assertPasswordIsSafe(password: string) {
  const normalized = normalize(password);
  if (blockedPasswords.has(normalized) || /(.)\1{5,}/.test(password) || /(?:012345|123456|abcdef|qwerty)/i.test(password)) {
    throw new ValidationError({ password: "This password is too common or predictable. Choose a unique passphrase." });
  }

  const digest = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true", "User-Agent": "HisabERP-password-protection" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return;
    const compromised = (await response.text()).split(/\r?\n/).some((line) => line.split(":", 1)[0] === suffix);
    if (compromised) {
      throw new ValidationError({ password: "This password appears in a known data breach. Choose a different password." });
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    // The breach service is an additional control. A temporary outage must not lock users out of recovery.
  } finally {
    clearTimeout(timeout);
  }
}
