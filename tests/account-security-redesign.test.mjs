import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("account security redesign preserves the authenticated MFA contract", async () => {
  const page = await read("app/account/page.tsx");

  assert.match(page, /getCurrentUserContext\(\{ required: true \}\)/);
  assert.match(page, /<MfaSecurityPanel organizationId=\{user\.organizationId\} required=\{user\.mfaRequired\} initialAal=\{user\.aal\} \/>/);
  assert.match(page, /<form action=\{signOut\}>/);
  assert.match(page, /const strongSession = user\.aal === "aal2"/);
});

test("account security page exposes a clear responsive security hierarchy", async () => {
  const [page, styles] = await Promise.all([
    read("app/account/page.tsx"),
    read("app/account-security-premium.css"),
  ]);

  for (const className of [
    "security-command-header",
    "security-posture-card",
    "security-status-strip",
    "security-account-layout",
    "security-policy-grid",
  ]) {
    assert.match(page, new RegExp(className));
    assert.match(styles, new RegExp(`\\.${className}`));
  }

  assert.match(styles, /@media \(max-width: 980px\)/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("account security frontend follows the current Biloo product identity", async () => {
  const page = await read("app/account/page.tsx");

  assert.match(page, /Verified Biloo account/);
  assert.match(page, /Biloo uses Supabase MFA verification/);
  assert.doesNotMatch(page, /HisabTech/);
});
