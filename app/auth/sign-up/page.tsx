import Link from "next/link";
import { AuthCredentialsFields } from "../../../components/auth-credentials-fields";
import { LanguageSelector } from "../../../components/language-provider";
import { SocialAuthButtons } from "../../../components/social-auth-buttons";
import { signUp } from "../../../lib/actions/auth";
import { isSupabaseConfigured } from "../../../lib/config";
import { getServerFoundationCopy } from "../../../lib/server-locale";

export const metadata = { title: "Create account" };

const officialCopy = {
  en: {
    badge: "Business starts here",
    title: "Build your company on a trusted operating platform.",
    text: "Bring finance, customers, inventory, sales and team operations into one controlled workspace.",
    owner: "Clear ownership",
    ownerText: "Your first verified account leads company setup.",
    protected: "Business-grade controls",
    protectedText: "Roles, audit trails and organization-level data isolation.",
    heading: "Create your HisabTech account",
    helper: "Choose a secure sign-up method. You can create or join a company after verification.",
    email: "Continue with email",
    emailHelp: "Recommended for account recovery and administrator access.",
    mobileTitle: "Create with mobile number",
    mobileHelp: "Use a registered mobile number and a strong password.",
    divider: "or choose another sign-up method",
    sms: "Mobile verification availability depends on your organization’s messaging configuration.",
    legal: "By creating an account, you confirm that you are authorized to represent this business.",
    trust: "Designed for disciplined, growing businesses",
  },
  am: {
    badge: "ንግድዎ እዚህ ይጀምራል",
    title: "ድርጅትዎን በታመነ የሥራ መድረክ ላይ ይገንቡ።",
    text: "ፋይናንስ፣ ደንበኞች፣ ክምችት፣ ሽያጭና የቡድን ሥራዎችን በአንድ ቁጥጥር ያለው መስሪያ ቦታ ያዋህዱ።",
    owner: "ግልጽ ባለቤትነት",
    ownerText: "የመጀመሪያው የተረጋገጠ መለያ የድርጅቱን ማዋቀር ይመራል።",
    protected: "የንግድ ደረጃ ቁጥጥር",
    protectedText: "ሚናዎች፣ የኦዲት መዝገብና የድርጅት ውሂብ መለያየት።",
    heading: "የHisabTech መለያዎን ይፍጠሩ",
    helper: "ደህንነቱ የተጠበቀ የመመዝገቢያ ዘዴ ይምረጡ። ከማረጋገጫ በኋላ ድርጅት መፍጠር ወይም መቀላቀል ይችላሉ።",
    email: "በኢሜይል ይቀጥሉ",
    emailHelp: "ለመለያ መልሶ ማግኛና ለአስተዳዳሪ መግቢያ ይመከራል።",
    mobileTitle: "በሞባይል ቁጥር ይፍጠሩ",
    mobileHelp: "የተመዘገበ ሞባይል ቁጥርና ጠንካራ የይለፍ ቃል ይጠቀሙ።",
    divider: "ወይም ሌላ የመመዝገቢያ ዘዴ ይምረጡ",
    sms: "የሞባይል ማረጋገጫ መገኘት በድርጅትዎ የመልዕክት ውቅር ላይ ይመሰረታል።",
    legal: "መለያ በመፍጠር ይህን ንግድ ለመወከል ሥልጣን እንዳለዎት ያረጋግጣሉ።",
    trust: "ለተደራጀና ለሚያድግ ንግድ የተነደፈ",
  },
  ti: {
    badge: "ንግድኹም ኣብዚ ይጅምር",
    title: "ውድብኩም ኣብ ዝተኣመነ መድረኽ ስርሓት ሃንጹ።",
    text: "ፋይናንስ፣ ዓማዊል፣ ስቶክ፣ ሽያጥን ስርሓት ጉጅለን ኣብ ሓደ ዝተቖጻጸረ መስርሒ ቦታ ኣዋህዱ።",
    owner: "ንጹር ዋንነት",
    ownerText: "ቀዳማይ ዝተረጋገጸ ኣካውንት ምውቓር ውድብ ይመርሕ።",
    protected: "ቁጽጽር ደረጃ ንግዲ",
    protectedText: "ተራታት፣ መዝገብ ኦዲትን ምፍላይ ዳታ ውድብን።",
    heading: "ኣካውንት HisabTech ፍጠሩ",
    helper: "ውሑስ መንገዲ ምዝገባ ምረጹ። ድሕሪ ምርግጋጽ ውድብ ክትፈጥሩ ወይ ክትጽንበሩ ትኽእሉ።",
    email: "ብኢሜይል ቀጽሉ",
    emailHelp: "ንምምላስ ኣካውንትን መእተዊ ኣመሓዳሪን ይምከር።",
    mobileTitle: "ብቁጽሪ ሞባይል ፍጠሩ",
    mobileHelp: "ዝተመዝገበ ቁጽሪ ሞባይልን ጽኑዕ መሕለፊ ቃልን ተጠቐሙ።",
    divider: "ወይ ካልእ መንገዲ ምዝገባ ምረጹ",
    sms: "ምርግጋጽ ሞባይል ብውቅር መልእኽቲ ውድብኩም ይውሰን።",
    legal: "ኣካውንት ብምፍጣር ነዚ ንግዲ ክትውክሉ ስልጣን ከምዘለኩም ተረጋግጹ።",
    trust: "ንዝተዋደደን ዝዓብን ንግዲ ዝተነድፈ",
  },
} as const;

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [params, localized] = await Promise.all([searchParams, getServerFoundationCopy()]);
  const c = localized.copy.auth;
  const p = officialCopy[localized.language];
  const configured = isSupabaseConfigured();

  return (
    <main className="auth-page auth-premium-page auth-signup-page auth-official-page">
      <section className="auth-shell auth-shell-wide auth-official-shell">
        <aside className="auth-showcase auth-official-showcase">
          <Link href="/" className="auth-showcase-brand auth-official-brand"><span>H</span><strong>HisabTech</strong></Link>
          <div className="auth-showcase-content">
            <span className="auth-badge auth-official-badge"><i/> {p.badge}</span>
            <h2>{p.title}</h2>
            <p>{p.text}</p>
            <div className="auth-benefits auth-official-benefits">
              <div><span className="benefit-icon" aria-hidden="true">◇</span><strong>{p.owner}</strong><small>{p.ownerText}</small></div>
              <div><span className="benefit-icon" aria-hidden="true">✓</span><strong>{p.protected}</strong><small>{p.protectedText}</small></div>
            </div>
          </div>
          <div className="auth-showcase-footer"><span>●</span>{p.trust}</div>
        </aside>

        <section className="auth-card auth-form-panel auth-official-form-panel">
          <div className="auth-official-form-wrap">
            <div className="auth-top">
              <Link href="/" className="auth-brand auth-mobile-brand"><span>H</span><strong>HisabTech</strong></Link>
              <LanguageSelector/>
            </div>
            <div className="auth-heading auth-official-heading">
              <p className="eyebrow">HisabTech</p>
              <h1>{p.heading}</h1>
              <p>{p.helper}</p>
            </div>
            {!configured && <div className="form-alert warning">{c.supabaseMissing}</div>}
            {params.error && <div className="form-alert error" role="alert">{params.error}</div>}
            <SocialAuthButtons language={localized.language} next="/onboarding" disabled={!configured} dividerText={p.divider}/>
            <Link className="auth-method-card" href="/auth/email-sign-up">
              <span aria-hidden="true">✉</span>
              <div><strong>{p.email}</strong><small>{p.emailHelp}</small></div>
              <b aria-hidden="true">→</b>
            </Link>
            <div className="auth-choice-divider"><span>{p.mobileTitle}</span></div>
            <div className="auth-phone-section-heading"><strong>{p.mobileTitle}</strong><span>{p.mobileHelp}</span></div>
            <form action={signUp} className="erp-form premium-auth-form premium-signup-form auth-official-form">
              <div className="identity-grid">
                <label className="premium-field"><span className="field-label">{c.fullName}</span><span className="field-control"><input name="fullName" autoComplete="name" required maxLength={120}/></span></label>
                <label className="premium-field"><span className="field-label">{c.organizationName}</span><span className="field-control"><input name="organizationName" autoComplete="organization" required maxLength={160}/></span></label>
              </div>
              <AuthCredentialsFields mode="sign-up" language={localized.language} passwordHelp={c.passwordHelp}/>
              <div className="auth-official-note"><span aria-hidden="true">✓</span><p>{p.sms}</p></div>
              <button className="primary auth-submit auth-primary-button" type="submit" disabled={!configured}><span>{c.create}</span><b aria-hidden="true">→</b></button>
            </form>
            <p className="auth-legal-note">{p.legal}</p>
            <p className="auth-switch auth-account-switch">{c.existing} <Link href="/auth/login">{c.signIn}</Link></p>
          </div>
        </section>
      </section>
    </main>
  );
}
