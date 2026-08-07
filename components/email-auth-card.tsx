import Link from "next/link";
import type { ReactNode } from "react";
import { ProviderOrbit } from "./provider-orbit";

type EmailAuthCardProps = {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  eyebrow?: string;
  badge?: string;
  showcaseTitle?: string;
  showcaseDescription?: string;
};

export function EmailAuthCard({
  title,
  description,
  children,
  footer,
  eyebrow = "Hisab secure access",
  badge = "Protected business workspace",
  showcaseTitle = "Run your business from one trusted workspace.",
  showcaseDescription = "Keep sales, finance, inventory and reporting connected with secure, role-aware access.",
}: EmailAuthCardProps) {
  return (
    <main className="auth-page auth-premium-page auth-official-page auth-standard-page">
      <section className="auth-standard-shell">
        <aside className="auth-standard-showcase" aria-label="Hisab product introduction">
          <Link href="/" className="auth-standard-brand" aria-label="Hisab home">
            <img src="/hisab-logo.svg" alt="" width="44" height="44" className="hisab-logo" />
            <span><strong>Hisab</strong><small>Business operating system</small></span>
          </Link>

          <div className="auth-standard-showcase-copy">
            <span className="auth-standard-badge"><i aria-hidden="true" />{badge}</span>
            <h2>{showcaseTitle}</h2>
            <p>{showcaseDescription}</p>
            <ProviderOrbit compact />
            <ul className="auth-standard-benefits">
              <li><span aria-hidden="true">✓</span><div><strong>Secure by design</strong><small>Verified identity, protected sessions and reliable recovery.</small></div></li>
              <li><span aria-hidden="true">✓</span><div><strong>Built for Ethiopia</strong><small>Localized workflows for growing Ethiopian organizations.</small></div></li>
              <li><span aria-hidden="true">✓</span><div><strong>Your data stays connected</strong><small>Move between devices without losing business context.</small></div></li>
            </ul>
          </div>

          <p className="auth-standard-trust"><span aria-hidden="true">●</span> Encrypted connection · Role-aware access</p>
        </aside>

        <section className="auth-standard-form-side">
          <div className="auth-standard-mobile-topbar">
            <Link href="/" className="auth-standard-brand" aria-label="Hisab home">
              <img src="/hisab-logo.svg" alt="" width="38" height="38" className="hisab-logo" />
              <strong>Hisab</strong>
            </Link>
            <Link href="/" className="auth-standard-home-link">Back to website</Link>
          </div>

          <div className="auth-standard-card">
            <header className="auth-standard-heading">
              <p className="auth-standard-eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </header>
            {children}
            {footer ? <div className="auth-standard-switch">{footer}</div> : null}
          </div>

          <footer className="auth-standard-form-footer">
            <Link href="/trust">Privacy &amp; security</Link>
            <Link href="/help-center">Help Center</Link>
          </footer>
        </section>
      </section>
    </main>
  );
}

export function AuthNotice({ type, children }: { type: "error" | "success" | "warning"; children?: ReactNode }) {
  return children ? <div className={`form-alert ${type}`} role={type === "error" ? "alert" : "status"}>{children}</div> : null;
}
