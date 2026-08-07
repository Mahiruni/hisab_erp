import Link from "next/link";
import { AuthNotice, EmailAuthCard } from "../../../components/email-auth-card";
import { requestMagicLink } from "../../../lib/actions/email-auth";
import { isSupabaseConfigured } from "../../../lib/config";
import { safeNextPath } from "../../../lib/validation";

export const metadata = { title: "Secure sign-in link" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string }> }) {
  const p = await searchParams;
  const configured = isSupabaseConfigured();
  const next = safeNextPath(p.next || "/");

  return (
    <EmailAuthCard
      title="Email me a secure sign-in link"
      description="Enter your business email and we’ll send a single-use link that returns you safely to your Hisab workspace."
      footer={<Link href={`/auth/login?next=${encodeURIComponent(next)}`}>Use password instead</Link>}
      eyebrow="Passwordless secure access"
      badge="Single-use link · protected session"
      showcaseTitle="Secure access without another password to remember."
      showcaseDescription="Use a verified business email to enter Hisab while keeping the same organization, permissions and workspace context."
    >
      {!configured ? <AuthNotice type="warning">Authentication is not configured.</AuthNotice> : null}
      <AuthNotice type="error">{p.error}</AuthNotice>
      <AuthNotice type="success">{p.message}</AuthNotice>

      <form action={requestMagicLink} className="auth-standard-form">
        <input type="hidden" name="next" value={next} />
        <label className="auth-standard-field" htmlFor="magic-link-email">
          <span>Business email</span>
          <input id="magic-link-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="name@company.com" required autoFocus />
        </label>
        <button className="auth-standard-primary" type="submit" disabled={!configured}>
          <span>Send secure sign-in link</span><b aria-hidden="true">→</b>
        </button>
      </form>
      <p className="auth-legal-note">The link is single-use and expires according to your Hisab authentication security policy.</p>
    </EmailAuthCard>
  );
}
