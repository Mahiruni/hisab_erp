import type { Language } from "../lib/translations";
import { signInWithOAuthProvider } from "../lib/actions/auth";
import { appConfig } from "../lib/config";

const socialCopy = {
  en: {
    google: "Continue with Google",
    apple: "Continue with Apple",
    divider: "or continue with email",
  },
  am: {
    google: "በGoogle ይቀጥሉ",
    apple: "በApple ይቀጥሉ",
    divider: "ወይም በኢሜይል ይቀጥሉ",
  },
  ti: {
    google: "ብGoogle ቀጽሉ",
    apple: "ብApple ቀጽሉ",
    divider: "ወይ ብኢሜይል ቀጽሉ",
  },
} as const;

function GoogleIcon() {
  return (
    <svg className="social-provider-icon" data-brand-mark="google" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.42-.19-2.09H12v3.96h5.38a4.6 4.6 0 0 1-2 3.02v2.57h3.24c1.9-1.75 2.98-4.33 2.98-7.46Z"/>
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.24-2.57c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.65A10 10 0 0 0 12 22Z"/>
      <path fill="#FBBC05" d="M6.39 13.83A6 6 0 0 1 6.08 12c0-.64.11-1.26.31-1.83V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.13 1.04 4.48l3.35-2.65Z"/>
      <path fill="#EA4335" d="M12 6.04c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.65C7.18 7.8 9.39 6.04 12 6.04Z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="social-provider-icon apple-provider-icon" data-brand-mark="apple" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M17.05 12.54c-.02-2.27 1.85-3.37 1.94-3.43a4.16 4.16 0 0 0-3.27-1.77c-1.38-.15-2.72.83-3.42.83-.72 0-1.8-.81-2.97-.78a4.34 4.34 0 0 0-3.65 2.23c-1.58 2.73-.4 6.75 1.11 8.96.76 1.08 1.65 2.29 2.82 2.25 1.14-.05 1.57-.72 2.94-.72 1.36 0 1.76.72 2.95.69 1.23-.02 2-1.08 2.73-2.17a8.94 8.94 0 0 0 1.25-2.55 3.91 3.91 0 0 1-2.43-3.54ZM14.82 5.88a3.98 3.98 0 0 0 .91-2.86 4.07 4.07 0 0 0-2.64 1.36 3.8 3.8 0 0 0-.94 2.75 3.36 3.36 0 0 0 2.67-1.25Z"/>
    </svg>
  );
}

export function SocialAuthButtons({
  language,
  next = "/onboarding",
  disabled = false,
  dividerText,
}: {
  language: Language;
  next?: string;
  disabled?: boolean;
  dividerText?: string;
}) {
  const c = socialCopy[language];
  const { google, apple } = appConfig.authProviders;

  return (
    <section className="social-auth-block" data-third-party-brand aria-label="Trusted sign-in providers">
      <div className="social-auth-grid">
        {google ? (
          <form action={signInWithOAuthProvider}>
            <input type="hidden" name="provider" value="google"/>
            <input type="hidden" name="next" value={next}/>
            <button className="social-auth-button social-auth-google" data-brand-provider="google" type="submit" disabled={disabled}>
              <GoogleIcon/>
              <span>{c.google}</span>
            </button>
          </form>
        ) : null}
        {apple ? (
          <form action={signInWithOAuthProvider}>
            <input type="hidden" name="provider" value="apple"/>
            <input type="hidden" name="next" value={next}/>
            <button className="social-auth-button social-auth-apple" data-brand-provider="apple" type="submit" disabled={disabled}>
              <AppleIcon/>
              <span>{c.apple}</span>
            </button>
          </form>
        ) : null}
      </div>
      <div className="social-auth-divider"><span>{dividerText || c.divider}</span></div>
    </section>
  );
}
