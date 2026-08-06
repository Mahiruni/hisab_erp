import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");

test("uses the premium Biloo sign-in hierarchy without changing authentication behavior", async () => {
  const login = await read("app/auth/login/page.tsx");

  assert.match(login, /biloo-login-page/);
  assert.match(login, /biloo-login-dashboard/);
  assert.match(login, /biloo-login-form-pane/);
  assert.match(login, /LoginPasswordField/);
  assert.match(login, /SocialAuthButtons/);
  assert.match(login, /action=\{signInWithEmail\}/);
  assert.match(login, /inputMode="email"/);
  assert.match(login, /safeNextPath/);
  assert.match(login, /auth\/magic-link/);
  assert.match(login, /auth\/phone-login/);
  assert.doesNotMatch(login, /auth-slack-page/);
  assert.doesNotMatch(login, /LanguageSelector/);
});

test("keeps the redesigned login responsive, accessible and brand-authoritative", async () => {
  const [styles, passwordField, layout] = await Promise.all([
    read("app/auth-login-award.css"),
    read("components/login-password-field.tsx"),
    read("app/layout.tsx"),
  ]);

  assert.match(layout, /import "\.\/auth-login-award\.css"/);
  assert.ok(
    layout.indexOf('import "./auth-login-award.css";') > layout.indexOf('import "./biloo-black-gold-brand-system.css";'),
    "login design must load after the global brand layer",
  );
  assert.match(styles, /@media \(max-width:960px\)/);
  assert.match(styles, /@media \(max-width:620px\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(styles, /prefers-contrast:more/);
  assert.match(styles, /--biloo-login-gold:#fca311/i);
  assert.match(styles, /--biloo-login-navy:#14213d/i);
  assert.match(passwordField, /autoComplete="current-password"/);
  assert.match(passwordField, /aria-pressed=\{visible\}/);
  assert.match(passwordField, /type="button"/);
});
