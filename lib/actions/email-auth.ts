"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appConfig, isSupabaseConfigured } from "../config";
import { assertPasswordIsSafe } from "../security/password-safety";
import { createAdminClient } from "../supabase/admin";
import { createClient } from "../supabase/server";
import { requiredText, safeNextPath, ValidationError } from "../validation";

const genericMessage = "If the account can receive email, we sent the next step.";
const genericLoginError = "The email or password is incorrect, or the account is not ready.";
const genericSignupError = "We could not complete account creation right now. Please try again shortly.";
const existingAccountMessage = "This email may already belong to an account. Sign in, request a secure email link, or create an email password through password recovery.";
const providerPasswordHelp = "If you originally joined with Google, use Forgot password to create an email password for the same account.";

function normalizeEmail(value: FormDataEntryValue | null) {
  const email = requiredText(value, "email", 254).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError({ email: "Enter a valid email address." });
  return email;
}

function readPassword(value: FormDataEntryValue | null, min = 10) {
  const result = requiredText(value, "password", 200);
  if (result.length < min || !/[a-z]/.test(result) || !/[A-Z]/.test(result) || !/\d/.test(result)) {
    throw new ValidationError({ password: `Use at least ${min} characters with uppercase, lowercase and a number.` });
  }
  return result;
}

function validationMessage(error: unknown, fallback: string) {
  return error instanceof ValidationError ? Object.values(error.fields)[0] || error.message : fallback;
}

function confirmationUrl(next: string) {
  return `${appConfig.appUrl}/auth/confirm?next=${encodeURIComponent(next)}`;
}

function loginErrorMessage(code?: string) {
  if (code === "email_not_confirmed") return "Confirm your email before signing in.";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") return "Too many attempts. Wait a moment and try again.";
  if (code === "invalid_credentials") return `${genericLoginError} ${providerPasswordHelp}`;
  return genericLoginError;
}

function loginReason(code?: string) {
  if (code === "email_not_confirmed") return "email-not-confirmed";
  if (code === "invalid_credentials") return "password-or-provider";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") return "rate-limited";
  return "sign-in-failed";
}

async function requestMetadata() {
  const requestHeaders = await headers();
  return {
    ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    userAgent: requestHeaders.get("user-agent")?.slice(0, 500) || null,
  };
}

async function recordLoginAttempt(email: string, succeeded: boolean, userId: string | null, reason: string | null, metadata: Awaited<ReturnType<typeof requestMetadata>>) {
  try {
    const admin = createAdminClient();
    await admin.from("login_attempts").insert({
      user_id: userId,
      identifier_hash: createHash("sha256").update(email).digest("hex"),
      succeeded,
      failure_reason: reason?.slice(0, 120) || null,
      ip_address: metadata.ip,
      user_agent: metadata.userAgent,
    });
  } catch {
    // Optional audit storage must never disclose account state or block authentication.
  }
}

