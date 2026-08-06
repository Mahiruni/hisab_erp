import Link from "next/link";
import { ProviderOrbit } from "../../components/provider-orbit";
import { createChapaCheckout } from "../../lib/actions/billing";
import { formatEtb, getBillingPlan, getPlanAmountEtb, isBillingCycle } from "../../lib/billing/catalog";
import { billingGrantsAccess, getCurrentBillingSnapshot } from "../../lib/data/billing";

export const metadata = { title: "Secure Chapa checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; billing?: string; error?: string }> }) {
  const params = await searchParams;
  const plan = getBillingPlan(params.plan || "growth") || getBillingPlan("growth")!;
  const billingCycle = isBillingCycle(params.billing) ? params.billing : "annual";
  const amount = getPlanAmountEtb(plan, billingCycle);
  const snapshot = await getCurrentBillingSnapshot();
  const alreadyActive = billingGrantsAccess(snapshot.access?.status, snapshot.access?.currentPeriodEnd);

  return (
    <main className="commerce-page checkout-page">
      <header className="commerce-topbar">
        <Link href="/" className="commerce-brand"><img src="/hisab-logo.svg" alt="" width="42" height="42"/><span><strong>HisabTech</strong><small>Secure Chapa payment</small></span></Link>
        <Link href="/pricing">Back to pricing</Link>
      </header>

      <section className="checkout-shell">
        <aside className="checkout-trust-panel">
          <span className="commerce-kicker">Protected HisabERP activation</span>
          <h1>One final review before your paid access period begins.</h1>
          <p>Payment is completed on Chapa’s hosted checkout. HisabTech activates access only after the transaction reference, amount, currency and successful status are verified directly with Chapa.</p>
          <ProviderOrbit compact />
          <div className="checkout-trust-list">
            <span><b>01</b><div><strong>ETB hosted checkout</strong><small>Complete payment using the options Chapa makes available for your transaction.</small></div></span>
            <span><b>02</b><div><strong>Server-side verification</strong><small>A browser return or webhook by itself cannot mark a payment as successful.</small></div></span>
            <span><b>03</b><div><strong>Clear access period</strong><small>This is a one-time payment for the selected month or year, with manual renewal.</small></div></span>
          </div>
        </aside>

        <section className="checkout-review-card">
          <div className="checkout-review-heading"><span>Payment summary</span><h2>HisabERP {plan.name}</h2><p>{plan.description}</p></div>
          {params.error ? <div className="commerce-alert error" role="alert">{params.error}</div> : null}
          {!snapshot.configured ? <div className="commerce-alert warning" role="status">Chapa checkout is not configured in this environment yet.</div> : null}
          {alreadyActive ? <div className="commerce-alert success" role="status">Your workspace is active. A new verified payment will extend your access period.</div> : null}

          <div className="checkout-price"><span>ETB</span><strong>{formatEtb(amount)}</strong><small>{billingCycle === "annual" ? "for one year" : "for one month"}</small></div>
          <div className="checkout-plan-meta"><span>{plan.users}</span><span>{plan.branches}</span></div>
          <ul>{plan.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul>
          <div className="checkout-total"><span>One-time Chapa payment</span><strong>ETB {formatEtb(amount)}</strong></div>

          <form action={createChapaCheckout}>
            <input type="hidden" name="plan" value={plan.code}/>
            <input type="hidden" name="billing" value={billingCycle}/>
            <button className="commerce-primary" type="submit" disabled={!snapshot.configured}>{alreadyActive ? "Pay with Chapa and extend access" : "Continue to secure Chapa checkout"} <b aria-hidden="true">→</b></button>
          </form>
          <p className="checkout-legal">This payment does not authorize automatic recurring charges. Renewal is manual. HisabTech accepts the payment only after direct server verification with Chapa.</p>
          <div className="checkout-secondary"><Link href="/pricing">Change plan</Link><Link href="/trust">Security details</Link></div>
        </section>
      </section>
    </main>
  );
}
