import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "../../components/marketing-site-chrome";
import { PricingExperience } from "../../components/pricing-experience";

export const metadata: Metadata = {
  title: "HisabERP Pricing in Ethiopian Birr",
  description: "Compare HisabERP plans in ETB and pay securely through Chapa for a monthly or annual access period.",
};

const questions = [
  { q: "Are these final access prices?", a: "Starter, Growth and Business use the published ETB amount for the selected monthly or annual access period. Migration, extra users, branches, custom integrations and Enterprise scope are priced separately." },
  { q: "How is payment confirmed?", a: "Chapa hosts the payment page. HisabTech then verifies the transaction reference, ETB amount, currency and successful status directly with Chapa before activating access." },
  { q: "Does payment renew automatically?", a: "No. HisabTech uses one-time Chapa payments. Renewal is manual, so a customer is never enrolled in an automatic recurring charge through this flow." },
  { q: "Is VAT included?", a: "Published prices are shown before any applicable VAT or statutory charge. The checkout and formal commercial documents show the final amount that applies." },
  { q: "Can we start small and upgrade later?", a: "Yes. Choose another plan when renewing. A verified payment can extend the access period and apply the selected plan." },
  { q: "What does data migration include?", a: "Migration can cover prepared customers, suppliers, products, inventory quantities and opening balances. Historical transactions are assessed separately because effort depends on data quality and volume." },
];

export default function PricingPage() {
  return (
    <MarketingPageShell>
      <section className="pricing-hero">
        <div><span className="marketing-eyebrow">Transparent ETB pricing</span><h1>Choose the plan that gives your business the right control now.</h1><p>Compare users, locations, modules and support, then continue through secure Chapa checkout for Starter, Growth or Business. Enterprise remains a guided commercial engagement.</p><div className="pricing-hero-notes"><span>Chapa-verified activation</span><span>No automatic recurring charge</span><span>Annual savings shown clearly</span><span>Migration scoped separately</span></div></div>
        <div className="pricing-principles"><header><span>How paid access works</span><strong>Choose · pay · verify</strong></header><p><b>1.</b><span><strong>Select the operating plan</strong><small>Choose the modules, users, branches and access period required today.</small></span></p><p><b>2.</b><span><strong>Complete Chapa checkout</strong><small>Pay the displayed ETB amount on Chapa’s hosted payment page.</small></span></p><p><b>3.</b><span><strong>Activate after verification</strong><small>HisabTech verifies the transaction directly before enabling the paid access period.</small></span></p></div>
      </section>

      <section className="pricing-section"><div className="marketing-section-heading marketing-section-heading-centered"><span>Plans and inclusions</span><h2>Start with dependable records, then expand into connected operations.</h2><p>Annual access provides approximately two months of savings compared with twelve separate monthly payments.</p></div><PricingExperience /></section>

      <section className="pricing-included-section"><div><span className="marketing-eyebrow">Included across plans</span><h2>Every HisabERP paid plan starts with the same product foundation.</h2></div><div><article><span>01</span><h3>Secure cloud workspace</h3><p>Protected authentication, controlled organization access and structured business records.</p></article><article><span>02</span><h3>Responsive product access</h3><p>Use the workspace from desktop, tablet and supported mobile browsers.</p></article><article><span>03</span><h3>Product updates</h3><p>Receive maintained product improvements within the paid plan scope.</p></article><article><span>04</span><h3>Manual payment control</h3><p>Renew through Chapa only when you choose, without automatic recurring charges.</p></article></div></section>

      <section className="marketing-section pricing-faq-section"><div className="marketing-section-heading"><span>Pricing questions</span><h2>Understand the commercial details before you choose.</h2></div><div className="pricing-faq-grid">{questions.map((item)=><article key={item.q}><h3>{item.q}</h3><p>{item.a}</p></article>)}</div></section>

      <section className="marketing-cta marketing-cta-v2"><div><span>Need help choosing a plan?</span><h2>Use Chapa checkout or discuss complex scope.</h2><p>Standard plans can begin online. HisabTech will guide migration, integrations, Enterprise requirements and specialized implementation.</p></div><div><Link href="/request-demo?topic=pricing" className="marketing-start marketing-large">Request pricing consultation</Link><Link href="/product-tour" className="marketing-demo marketing-large">Explore the product</Link></div></section>
    </MarketingPageShell>
  );
}
