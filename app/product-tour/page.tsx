import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "../../components/marketing-site-chrome";
import { ProductTourExperience } from "../../components/product-tour-experience";
import "./product-tour-phase-2-4.css";

export const metadata: Metadata = {
  title: "Hisab ERP Product Tour",
  description: "Explore Hisab ERP across dashboard, sales, inventory, finance and reporting in an interactive desktop and mobile product tour.",
  alternates: { canonical: "/product-tour" },
  openGraph: {
    title: "Hisab ERP Product Tour",
    description: "See how Hisab connects daily operations to live management visibility across desktop and mobile.",
    url: "/product-tour",
    type: "website",
  },
};

export default function ProductTourPage() {
  return (
    <MarketingPageShell>
      <div className="product-tour-phase-2-4">
        <section className="marketing-page-hero product-tour-hero">
          <div className="product-tour-hero-copy">
            <span className="marketing-eyebrow">Interactive Hisab ERP product tour</span>
            <h1>See the work. Follow the data. <em>Understand the business.</em></h1>
            <p>Move through Hisab’s major product areas and see how sales, inventory, finance and reporting become one reliable operating picture—across desktop and mobile.</p>
            <div className="marketing-hero-actions">
              <Link href="/auth/email-sign-up" className="marketing-start marketing-large">Start free</Link>
              <Link href="/request-demo" className="marketing-demo marketing-large">Request a guided demo</Link>
            </div>
          </div>
          <aside className="product-tour-hero-summary" aria-label="Product tour contents">
            <strong>Five connected workspaces</strong>
            <span>Executive dashboard</span>
            <span>Sales and invoicing</span>
            <span>Inventory control</span>
            <span>Finance and cash flow</span>
            <span>Reports and analytics</span>
          </aside>
        </section>

        <section className="product-tour-page-stage">
          <ProductTourExperience />
        </section>

        <section className="marketing-tour-principles">
          <div className="marketing-section-heading marketing-section-heading-centered">
            <span>One connected workflow</span>
            <h2>The value is not only in each module—it is in how every module keeps the same story.</h2>
          </div>
          <div>
            <article><b>01</b><h3>Record once</h3><p>A transaction should not need to be rewritten across multiple files, tools or departments.</p></article>
            <article><b>02</b><h3>Update automatically</h3><p>Sales, balances, stock and financial position remain synchronized as business activity happens.</p></article>
            <article><b>03</b><h3>Review confidently</h3><p>Managers work from the same current operational records used by the team—not a delayed copy.</p></article>
          </div>
        </section>

        <section className="marketing-cta marketing-cta-v2">
          <div><span>Need a tour based on your business?</span><h2>See Hisab through the workflows your company uses every day.</h2><p>We can focus the demonstration on your industry, team structure, branches, reporting requirements and current operational challenges.</p></div>
          <div><Link href="/request-demo" className="marketing-start marketing-large">Request a guided demo</Link><Link href="/auth/email-sign-up" className="marketing-demo marketing-large">Create a workspace</Link></div>
        </section>
      </div>
    </MarketingPageShell>
  );
}
