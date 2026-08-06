import Link from "next/link";
import { AuthCredentialsFields } from "../../../components/auth-credentials-fields";
import { LanguageSelector } from "../../../components/language-provider";
import { signIn } from "../../../lib/actions/auth";
import { isSupabaseConfigured } from "../../../lib/config";
import { getServerFoundationCopy } from "../../../lib/server-locale";

export const metadata = { title: "Phone sign in" };

const copy = {
  en: {
    badge: "Secure mobile access",
    title: "Sign in with the mobile number registered to your account.",
    text: "Use a verified phone identity to access your organization while keeping the same role and security controls.",
    heading: "Sign in with mobile number",
    helper: "Select your country, enter your registered number and use your account password.",
    email: "Use business email instead",
    trust: "Protected access · Organization-isolated records",
  },
  am: {
    badge: "ደህንነቱ የተጠበቀ የሞባይል መግቢያ",
    title: "በመለያዎ ላይ በተመዘገበው የሞባይል ቁጥር ይግቡ።",
    text: "ተመሳሳይ ሚናና የደህንነት ቁጥጥር እንደተጠበቀ በተረጋገጠ የስልክ መለያ ወደ ድርጅትዎ ይግቡ።",
    heading: "በሞባይል ቁጥር ይግቡ",
    helper: "አገርዎን ይምረጡ፣ የተመዘገበውን ቁጥር ያስገቡና የመለያዎን የይለፍ ቃል ይጠቀሙ።",
    email: "በንግድ ኢሜይል ይግቡ",
    trust: "የተጠበቀ መግቢያ · የድርጅት መዝገቦች ተለይተው የተጠበቁ",
  },
  ti: {
    badge: "ውሑስ መእተዊ ሞባይል",
    title: "ብኣብ ኣካውንትኩም ዝተመዝገበ ቁጽሪ ሞባይል እተዉ።",
    text: "ተመሳሳሊ ተራን ቁጽጽር ድሕነትን እናተሓለወ ብዝተረጋገጸ መንነት ተሌፎን ናብ ውድብኩም እተዉ።",
    heading: "ብቁጽሪ ሞባይል እተዉ",
    helper: "ሃገርኩም ምረጹ፣ ዝተመዝገበ ቁጽሪ ኣእትዉን መሕለፊ ቃል ኣካውንትኩም ተጠቐሙን።",
    email: "ብናይ ንግዲ ኢሜይል እተዉ",
    trust: "ዝተሓለወ መእተዊ · ዝተፈልየ መዝገብ ውድብ",
  },
} as const;

export default async function PhoneLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string; preview?: string }> }) {
  const [params, localized] = await Promise.all([searchParams, getServerFoundationCopy()]);
  const c = localized.copy.auth;
  const p = copy[localized.language];
  const configured = isSupabaseConfigured();
  const next = params.next || "/";
  const preview = params.preview === "1";

  return (
    <main className="auth-page auth-premium-page auth-official-page">
      <section className="auth-shell auth-official-shell">
        <aside className="auth-showcase auth-official-showcase">
          <Link href="/" className="auth-showcase-brand auth-official-brand"><span>H</span><strong>HisabTech</strong></Link>
          <div className="auth-showcase-content"><span className="auth-badge auth-official-badge"><i/> {p.badge}</span><h2>{p.title}</h2><p>{p.text}</p></div>
          <div className="auth-showcase-footer"><span>●</span>{p.trust}</div>
        </aside>
        <section className="auth-card auth-form-panel auth-official-form-panel">
          <div className="auth-official-form-wrap">
            <div className="auth-top"><Link href="/" className="auth-brand auth-mobile-brand"><span>H</span><strong>HisabTech</strong></Link><LanguageSelector/></div>
            <div className="auth-heading auth-official-heading"><p className="eyebrow">HisabTech</p><h1>{p.heading}</h1><p>{p.helper}</p></div>
            {!configured && <div className="form-alert warning">Authentication is not configured.</div>}
            {params.error && <div className="form-alert error" role="alert">{params.error}</div>}
            {params.message && <div className="form-alert success" role="status">{params.message}</div>}
            <form action={signIn} className="erp-form premium-auth-form auth-official-form">
              <input type="hidden" name="next" value={next}/>
              <AuthCredentialsFields mode="sign-in" language={localized.language}/>
              <button className="primary auth-submit auth-primary-button" type="submit" disabled={!configured}><span>{c.signIn}</span><b aria-hidden="true">→</b></button>
            </form>
            <Link className="auth-method-card" href={`/auth/login?next=${encodeURIComponent(next)}${preview ? "&preview=1" : ""}`}><span aria-hidden="true">✉</span><div><strong>{p.email}</strong><small>{localized.language === "en" ? "Use your verified email and password." : p.helper}</small></div><b aria-hidden="true">→</b></Link>
            <p className="auth-switch auth-account-switch">{c.newUser} <Link href={`/auth/sign-up${preview ? "?preview=1" : ""}`}>{c.createAccount}</Link></p>
          </div>
        </section>
      </section>
    </main>
  );
}
