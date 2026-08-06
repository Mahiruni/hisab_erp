import { AuthNotice, EmailAuthCard } from "../../../components/email-auth-card";
import { updatePassword } from "../../../lib/actions/email-auth";

export const metadata = { title: "Choose new password" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const p = await searchParams;
  return <EmailAuthCard title="Choose a new password" description="For security, changing your password signs out your other sessions."><AuthNotice type="error">{p.error}</AuthNotice><form action={updatePassword} className="erp-form premium-auth-form"><label className="premium-field"><span className="field-label">New password</span><span className="field-control"><input name="password" type="password" autoComplete="new-password" minLength={12} required/></span><small>Use at least 12 characters with uppercase, lowercase and a number.</small></label><label className="premium-field"><span className="field-label">Confirm new password</span><span className="field-control"><input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required/></span></label><button className="primary auth-submit" type="submit">Update password</button></form></EmailAuthCard>;
}
