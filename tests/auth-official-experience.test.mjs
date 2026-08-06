import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("primary authentication routes use the official interface", async () => {
  const [login, signup, phone, emailCard] = await Promise.all([
    read("app/auth/login/page.tsx"),
    read("app/auth/sign-up/page.tsx"),
    read("app/auth/phone-login/page.tsx"),
    read("components/email-auth-card.tsx"),
  ]);

  for (const source of [login, signup, phone, emailCard]) {
    assert.match(source, /auth-official-page/);
    assert.match(source, /auth-official-form-panel/);
    assert.match(source, /HisabTech/);
  }

  assert.doesNotMatch(login, /AUTHENTICATION V2|secure access v2|Supabase protected/i);
  assert.doesNotMatch(signup, /premium operating system|SMS provider in Supabase/i);
  assert.match(login, /Sign in to HisabTech/);
  assert.match(signup, /Create your HisabTech account/);
  assert.match(phone, /Sign in with mobile number/);
});

test("provider and action labels are concise and conventional", async () => {
  const [providers, login, signup] = await Promise.all([
    read("components/social-auth-buttons.tsx"),
    read("app/auth/login/page.tsx"),
    read("app/auth/sign-up/page.tsx"),
  ]);

  assert.match(providers, /Continue with Google/);
  assert.match(providers, /Continue with Apple/);
  assert.doesNotMatch(providers, /Continue to HisabTech with Google/);
  assert.match(login, /auth-field-label-row/);
  assert.match(login, /auth-secondary-options/);
  assert.match(signup, /auth-method-card/);
  assert.match(signup, /auth-legal-note/);
});

test("official authentication styling covers responsive and accessible states", async () => {
  const [layout, styles] = await Promise.all([
    read("app/layout.tsx"),
    read("app/auth-official.css"),
  ]);

  assert.match(layout, /auth-official\.css/);
  assert.match(styles, /\.auth-official-shell/);
  assert.match(styles, /\.auth-primary-button/);
  assert.match(styles, /\.auth-secondary-options/);
  assert.match(styles, /focus-within/);
  assert.match(styles, /@media\(max-width:640px\)/);
  assert.match(styles, /prefers-reduced-motion/);
});
