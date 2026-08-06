import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "../../components/marketing-site-chrome";
import { submitDemoRequest } from "../../lib/actions/demo-request";

export const metadata: Metadata = {
  title: "Request a HisabERP demo",
  description: "Request a guided HisabERP demonstration for your business, institution or government program.",
};

export default async function RequestDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string; source?: string; topic?: string }>;
}) {
  const params = await searchParams;
  const submitted = params.submitted === "1";
  const context = [params.source, params.topic].filter(Boolean).join(" · ");

  return (
    <main className="marketing-site marketing-site-v2 demo-request-page">
      <MarketingHeader />
      <section className="demo-request-shell" id="public-main-content">
        <div className="demo-request-copy">
          <span>Personalized HisabERP demonstration</span>
          <h1>See how HisabERP can run your business.</h1>
          <p>Tell us about your organization and the workflows you want to improve. Our team will prepare a focused demonstration covering the modules, integrations and reporting that matter to you.</p>
          <ul>
            <li>Business-specific product walkthrough</li>
            <li>Sales, finance, inventory and reporting demonstration</li>
            <li>telebirr, M-Pesa, banking and integration-readiness discussion</li>
            <li>Implementation, onboarding and government-program guidance</li>
          </ul>
          <div><strong>Prefer direct contact?</strong><a href="tel:+251924093037">+251 924 093 037</a><a href="mailto:mahir@hisabtech.com?subject=Hisab%20demo%20request">mahir@hisabtech.com</a><a href="https://wa.me/251924093037" target="_blank" rel="noopener noreferrer">WhatsApp HisabTech</a></div>
        </div>

        {submitted ? (
          <section className="demo-request-form demo-request-success" role="status" aria-labelledby="demo-success-title">
            <span className="demo-success-mark" aria-hidden="true">✓</span>
            <div><span>Request delivered</span><h2 id="demo-success-title">Thank you. Your request was sent successfully.</h2><p>Your demo request has been emailed directly to Mahir at Hisab Technologies. You will be contacted using your preferred method to arrange the product walkthrough.</p></div>
            <div className="demo-success-actions"><Link className="demo-request-primary-link" href="/">Return to website</Link><Link href="/auth/email-sign-up">Create an account instead</Link></div>
          </section>
        ) : (
          <form className="demo-request-form" action={submitDemoRequest}>
            <div><span>Request your demo</span><h2>Tell us about your business</h2><p>Complete the details below. Fields marked with * are required.</p>{context ? <small className="demo-request-context">Demo context: {context}</small> : null}</div>

            {params.error && <div className="demo-request-alert" role="alert">{params.error}</div>}

            <label className="demo-request-honeypot" aria-hidden="true">Website<input name="website" type="text" tabIndex={-1} autoComplete="off"/></label>
            <input type="hidden" name="request_context" value={context}/>

            <div className="demo-form-row">
              <label>Full name *<input name="full_name" type="text" autoComplete="name" minLength={2} maxLength={120} required placeholder="Your full name"/></label>
              <label>Company or organization *<input name="business_name" type="text" autoComplete="organization" minLength={2} maxLength={160} required placeholder="Business name"/></label>
            </div>

            <div className="demo-form-row">
              <label>Business email *<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="name@company.com"/></label>
              <label>Phone number *<input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={32} required placeholder="+251 9..."/></label>
            </div>

            <div className="demo-form-row">
              <label>Business type *<select name="business_type" defaultValue="" required><option value="" disabled>Select business type</option><option>Retail and distribution</option><option>Professional services</option><option>Manufacturing</option><option>Hospitality and restaurant</option><option>Construction and projects</option><option>Cooperative or association</option><option>Government or NGO program</option><option>Other</option></select></label>
              <label>Team size *<select name="team_size" defaultValue="" required><option value="" disabled>Select team size</option><option value="1-5">1–5 people</option><option value="6-20">6–20 people</option><option value="21-50">21–50 people</option><option value="51-200">51–200 people</option><option value="200+">More than 200</option></select></label>
            </div>

            <fieldset className="demo-contact-method">
              <legend>Preferred contact method *</legend>
              <label><input type="radio" name="preferred_contact" value="phone" defaultChecked/> Phone</label>
              <label><input type="radio" name="preferred_contact" value="email"/> Email</label>
            </fieldset>

            <label>What would you like to improve?<textarea name="message" rows={5} maxLength={2000} defaultValue={context ? `I am interested in: ${context}. ` : undefined} placeholder="Tell us about your current process, challenges, required modules or integration needs."/></label>
            <label className="demo-request-consent"><input type="checkbox" required/><span>I agree that Hisab Technologies may contact me about this demo request.</span></label>
            <button type="submit">Send demo request</button>
            <small>Your request is emailed securely to mahir@hisabtech.com and is not visible to other website visitors.</small>
          </form>
        )}
      </section>
      <MarketingFooter />
    </main>
  );
}
