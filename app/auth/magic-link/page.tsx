import Link from "next/link";
import { AuthNotice, EmailAuthCard } from "../../../components/email-auth-card";
import { requestMagicLink } from "../../../lib/actions/email-auth";

export const metadata = { title: "Magic link" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string }> }) {
  const p = await searchParams;
  return <EmailAuthCard title="Email me a sign-in link" description="The single-use link expires according to your Supabase Auth policy." footer={<Link href="/auth/email-login">Use password instead</Link>}><AuthNotice type="error">{p.error}</AuthNotice><AuthNotice type="success">{p.message}</AuthNotice><form action={requestMagicLink} className="erp-form premium-auth-form"><input type="hidden" name="next" value={p.next || "/"}/><label className="premium-field"><span className="field-label">Email</span><span className="field-control"><input name="email" type="email" autoComplete="email" required/></span></label><button className="primary auth-submit" type="submit">Send secure link</button></form></EmailAuthCard>;
}
