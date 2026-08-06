import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("account security page keeps protected behavior and exposes the redesigned hierarchy", async () => {
  const source = await read("app/account/page.tsx");

  assert.match(source, /getCurrentUserContext\(\{ required: true \}\)/);
  assert.match(source, /<MfaSecurityPanel organizationId=\{user\.organizationId\} required=\{user\.mfaRequired\} initialAal=\{user\.aal\}/);
  assert.match(source, /<form action=\{signOut\}>/);
  assert.match(source, /security-account-breadcrumb/);
  assert.match(source, /security-status-strip/);
  assert.match(source, /security-profile-card/);
  assert.match(source, /security-mfa-column/);
  assert.match(source, /security-policy-grid/);
  assert.match(source, /Database enforced/);
});

test("account security redesign supports responsive and dark interfaces", async () => {
  const [styles, layout] = await Promise.all([
    read("app/account-security-premium.css"),
    read("app/layout.tsx"),
  ]);

  assert.match(layout, /import "\.\/account-security-premium\.css";/);
  assert.match(styles, /html\[data-theme="dark"\] \.security-account-modern/);
  assert.match(styles, /@media\(max-width:1050px\)/);
  assert.match(styles, /@media\(max-width:780px\)/);
  assert.match(styles, /@media\(max-width:560px\)/);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(styles, /\.security-account-modern \.mfa-enrollment/);
  assert.match(styles, /\.security-account-modern \.mfa-challenge/);
});
