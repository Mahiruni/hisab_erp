import Link from "next/link";
import { BillingSuccessStatus } from "../../../components/billing-success-status";
import { isValidHisabTxRef } from "../../../lib/chapa/settlement";

export const metadata = { title: "Verifying Chapa payment" };
export const dynamic = "force-dynamic";

export default async function BillingSuccessPage({ searchParams }: { searchParams: Promise<{ tx_ref?: string; trx_ref?: string }> }) {
  const params = await searchParams;
  const txRef = (params.tx_ref || params.trx_ref || "").trim();
  const valid = isValidHisabTxRef(txRef);

  return (
    <main className="commerce-page billing-result-page">
      <header className="commerce-topbar">
        <Link href="/" className="commerce-brand"><img src="/hisab-logo.svg" alt="" width="42" height="42"/><span><strong>HisabTech</strong><small>Chapa verification</small></span></Link>
        <Link href="/billing">Paid access center</Link>
      </header>
      {valid ? <BillingSuccessStatus txRef={txRef}/> : (
        <section className="billing-success-card failed">
          <div className="billing-verification-visual" aria-hidden="true"><b>!</b></div>
          <span className="commerce-kicker">Invalid payment return</span>
          <h1>This Chapa transaction link cannot be verified.</h1>
          <p>Open the paid access center to review the authoritative payment and access state associated with your account.</p>
          <div className="billing-success-actions"><Link href="/billing" className="commerce-primary">Open paid access center <b aria-hidden="true">→</b></Link><Link href="/pricing" className="commerce-secondary">View pricing</Link></div>
        </section>
      )}
    </main>
  );
}
