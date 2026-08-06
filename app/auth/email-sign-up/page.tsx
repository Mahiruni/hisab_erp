import Link from "next/link";
import { AuthNotice, EmailAuthCard } from "../../../components/email-auth-card";
import { SocialAuthButtons } from "../../../components/social-auth-buttons";
import { signUpWithEmail } from "../../../lib/actions/email-auth";
import { formatEtb, getBillingPlan, getPlanAmountEtb, isBillingCycle } from "../../../lib/billing/catalog";
import { isSupabaseConfigured } from "../../../lib/config";
import { safeNextPath } from "../../../lib/validation";

export const metadata = { title: "Create your account" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; preview?: string; plan?: string; billing?: string; next?: string }> }) {
  const p = await searchParams;
  const preview = p.preview === "1";
  const plan = getBillingPlan(p.plan);
  const billingCycle = isBillingCycle(p.billing) ? p.billing : "annual";
  const planDestination = plan ? `/checkout?plan=${plan.code}&billing=${billingCycle}` : "/onboarding";
  const next = safeNextPath(p.next || planDestination);
  const loginQuery = new URLSearchParams({ next });
  if (preview) loginQuery.set("preview", "1");
  const configured = isSupabaseConfigured();

  return (
    <EmailAuthCard
      title="Create your Hisab account"
      description="Set up your secure business identity. Verify your email, then continue exactly where you left off."
      footer={<>Already have an account? <Link href={`/auth/login?${loginQuery.toString()}`}>Sign in</Link></>}
      eyebrow="Start your business workspace"
      badge="Verified identity · protected activation"
      showcaseTitle="Build a stronger operating foundation from day one."
      showcaseDescription="Create one verified identity, select the right Hisab ERP plan and launch a connected company workspace."
    >
      {!configured ? <AuthNotice type="warning">Authentication is not configured.</AuthNotice> : null}
      <AuthNotice type="error">{p.error}</AuthNotice>
      <AuthNotice type="success">{p.message}</AuthNotice>

      {plan ? (
        <div className="auth-selected-plan" aria-label={`Selected ${plan.name} plan`}>
          <span>Selected plan</span><strong>Hisab ERP {plan.name}</strong><small>ETB {formatEtb(getPlanAmountEtb(plan, billingCycle))} {billingCycle === "annual" ? "per year" : "per month"}</small>
        </div>
      ) : null}

      <SocialAuthButtons language="en" next={next} disabled={!configured} dividerText="or create your account with email" />

      <form action={signUpWithEmail} className="auth-standard-form">
        <input type="hidden" name="next" value={next}/>
        <label className="auth-standard-field" htmlFor="signup-full-name">
          <span>Full name</span>
          <input id="signup-full-name" name="fullName" autoComplete="name" maxLength={120} placeholder="Your full name" required autoFocus />
        </label>

        <label className="auth-standard-field" htmlFor="signup-email">
          <span>Business email</span>
          <input id="signup-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="name@company.com" required />
        </label>

        <div className="auth-standard-field-grid">
          <label className="auth-standard-field" htmlFor="signup-password">
            <span>Password</span>
            <input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={10} placeholder="Create a password" aria-describedby="signup-password-help" required />
          </label>
          <label className="auth-standard-field" htmlFor="signup-confirm-password">
            <span>Confirm password</span>
            <input id="signup-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} placeholder="Repeat your password" required />
          </label>
        </div>

        <p className="auth-standard-password-help" id="signup-password-help">Use at least 10 characters with uppercase, lowercase and a number.</p>

        <label className="auth-standard-consent">
          <input type="checkbox" name="acceptedTerms" value="yes" required />
          <span>I agree to the <Link href="/trust">privacy and security terms</Link> and confirm that I am authorized to represent this business.</span>
        </label>

        <button className="auth-standard-primary" type="submit" disabled={!configured}><span>{plan ? `Create account and continue to ${plan.name}` : "Create account"}</span><b aria-hidden="true">→</b></button>
      </form>
    </EmailAuthCard>
  );
}
