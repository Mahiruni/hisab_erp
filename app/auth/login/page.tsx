import Link from "next/link";
import { AuthNotice } from "../../../components/email-auth-card";
import { LoginPasswordField } from "../../../components/login-password-field";
import { SocialAuthButtons } from "../../../components/social-auth-buttons";
import { Icon } from "../../../components/ui/icon";
import { signInWithEmail } from "../../../lib/actions/email-auth";
import { appConfig, isSupabaseConfigured } from "../../../lib/config";
import { getServerFoundationCopy } from "../../../lib/server-locale";
import { safeNextPath } from "../../../lib/validation";

export const metadata = { title: "Sign in" };

const loginCopy = {
  en: {
    title: "Welcome back",
    description: "Sign in to continue to your Hisab business workspace.",
    email: "Business email",
    emailPlaceholder: "name@company.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    submit: "Sign in to Hisab",
    divider: "or continue with email",
    magic: "Email me a secure sign-in link",
    forgot: "Forgot password?",
    phone: "Use mobile number instead",
    newUser: "New to Hisab?",
    create: "Create your workspace",
    passwordHelpTitle: "Need email and password access?",
    passwordHelp: "If this email was first registered with Google, create a password securely without creating a second account.",
    passwordHelpAction: "Create or reset email password",
    confirmationHelp: "Your email still needs verification before password sign-in is available.",
    confirmationAction: "Resend verification email",
  },
  am: {
    title: "እንኳን ደህና መጡ",
    description: "ወደ Hisab የንግድ የሥራ ቦታዎ ለመቀጠል ይግቡ።",
    email: "የንግድ ኢሜይል",
    emailPlaceholder: "name@company.com",
    password: "የይለፍ ቃል",
    passwordPlaceholder: "የይለፍ ቃልዎን ያስገቡ",
    submit: "ወደ Hisab ይግቡ",
    divider: "ወይም በኢሜይል ይቀጥሉ",
    magic: "የተጠበቀ መግቢያ ሊንክ በኢሜይል ይላኩልኝ",
    forgot: "የይለፍ ቃልዎን ረሱ?",
    phone: "በሞባይል ቁጥር ይግቡ",
    newUser: "ለHisab አዲስ ነዎት?",
    create: "የሥራ ቦታዎን ይፍጠሩ",
    passwordHelpTitle: "በኢሜይልና የይለፍ ቃል መግባት ይፈልጋሉ?",
    passwordHelp: "ይህ ኢሜይል በGoogle ከተመዘገበ፣ ሁለተኛ መለያ ሳይፈጥሩ የይለፍ ቃል ያዘጋጁ።",
    passwordHelpAction: "የኢሜይል የይለፍ ቃል ይፍጠሩ ወይም ይቀይሩ",
    confirmationHelp: "በይለፍ ቃል ከመግባትዎ በፊት ኢሜይልዎን ማረጋገጥ ያስፈልጋል።",
    confirmationAction: "የማረጋገጫ ኢሜይል እንደገና ይላኩ",
  },
  ti: {
    title: "እንቋዕ ብደሓን መጻእኩም",
    description: "ናብ Hisab ናይ ንግዲ መስርሒ ቦታኹም ንምቕጻል እተዉ።",
    email: "ናይ ንግዲ ኢሜይል",
    emailPlaceholder: "name@company.com",
    password: "መሕለፊ ቃል",
    passwordPlaceholder: "መሕለፊ ቃልኩም ኣእትዉ",
    submit: "ናብ Hisab እተዉ",
    divider: "ወይ ብኢሜይል ቀጽሉ",
    magic: "ውሑስ መእተዊ ሊንክ ብኢሜይል ስደዱለይ",
    forgot: "መሕለፊ ቃልኩም ረሲዕኩም?",
    phone: "ብቁጽሪ ሞባይል እተዉ",
    newUser: "ኣብ Hisab ሓድሽ ዲኹም?",
    create: "መስርሒ ቦታኹም ፍጠሩ",
    passwordHelpTitle: "ብኢሜይልን መሕለፊ ቃልን ክትኣትዉ ትደልዩ?",
    passwordHelp: "እዚ ኢሜይል መጀመርታ ብGoogle እንተተመዝጊቡ፣ ካልእ ኣካውንት ከይፈጠርኩም መሕለፊ ቃል ኣዳልዉ።",
    passwordHelpAction: "ናይ ኢሜይል መሕለፊ ቃል ፍጠሩ ወይ ቀይሩ",
    confirmationHelp: "ብመሕለፊ ቃል ቅድሚ ምእታውኩም ኢሜይልኩም ክረጋገጽ ኣለዎ።",
    confirmationAction: "ናይ ምርግጋጽ ኢሜይል ደጊምኩም ስደዱ",
  },
} as const;

