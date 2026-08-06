import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("sign-in and sign-up share one standard responsive auth experience", async () => {
  const [layout, shell, login, signup, styles] = await Promise.all([
    read("app/layout.tsx"),
    read("components/email-auth-card.tsx"),
    read("app/auth/login/page.tsx"),
    read("app/auth/email-sign-up/page.tsx"),
    read("app/auth-standard-experience.css"),
  ]);

  assert.match(layout, /import "\.\/auth-standard-experience\.css";/);
  assert.ok(layout.lastIndexOf("./auth-standard-experience.css") > layout.lastIndexOf("./surface-uniformity-lock.css"));
  assert.match(shell, /auth-standard-shell/);
  assert.match(shell, /auth-standard-showcase/);
  assert.match(shell, /Privacy & security/);
  assert.match(login, /<EmailAuthCard/);
  assert.match(login, /action=\{signInWithEmail\}/);
  assert.match(login, /autoComplete="current-password"/);
  assert.match(signup, /action=\{signUpWithEmail\}/);
  assert.match(signup, /name="acceptedTerms"/);
  assert.match(signup, /href=\{`\/auth\/login/);
  assert.match(styles, /grid-template-columns:\s*minmax\(360px, \.92fr\) minmax\(520px, 1\.08fr\)/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /\.auth-standard-showcase \{ display: none;/);
  assert.match(styles, /--hisab-logo-terracotta/);
  assert.match(styles, /min-height:\s*50px/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("authentication actions and server-side verification remain unchanged", async () => {
  const [login, signup] = await Promise.all([
    read("app/auth/login/page.tsx"),
    read("app/auth/email-sign-up/page.tsx"),
  ]);

  assert.match(login, /isSupabaseConfigured\(\)/);
  assert.match(login, /name="next"/);
  assert.match(login, /<SocialAuthButtons/);
  assert.match(signup, /minLength=\{10\}/);
  assert.match(signup, /name="confirmPassword"/);
});
