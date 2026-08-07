import { AuthNotice, EmailAuthCard } from "../../../components/email-auth-card";
import { updatePassword } from "../../../lib/actions/email-auth";

export const metadata = { title: "Choose new password" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const p = await searchParams;

  return (
    <EmailAuthCard
      title="Choose a new password"
      description="Set a strong new password for your Hisab account. For security, changing it signs out your other active sessions."
      eyebrow="Protected credential update"
      badge="Secure recovery · session protection"
      showcaseTitle="Restore access without compromising your workspace."
      showcaseDescription="Your company data, roles and business context stay exactly where they are while your credentials are securely updated."
    >
      <AuthNotice type="error">{p.error}</AuthNotice>

      <form action={updatePassword} className="auth-standard-form">
        <label className="auth-standard-field" htmlFor="new-password">
          <span>New password</span>
          <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} placeholder="Create a strong password" required autoFocus />
        </label>
        <label className="auth-standard-field" htmlFor="confirm-new-password">
          <span>Confirm new password</span>
          <input id="confirm-new-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} placeholder="Repeat your new password" required />
        </label>
        <p className="auth-standard-password-help">Use at least 12 characters with uppercase, lowercase and a number.</p>
        <button className="auth-standard-primary" type="submit">
          <span>Update password securely</span><b aria-hidden="true">→</b>
        </button>
      </form>
    </EmailAuthCard>
  );
}
