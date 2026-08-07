import Link from "next/link";
import { AuthCredentialsFields } from "../../../components/auth-credentials-fields";
import { AuthNotice, EmailAuthCard } from "../../../components/email-auth-card";
import { LanguageSelector } from "../../../components/language-provider";
import { SocialAuthButtons } from "../../../components/social-auth-buttons";
import { signUp } from "../../../lib/actions/auth";
import { isSupabaseConfigured } from "../../../lib/config";
import { getServerFoundationCopy } from "../../../lib/server-locale";

export const metadata = { title: "Create account" };

const copy = {
  en: {
    title: "Create your Hisab account",
    description: "Choose the sign-up method that works best for you. After verification, you can create or join your company workspace.",
    email: "Continue with business email",
    emailHelp: "Recommended for administrator access and reliable account recovery.",
    phone: "Create with mobile number",
    phoneHelp: "Use your registered mobile number and a strong password.",
    legal: "By creating an account, you confirm that you are authorized to represent this business.",
    create: "Create account",
    existing: "Already have an account?",
    signIn: "Sign in",
  },
  am: {
    title: "የHisab መለያዎን ይፍጠሩ",
    description: "ለእርስዎ የሚመችዎትን የመመዝገቢያ ዘዴ ይምረጡ። ከማረጋገጫ በኋላ የድርጅት የሥራ ቦታ መፍጠር ወይም መቀላቀል ይችላሉ።",
    email: "በንግድ ኢሜይል ይቀጥሉ",
    emailHelp: "ለአስተዳዳሪ መግቢያና ለመለያ መልሶ ማግኛ ይመከራል።",
    phone: "በሞባይል ቁጥር ይፍጠሩ",
    phoneHelp: "የተመዘገበ ሞባይል ቁጥርና ጠንካራ የይለፍ ቃል ይጠቀሙ።",
    legal: "መለያ በመፍጠር ይህን ንግድ ለመወከል ሥልጣን እንዳለዎት ያረጋግጣሉ።",
    create: "መለያ ይፍጠሩ",
    existing: "መለያ አለዎት?",
    signIn: "ይግቡ",
  },
  ti: {
    title: "ኣካውንት Hisab ፍጠሩ",
    description: "ንዓኹም ዝሰማማዕ መንገዲ ምዝገባ ምረጹ። ድሕሪ ምርግጋጽ መስርሒ ቦታ ውድብ ክትፈጥሩ ወይ ክትጽንበሩ ትኽእሉ።",
    email: "ብናይ ንግዲ ኢሜይል ቀጽሉ",
    emailHelp: "ንመእተዊ ኣመሓዳሪን ምምላስ ኣካውንትን ይምከር።",
    phone: "ብቁጽሪ ሞባይል ፍጠሩ",
    phoneHelp: "ዝተመዝገበ ቁጽሪ ሞባይልን ጽኑዕ መሕለፊ ቃልን ተጠቐሙ።",
    legal: "ኣካውንት ብምፍጣር ነዚ ንግዲ ክትውክሉ ስልጣን ከምዘለኩም ተረጋግጹ።",
    create: "ኣካውንት ፍጠሩ",
    existing: "ኣካውንት ኣለኩም?",
    signIn: "እተዉ",
  },
} as const;

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [params, localized] = await Promise.all([searchParams, getServerFoundationCopy()]);
  const p = copy[localized.language];
  const configured = isSupabaseConfigured();

  return (
    <EmailAuthCard
      title={p.title}
      description={p.description}
      footer={<>{p.existing} <Link href="/auth/login">{p.signIn}</Link></>}
      eyebrow="Start your business workspace"
      badge="Verified identity · protected activation"
      showcaseTitle="Build your company on a trusted operating platform."
      showcaseDescription="Bring finance, customers, inventory, sales and team operations into one secure Hisab workspace."
    >
      <div className="auth-standard-language-row"><LanguageSelector /></div>
      {!configured ? <AuthNotice type="warning">Authentication is not configured.</AuthNotice> : null}
      <AuthNotice type="error">{params.error}</AuthNotice>

      <SocialAuthButtons language={localized.language} next="/onboarding" disabled={!configured} dividerText="or choose another sign-up method" />

      <Link className="auth-method-card" href="/auth/email-sign-up">
        <span aria-hidden="true">✉</span>
        <div><strong>{p.email}</strong><small>{p.emailHelp}</small></div>
        <b aria-hidden="true">→</b>
      </Link>

      <div className="auth-choice-divider"><span>{p.phone}</span></div>
      <div className="auth-phone-section-heading"><strong>{p.phone}</strong><span>{p.phoneHelp}</span></div>

      <form action={signUp} className="auth-standard-form auth-standard-phone-form">
        <div className="auth-standard-field-grid auth-standard-identity-grid">
          <label className="auth-standard-field">
            <span>Full name</span>
            <input name="fullName" autoComplete="name" maxLength={120} placeholder="Your full name" required />
          </label>
          <label className="auth-standard-field">
            <span>Organization name</span>
            <input name="organizationName" autoComplete="organization" maxLength={160} placeholder="Business or organization" required />
          </label>
        </div>
        <AuthCredentialsFields mode="sign-up" language={localized.language} />
        <div className="auth-official-note"><span aria-hidden="true">✓</span><p>Mobile verification availability depends on your organization’s messaging configuration.</p></div>
        <button className="auth-standard-primary" type="submit" disabled={!configured}><span>{p.create}</span><b aria-hidden="true">→</b></button>
      </form>

      <p className="auth-legal-note">{p.legal}</p>
    </EmailAuthCard>
  );
}
