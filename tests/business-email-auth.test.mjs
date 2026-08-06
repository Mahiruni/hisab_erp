import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");

test("uses a dedicated PKCE-compatible confirmation endpoint", async () => {
  const [actions, confirm, proxy] = await Promise.all([
    read("lib/actions/email-auth.ts"),
    read("app/auth/confirm/route.ts"),
    read("lib/supabase/proxy.ts"),
  ]);

  assert.match(actions, /function confirmationUrl\(next: string\)/);
  assert.match(actions, /\/auth\/confirm\?next=/);
  assert.match(confirm, /verifyOtp\(\{ token_hash: tokenHash, type: rawType \}\)/);
  assert.match(confirm, /exchangeCodeForSession\(code\)/);
  assert.match(confirm, /safeNextPath/);
  assert.match(proxy, /"\/auth\/confirm"/);
});

test("handles signup, verification resend, immediate sessions, and existing identities", async () => {
  const [actions, verifyPage] = await Promise.all([
    read("lib/actions/email-auth.ts"),
    read("app/auth/verify-email/page.tsx"),
  ]);

  assert.match(actions, /const \{ data, error \} = await supabase\.auth\.signUp/);
  assert.match(actions, /if \(data\.session\) redirect\(next\)/);
  assert.match(actions, /data\.user\?\.identities/);
  assert.match(actions, /data\.user\.identities\.length === 0/);
  assert.match(actions, /reason=existing-account/);
  assert.match(actions, /export async function resendEmailConfirmation/);
  assert.match(actions, /supabase\.auth\.resend\(\{/);
  assert.match(actions, /type: "signup"/);
  assert.match(verifyPage, /action=\{resendEmailConfirmation\}/);
  assert.match(verifyPage, /Resend verification email/);
});

test("keeps login errors useful without exposing account existence", async () => {
  const [actions, loginPage] = await Promise.all([
    read("lib/actions/email-auth.ts"),
    read("app/auth/login/page.tsx"),
  ]);

  assert.match(actions, /email_not_confirmed/);
  assert.match(actions, /Confirm your email before signing in/);
  assert.match(actions, /genericLoginError/);
  assert.match(actions, /If you originally joined with Google/);
  assert.match(actions, /identifier_hash: createHash\("sha256"\)/);
  assert.match(loginPage, /password-or-provider/);
  assert.match(loginPage, /Create or reset email password/);
  assert.match(loginPage, /Resend verification email/);
});

test("supports password setup for accounts originally created with OAuth", async () => {
  const [actions, recoveryPage] = await Promise.all([
    read("lib/actions/email-auth.ts"),
    read("app/auth/forgot-password/page.tsx"),
  ]);

  assert.match(actions, /resetPasswordForEmail/);
  assert.match(actions, /redirectTo: confirmationUrl\("\/auth\/reset-password"\)/);
  assert.match(recoveryPage, /originally created with Google/);
  assert.match(recoveryPage, /without creating a duplicate account/);
  assert.match(recoveryPage, /name="next"/);
});

test("forces a clean sign-in after password recovery", async () => {
  const actions = await read("lib/actions/email-auth.ts");

  assert.match(actions, /signOut\(\{ scope: "global" \}\)/);
  assert.match(actions, /Sign\+in\+again\+with\+your\+new\+password/);
  assert.doesNotMatch(actions, /signOut\(\{ scope: "others" \}\)/);
});

test("does not advertise or execute providers that have not been configured", async () => {
  const [config, providers, providerOrbit, loginPage, actions] = await Promise.all([
    read("lib/config.ts"),
    read("components/social-auth-buttons.tsx"),
    read("components/provider-orbit.tsx"),
    read("app/auth/login/page.tsx"),
    read("lib/actions/auth.ts"),
  ]);

  assert.match(config, /NEXT_PUBLIC_ENABLE_APPLE_AUTH/);
  assert.match(config, /NEXT_PUBLIC_ENABLE_PHONE_AUTH/);
  assert.match(providers, /\{apple \? \(/);
  assert.match(providerOrbit, /appConfig\.authProviders\.apple \?/);
  assert.match(loginPage, /appConfig\.authProviders\.phone \?/);
  assert.match(actions, /providerEnabled/);
  assert.match(actions, /if \(!appConfig\.authProviders\.phone\)/);
});

test("removes legacy email-card language controls", async () => {
  const card = await read("components/email-auth-card.tsx");
  assert.doesNotMatch(card, /LanguageSelector/);
});
