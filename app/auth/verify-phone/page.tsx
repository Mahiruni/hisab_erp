import Link from "next/link";
import { AuthNotice, EmailAuthCard } from "../../../components/email-auth-card";
import { LanguageSelector } from "../../../components/language-provider";
import { verifyPhoneOtp } from "../../../lib/actions/auth";
import { getServerFoundationCopy } from "../../../lib/server-locale";

export const metadata = { title: "Verify phone" };

const copy = {
  en: { title: "Enter your security code", description: "We sent a 6-digit verification code to", code: "Verification code", help: "The code expires shortly. Never share it with anyone.", action: "Verify and continue", back: "Use a different number" },
  am: { title: "የደህነት ኮዱን ያስገቡ", description: "6 አሃዝ የማረጋገጫ ኮድ ልከናል፦", code: "የማረጋገጫ ኮድ", help: "ኮዱ በቅርቡ ጊዜው ያልፋል። ለማንም አያጋሩት።", action: "አረጋግጥና ቀጥል", back: "ሌላ ቁጥር ተጠቀም" },
  ti: { title: "ኮድ ድሕነት ኣእትዉ", description: "6 ኣሃዝ ኮድ ምርግጋጽ ልኢኽናል፦", code: "ኮድ ምርግጋጽ", help: "እቲ ኮድ ብቕልጡፍ ይውዳእ። ንዝኾነ ሰብ ኣይተካፍልዎ።", action: "ኣረጋግጽን ቀጽልን", back: "ካልእ ቁጽሪ ተጠቐም" },
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
    <EmailAuthCard
      title={c.title}
      description={<>{c.description} <strong className="auth-standard-masked-phone">{maskPhone(phone)}</strong></>}
      footer={<Link href="/auth/sign-up">← {c.back}</Link>}
      eyebrow="Phone verification"
      badge="6-digit verification · protected activation"
      showcaseTitle="One last step to secure your company."
      showcaseDescription="Phone verification protects your workspace before financial records and organization access are activated."
    >
      <div className="auth-standard-language-row"><LanguageSelector /></div>
      <AuthNotice type="error">{params.error}</AuthNotice>
      <AuthNotice type="success">{params.message}</AuthNotice>

      <form action={verifyPhoneOtp} className="auth-standard-form">
        <input type="hidden" name="phone" value={phone} />
        <label className="auth-standard-field" htmlFor="phone-verification-code">
          <span>{c.code}</span>
          <input id="phone-verification-code" className="auth-standard-otp-input" name="token" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="••••••" required autoFocus />
        </label>
        <p className="auth-standard-password-help">{c.help}</p>
        <button className="auth-standard-primary" type="submit" disabled={!phone}><span>{c.action}</span><b aria-hidden="true">→</b></button>
      </form>
    </EmailAuthCard>
  );
}
