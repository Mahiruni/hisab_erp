import Link from "next/link";
import { AuthCredentialsFields } from "../../../components/auth-credentials-fields";
import { AuthNotice, EmailAuthCard } from "../../../components/email-auth-card";
import { LanguageSelector } from "../../../components/language-provider";
import { signIn } from "../../../lib/actions/auth";
import { isSupabaseConfigured } from "../../../lib/config";
import { getServerFoundationCopy } from "../../../lib/server-locale";
import { safeNextPath } from "../../../lib/validation";

export const metadata = { title: "Phone sign in" };

const copy = {
  en: {
    title: "Sign in with mobile number",
    description: "Use the mobile number registered to your Hisab account and your password to access the same protected business workspace.",
    email: "Use business email instead",
    emailHelp: "Sign in with your verified email and password.",
    submit: "Sign in securely",
    newUser: "New to Hisab?",
    create: "Create an account",
  },
  am: {
    title: "በሞባይል ቁጥር ይግቡ",
    description: "በHisab መለያዎ ላይ የተመዘገበውን ሞባይል ቁጥርና የይለፍ ቃል በመጠቀም ወደ የተጠበቀው የንግድ የሥራ ቦታዎ ይግቡ።",
    email: "በንግድ ኢሜይል ይግቡ",
    emailHelp: "በተረጋገጠ ኢሜይልና የይለፍ ቃል ይግቡ።",
    submit: "በደህንነት ይግቡ",
    newUser: "ለHisab አዲስ ነዎት?",
    create: "መለያ ይፍጠሩ",
  },
  ti: {
    title: "ብቁጽሪ ሞባይል እተዉ",
    description: "ኣብ ኣካውንት Hisab ዝተመዝገበ ቁጽሪ ሞባይልን መሕለፊ ቃልን ተጠቒምኩም ናብ ውሑስ መስርሒ ቦታ ንግዲ እተዉ።",
    email: "ብናይ ንግዲ ኢሜይል እተዉ",
    emailHelp: "ብዝተረጋገጸ ኢሜይልን መሕለፊ ቃልን እተዉ።",
    submit: "ብውሕስነት እተዉ",
    newUser: "ኣብ Hisab ሓድሽ ዲኹም?",
    create: "ኣካውንት ፍጠሩ",
  },
} as const;

export default async function PhoneLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string; preview?: string }> }) {
  const [params, localized] = await Promise.all([searchParams, getServerFoundationCopy()]);
  const p = copy[localized.language];
  const configured = isSupabaseConfigured();
  const next = safeNextPath(params.next || "/");
  const preview = params.preview === "1";

  return (
    <EmailAuthCard
      title={p.title}
      description={p.description}
      footer={<>{p.newUser} <Link href={`/auth/sign-up${preview ? "?preview=1" : ""}`}>{p.create}</Link></>}
      eyebrow="Secure mobile access"
      badge="Verified mobile identity · protected session"
      showcaseTitle="One Hisab identity, whichever secure method you use."
      showcaseDescription="Move between email and mobile access without changing your organization, permissions or business data."
    >
      <div className="auth-standard-language-row"><LanguageSelector /></div>
      {!configured ? <AuthNotice type="warning">Authentication is not configured.</AuthNotice> : null}
      <AuthNotice type="error">{params.error}</AuthNotice>
      <AuthNotice type="success">{params.message}</AuthNotice>

      <form action={signIn} className="auth-standard-form auth-standard-phone-form">
        <input type="hidden" name="next" value={next} />
        <AuthCredentialsFields mode="sign-in" language={localized.language} />
        <button className="auth-standard-primary" type="submit" disabled={!configured}><span>{p.submit}</span><b aria-hidden="true">→</b></button>
      </form>

      <Link className="auth-method-card" href={`/auth/login?next=${encodeURIComponent(next)}${preview ? "&preview=1" : ""}`}>
        <span aria-hidden="true">✉</span>
        <div><strong>{p.email}</strong><small>{p.emailHelp}</small></div>
        <b aria-hidden="true">→</b>
      </Link>
    </EmailAuthCard>
  );
}