type LoginSearchParams = {
  error?: string;
  message?: string;
  next?: string;
  preview?: string;
  reason?: string;
  email?: string;
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<LoginSearchParams> }) {
  const [params, localized] = await Promise.all([searchParams, getServerFoundationCopy()]);
  const p = loginCopy[localized.language];
  const configured = isSupabaseConfigured();
  const next = safeNextPath(params.next || "/");
  const preview = params.preview === "1";
  const email = typeof params.email === "string" ? params.email.trim().slice(0, 254) : "";
  const showPasswordHelp = params.reason === "existing-account" || params.reason === "password-or-provider";
  const showConfirmationHelp = params.reason === "email-not-confirmed" && Boolean(email);

  const signUpQuery = new URLSearchParams({ next });
  const resetQuery = new URLSearchParams({ next });
  const verifyQuery = new URLSearchParams({ next });
  if (preview) {
    signUpQuery.set("preview", "1");
    resetQuery.set("preview", "1");
  }
  if (email) {
    resetQuery.set("email", email);
    verifyQuery.set("email", email);
  }

  const magicQuery = new URLSearchParams({ next });
  const phoneQuery = new URLSearchParams({ next });
  if (preview) {
    magicQuery.set("preview", "1");
    phoneQuery.set("preview", "1");
  }

  return (
    <main className="biloo-login-page">
      <section className="biloo-login-shell">
        <aside className="biloo-login-visual" aria-label="Hisab business workspace preview">
          <div className="biloo-login-visual-grid" aria-hidden="true" />
          <header className="biloo-login-visual-header">
            <Link href="/" className="biloo-login-wordmark" aria-label="Hisab home">
              biloo<span>.</span>
            </Link>
            <span className="biloo-login-secure-status"><i aria-hidden="true" /> Secure cloud workspace</span>
          </header>

          <div className="biloo-login-visual-copy">
            <p className="biloo-login-kicker"><Icon name="sparkles" size={16} /> Built for ambitious Ethiopian businesses</p>
            <h1>Clarity for every birr, every decision.</h1>
            <p>One connected operating system for finance, sales, inventory, customers and the decisions that move your business forward.</p>
          </div>

          <div className="biloo-login-dashboard" aria-hidden="true">
            <div className="biloo-login-dashboard-topbar">
              <div className="biloo-login-dashboard-brand"><span>B</span><strong>Finance overview</strong></div>
              <div className="biloo-login-dashboard-actions"><i /><i /><i /></div>
            </div>

            <div className="biloo-login-dashboard-body">
              <div className="biloo-login-dashboard-sidebar">
                <span className="is-active"><Icon name="grid" size={15} /></span>
                <span><Icon name="receipt" size={15} /></span>
                <span><Icon name="wallet" size={15} /></span>
                <span><Icon name="users" size={15} /></span>
                <span><Icon name="chart" size={15} /></span>
              </div>

              <div className="biloo-login-dashboard-content">
                <div className="biloo-login-dashboard-heading">
                  <div><small>Good morning</small><strong>Business overview</strong></div>
                  <span>July 2026</span>
                </div>

                <div className="biloo-login-stat-grid">
                  <article><span><Icon name="trending-up" size={15} /></span><small>Revenue</small><strong>ETB 2.48M</strong><em>+18.4%</em></article>
                  <article><span><Icon name="wallet" size={15} /></span><small>Cash balance</small><strong>ETB 840K</strong><em>Healthy</em></article>
                  <article><span><Icon name="receipt" size={15} /></span><small>Receivables</small><strong>ETB 316K</strong><em>12 invoices</em></article>
                </div>

                <div className="biloo-login-insight-grid">
                  <article className="biloo-login-chart-card">
                    <div><span><small>Cash flow</small><strong>ETB 1.26M</strong></span><em>+24%</em></div>
                    <svg viewBox="0 0 420 130" role="presentation">
                      <defs>
                        <linearGradient id="biloo-login-chart-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FCA311" stopOpacity=".34" />
                          <stop offset="100%" stopColor="#FCA311" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path className="biloo-login-chart-area" d="M0 112 C42 104 55 72 92 80 C135 90 150 46 194 58 C235 70 249 23 296 36 C337 47 357 18 420 9 L420 130 L0 130 Z" />
                      <path className="biloo-login-chart-line" d="M0 112 C42 104 55 72 92 80 C135 90 150 46 194 58 C235 70 249 23 296 36 C337 47 357 18 420 9" />
                      <circle cx="420" cy="9" r="5" />
                    </svg>
                  </article>

                  <article className="biloo-login-health-card">
                    <div className="biloo-login-health-ring"><strong>92</strong><small>/100</small></div>
                    <span><small>Business health</small><strong>Excellent</strong><em>All systems are on track</em></span>
                  </article>
                </div>
              </div>
            </div>
          </div>

          <footer className="biloo-login-visual-footer">
            <span><Icon name="shield-check" size={17} /> Protected access</span>
            <span><Icon name="activity" size={17} /> Real-time reporting</span>
            <span><Icon name="building" size={17} /> Multi-business ready</span>
          </footer>
        </aside>

        <section className="biloo-login-form-pane">
          <nav className="biloo-login-topbar" aria-label="Sign-in support links">
            <Link href="/" className="biloo-login-mobile-wordmark" aria-label="Hisab home">biloo<span>.</span></Link>
            <div><Link href="/help-center">Help</Link><Link href="/">Back to website</Link></div>
          </nav>

          <div className="biloo-login-form-wrap">
            <div className="biloo-login-card">
              <header className="biloo-login-heading">
                <span className="biloo-login-heading-icon"><Icon name="lock" size={20} /></span>
                <p>Secure workspace access</p>
                <h2>{p.title}</h2>
                <span>{p.description}</span>
              </header>

              {!configured && <AuthNotice type="warning">Authentication is not configured.</AuthNotice>}
              <AuthNotice type="error">{params.error}</AuthNotice>
              <AuthNotice type="success">{params.message}</AuthNotice>

              {showPasswordHelp ? (
                <AuthNotice type="warning">
                  <strong>{p.passwordHelpTitle}</strong> {p.passwordHelp}{" "}
                  <Link href={`/auth/forgot-password?${resetQuery.toString()}`}>{p.passwordHelpAction}</Link>.
                </AuthNotice>
              ) : null}

              {showConfirmationHelp ? (
                <AuthNotice type="warning">
                  {p.confirmationHelp}{" "}
                  <Link href={`/auth/verify-email?${verifyQuery.toString()}`}>{p.confirmationAction}</Link>.
                </AuthNotice>
              ) : null}

              <SocialAuthButtons language={localized.language} next={next} disabled={!configured} dividerText={p.divider} />

              <form action={signInWithEmail} className="biloo-login-form">
                <input type="hidden" name="next" value={next} />

                <label className="biloo-login-field" htmlFor="login-email">
                  <span>{p.email}</span>
                  <div className="biloo-login-input-shell">
                    <Icon name="user" size={18} />
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder={p.emailPlaceholder}
                      defaultValue={email}
                      required
                      autoFocus
                    />
                  </div>
                </label>

                <LoginPasswordField
                  label={p.password}
                  placeholder={p.passwordPlaceholder}
                  forgotLabel={p.forgot}
                  forgotHref={`/auth/forgot-password?${resetQuery.toString()}`}
                />

                <button className="biloo-login-primary" type="submit" disabled={!configured}>
                  <span>{p.submit}</span><Icon name="arrow-right" size={18} />
                </button>
              </form>

              <div className="biloo-login-secondary-actions">
                <Link href={`/auth/magic-link?${magicQuery.toString()}`}><Icon name="link" size={16} />{p.magic}</Link>
                {appConfig.authProviders.phone ? <Link href={`/auth/phone-login?${phoneQuery.toString()}`}><Icon name="smartphone" size={16} />{p.phone}</Link> : null}
              </div>

              <div className="biloo-login-account-switch">
                <span>{p.newUser}</span>
                <Link href={`/auth/email-sign-up?${signUpQuery.toString()}`}>{p.create}<Icon name="arrow-right" size={15} /></Link>
              </div>
            </div>
          </div>

          <footer className="biloo-login-legal">
            <span>© 2026 Hisab</span>
            <Link href="/trust">Privacy &amp; security</Link>
            <span>Encrypted connection</span>
          </footer>
        </section>
      </section>
    </main>
  );
}