export async function signUpWithEmail(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/email-sign-up?error=Authentication+is+not+configured");
  const next = safeNextPath(formData.get("next") || "/onboarding");

  let email: string;
  let secret: string;
  let fullName: string;
  try {
    email = normalizeEmail(formData.get("email"));
    secret = readPassword(formData.get("password"));
    await assertPasswordIsSafe(secret);
    const confirmation = requiredText(formData.get("confirmPassword"), "confirm password", 200);
    if (secret !== confirmation) throw new ValidationError({ confirmPassword: "Passwords must match." });
    fullName = requiredText(formData.get("fullName"), "full name", 120);
    if (formData.get("acceptedTerms") !== "yes") throw new ValidationError({ acceptedTerms: "Accept the privacy and security terms to continue." });
  } catch (error) {
    redirect(`/auth/email-sign-up?error=${encodeURIComponent(validationMessage(error, "Check the form and try again."))}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: secret,
    options: {
      emailRedirectTo: confirmationUrl(next),
      data: { full_name: fullName, terms_accepted_at: new Date().toISOString() },
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      redirect(`/auth/login?message=${encodeURIComponent(existingAccountMessage)}&reason=existing-account&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
    }

    const message = error.code === "over_email_send_rate_limit"
      ? "Too many verification emails were requested. Wait a moment and try again."
      : genericSignupError;
    redirect(`/auth/email-sign-up?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`);
  }

  if (data.session) redirect(next);

  // Supabase can deliberately return an obfuscated user with no identities when the
  // address is already registered. Guide the person to sign-in/recovery without
  // definitively disclosing whether an account exists.
  if (Array.isArray(data.user?.identities) && data.user.identities.length === 0) {
    redirect(`/auth/login?message=${encodeURIComponent(existingAccountMessage)}&reason=existing-account&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
  }

  redirect(`/auth/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
}

export async function signInWithEmail(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/login?error=Authentication+is+not+configured");
  const next = safeNextPath(formData.get("next"));

  let email: string;
  let secret: string;
  try {
    email = normalizeEmail(formData.get("email"));
    secret = requiredText(formData.get("password"), "password", 200);
  } catch {
    redirect(`/auth/login?error=${encodeURIComponent(genericLoginError)}&reason=sign-in-failed&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const metadata = await requestMetadata();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: secret });
  if (error || !data.user) {
    await recordLoginAttempt(email, false, null, error?.code || "invalid_credentials", metadata);
    redirect(`/auth/login?error=${encodeURIComponent(loginErrorMessage(error?.code))}&reason=${encodeURIComponent(loginReason(error?.code))}&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
  }

  await recordLoginAttempt(email, true, data.user.id, null, metadata);
  const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id", data.user.id).eq("is_active", true).order("is_default", { ascending: false }).limit(1).maybeSingle();
  await supabase.rpc("record_auth_audit", {
    p_event_type: "auth.sign_in.succeeded",
    p_organization_id: membership?.organization_id || null,
    p_ip_address: metadata.ip,
    p_user_agent: metadata.userAgent,
    p_metadata: { provider: "email" },
  });
  redirect(next);
}

export async function requestPasswordReset(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/forgot-password?error=Authentication+is+not+configured");
  const next = safeNextPath(formData.get("next") || "/");
  let email = "";
  try {
    email = normalizeEmail(formData.get("email"));
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: confirmationUrl("/auth/reset-password") });
  } catch {
    // Deliberately identical response to prevent account enumeration.
  }
  const emailQuery = email ? `&email=${encodeURIComponent(email)}` : "";
  redirect(`/auth/forgot-password?message=${encodeURIComponent(genericMessage)}&next=${encodeURIComponent(next)}${emailQuery}`);
}

export async function requestMagicLink(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/magic-link?error=Authentication+is+not+configured");
  try {
    const email = normalizeEmail(formData.get("email"));
    const next = safeNextPath(formData.get("next"));
    const supabase = await createClient();
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: confirmationUrl(next), shouldCreateUser: false } });
  } catch {
    // Deliberately identical response to prevent account enumeration.
  }
  redirect(`/auth/magic-link?message=${encodeURIComponent(genericMessage)}`);
}

export async function resendEmailConfirmation(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/verify-email?error=Authentication+is+not+configured");
  const next = safeNextPath(formData.get("next") || "/onboarding");

  let email = "";
  try {
    email = normalizeEmail(formData.get("email"));
    const supabase = await createClient();
    await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: confirmationUrl(next) } });
  } catch {
    // Deliberately identical response to prevent account enumeration.
  }

  const emailQuery = email ? `&email=${encodeURIComponent(email)}` : "";
  redirect(`/auth/verify-email?message=${encodeURIComponent(genericMessage)}&next=${encodeURIComponent(next)}${emailQuery}`);
}

export async function updatePassword(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/reset-password?error=Authentication+is+not+configured");

  let secret: string;
  try {
    secret = readPassword(formData.get("password"), 12);
    await assertPasswordIsSafe(secret);
    const confirmation = requiredText(formData.get("confirmPassword"), "confirm password", 200);
    if (secret !== confirmation) throw new ValidationError({ confirmPassword: "Passwords must match." });
  } catch (error) {
    redirect(`/auth/reset-password?error=${encodeURIComponent(validationMessage(error, "Check the new password and try again."))}`);
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/auth/invalid-link");
  const { error } = await supabase.auth.updateUser({ password: secret });
  if (error) redirect(`/auth/reset-password?error=${encodeURIComponent("The reset link is invalid or expired.")}`);
  await supabase.rpc("record_auth_audit", { p_event_type: "auth.password.changed", p_metadata: { source: "recovery" } });
  await supabase.auth.signOut({ scope: "global" });
  redirect("/auth/login?message=Password+updated.+Sign+in+again+with+your+new+password.");
}
