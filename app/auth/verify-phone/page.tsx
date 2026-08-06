import Link from "next/link";
import { LanguageSelector } from "../../../components/language-provider";
import { verifyPhoneOtp } from "../../../lib/actions/auth";
import { getServerFoundationCopy } from "../../../lib/server-locale";

export const metadata = { title: "Verify phone" };

const copy = {
  en: {
    label: "Phone verification",
    title: "Enter your security code",
    text: "We sent a 6-digit verification code to",
    code: "Verification code",
    help: "The code expires shortly. Never share it with anyone.",
    action: "Verify and continue",
    back: "Use a different number",
    asideTitle: "One last step to secure your company.",
    asideText: "Phone verification helps protect your workspace before financial records are created.",
  },
  am: {
    label: "የስልክ ማረጋገጫ",
    title: "የደህነት ኮዱን ያስገቡ",
    text: "6 አሃዝ የማረጋገጫ ኮድ ልከናል፦",
    code: "የማረጋገጫ ኮድ",
    help: "ኮዱ በቅርቡ ጊዜው ያልፋል። ለማንም አያጋሩት።",
    action: "አረጋግጥና ቀጥል",
    back: "ሌላ ቁጥር ተጠቀም",
    asideTitle: "ድርጅትዎን ለመጠበቅ አንድ የመጨረሻ እርምጃ።",
    asideText: "የስልክ ማረጋገጫ የፋይናንስ መዝገቦች ከመፈጠራቸው በፊት የሥራ ቦታዎን ይጠብቃል።",
  },
  ti: {
    label: "ምርግጋጽ ተሌፎን",
    title: "ኮድ ድሕነት ኣእትዉ",
    text: "6 ኣሃዝ ኮድ ምርግጋጽ ልኢኽናል፦",
    code: "ኮድ ምርግጋጽ",
    help: "እቲ ኮድ ብቕልጡፍ ይውዳእ። ንዝኾነ ሰብ ኣይተካፍልዎ።",
    action: "ኣረጋግጽን ቀጽልን",
    back: "ካልእ ቁጽሪ ተጠቐም",
    asideTitle: "ውድብኩም ንምሕላው ሓደ መወዳእታ ስጉምቲ።",
    asideText: "ምርግጋጽ ተሌፎን መዝገባት ፋይናንስ ቅድሚ ምፍጣሮም መስርሒ ቦታኹም ይሕሉ።",
  },
} as const;

function maskPhone(phone: string) {
  if (phone.length < 8) return phone;
  return `${phone.slice(0, 5)} ••• ••${phone.slice(-2)}`;
}

export default async function VerifyPhonePage({ searchParams }: { searchParams: Promise<{ phone?: string; error?: string; message?: string }> }) {
  const [params, localized] = await Promise.all([searchParams, getServerFoundationCopy()]);
  const c = copy[localized.language];
  const phone = params.phone || "";

  return (
    <main className="auth-page auth-premium-page auth-verify-page">
      <div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/>
      <section className="auth-shell auth-verify-shell">
        <aside className="auth-showcase auth-verify-showcase">
          <Link href="/" className="auth-showcase-brand"><span>H</span><strong>Hisab ERP</strong></Link>
          <div className="auth-showcase-content">
            <div className="verification-illustration" aria-hidden="true"><span>✓</span><i/><i/><i/></div>
            <h2>{c.asideTitle}</h2>
            <p>{c.asideText}</p>
          </div>
          <div className="auth-showcase-footer"><span>●</span>Secure identity verification</div>
        </aside>
        <section className="auth-card auth-form-panel">
          <div className="auth-top"><Link href="/" className="auth-brand auth-mobile-brand"><span>H</span><strong>Hisab ERP</strong></Link><LanguageSelector/></div>
          <div className="auth-heading">
            <p className="eyebrow">{c.label}</p>
            <h1>{c.title}</h1>
            <p>{c.text} <strong className="masked-phone">{maskPhone(phone)}</strong></p>
          </div>
          {params.error && <div className="form-alert error">{params.error}</div>}
          {params.message && <div className="form-alert success">{params.message}</div>}
          <form action={verifyPhoneOtp} className="erp-form premium-auth-form">
            <input type="hidden" name="phone" value={phone}/>
            <label className="premium-field otp-field"><span className="field-label">{c.code}</span><span className="field-control"><input name="token" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="••••••" required/></span></label>
            <small className="phone-guidance">{c.help}</small>
            <button className="primary auth-submit" type="submit" disabled={!phone}><span>{c.action}</span><b aria-hidden="true">→</b></button>
          </form>
          <p className="auth-switch"><Link href="/auth/sign-up">← {c.back}</Link></p>
        </section>
      </section>
    </main>
  );
}
