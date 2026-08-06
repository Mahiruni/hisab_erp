import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "../../components/marketing-site-chrome";

export const metadata: Metadata = {
  title: "Data Migration and Onboarding",
  description: "Move customers, suppliers, products, opening balances and operating workflows into HisabERP through a controlled assessment, dry run, validation and go-live process.",
};

const migrationSources = [
  { title: "Excel and CSV files", text: "Clean and map customers, suppliers, products, prices and approved opening balances into structured import files." },
  { title: "Notebooks and paper ledgers", text: "Choose a practical cutover date and capture active master data and opening positions instead of retyping every historical page." },
  { title: "Other business software", text: "Export source records, identify the system of record for each data type and preserve specialist tools that still have a valid role." },
  { title: "Multiple branch files", text: "Standardize names, codes, units and branch ownership before consolidating separate operating records." },
];

const migrationStages = [
  { number: "01", title: "Assess", text: "Document the current systems, data owners, record volumes, required history, branch structure and highest-risk workflows." },
  { number: "02", title: "Prepare", text: "Clean duplicates, standardize identifiers, map fields and freeze approved source files for the dry run." },
  { number: "03", title: "Configure", text: "Set up the organization, users, roles, products, locations, fiscal context and required modules before loading live data." },
  { number: "04", title: "Dry run", text: "Import into a controlled workspace, inspect errors and compare record counts, quantities and financial control totals." },
  { number: "05", title: "Validate", text: "Require named reviewers for sales, inventory and finance to approve the migrated position and operating workflow." },
  { number: "06", title: "Go live", text: "Freeze the source, load approved opening positions, monitor the first operating period and keep old records read-only for evidence." },
];

const responsibilities = [
  { owner: "Your business", items: ["Name a migration owner and data reviewers", "Provide complete source exports and supporting statements", "Resolve duplicates and approve opening balances", "Control the source freeze and staff readiness", "Retain historical evidence after cutover"] },
  { owner: "HisabTech", items: ["Provide preparation templates and field guidance", "Configure the agreed HisabERP workspace scope", "Run or support controlled import dry runs", "Report validation exceptions clearly", "Support training and the agreed go-live window"] },
];

const packages = [
  { title: "Self-guided preparation", badge: "For clean, smaller datasets", text: "Use the public templates and help guides to prepare data, then create the organization and validate records internally.", includes: ["CSV preparation templates", "Public migration checklist", "Help-center guides", "Standard product onboarding"] },
  { title: "Assisted migration", badge: "Most growing businesses", text: "HisabTech reviews scope, supports mapping and dry-run validation, and coordinates a documented cutover with business reviewers.", includes: ["Migration assessment", "Field mapping review", "Dry-run exception report", "Opening-balance validation session"] },
  { title: "Complex implementation", badge: "Multi-branch or multiple systems", text: "A separately quoted project for large volumes, several source systems, complex branches or integration dependencies.", includes: ["Phased migration plan", "Source-system mapping", "Branch-by-branch validation", "Custom implementation scope"] },
];

export default function MigrationPage() {
  return (
    <MarketingPageShell>
      <section className="migration-hero">
        <div>
          <span className="marketing-eyebrow">Data migration and onboarding</span>
          <h1>Move into HisabERP without losing control of the source.</h1>
          <p>A successful migration is not simply an imported file. It is a documented transition in which master data, opening balances, users and daily workflows are prepared, tested, reconciled and approved.</p>
          <div className="marketing-hero-actions"><Link href="/request-demo?topic=migration" className="marketing-start marketing-large">Request a migration assessment</Link><Link href="/help-center/prepare-data-for-import" className="marketing-demo marketing-large">Open the preparation guide</Link></div>
          <div className="migration-hero-pills"><span>Source preserved</span><span>Dry run required</span><span>Business approval</span><span>Controlled cutover</span></div>
        </div>
        <div className="migration-control-board" aria-label="Illustrative migration control board">
          <header><div><small>Migration workstream</small><strong>Readiness overview</strong></div><span>Illustrative plan</span></header>
          <div className="migration-control-score"><strong>5/6</strong><span>workstreams prepared</span></div>
          <div className="migration-control-list"><p><span>Customers and suppliers</span><b>Validated</b></p><p><span>Products and units</span><b>Validated</b></p><p><span>Opening stock</span><b>Review</b></p><p><span>Receivables and payables</span><b>Validated</b></p><p><span>User access</span><b>Prepared</b></p><p><span>Cutover approval</span><b>Pending</b></p></div>
        </div>
      </section>

      <section className="marketing-section migration-source-section">
        <div className="marketing-section-heading marketing-section-heading-wide"><span>Where businesses start</span><h2>A migration path for the records you already use.</h2><p>The correct approach depends on the quality, ownership and operational importance of the source—not only its file format.</p></div>
        <div className="migration-source-grid">{migrationSources.map((source, index) => <article key={source.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{source.title}</h3><p>{source.text}</p></article>)}</div>
      </section>

      <section className="migration-timeline-section">
        <div className="marketing-section-heading"><span>Controlled implementation path</span><h2>Six stages from assessment to stable operations.</h2><p>Every stage produces evidence for the next decision. A technical import is not treated as complete until the business reconciles and approves it.</p></div>
        <div className="migration-timeline">{migrationStages.map((stage) => <article key={stage.number}><span>{stage.number}</span><div><h3>{stage.title}</h3><p>{stage.text}</p></div></article>)}</div>
      </section>

      <section className="migration-template-section">
        <div><span className="marketing-eyebrow">Preparation templates</span><h2>Start with consistent column names and one record per row.</h2><p>These CSV templates are preparation aids. Final import support and required fields depend on the agreed implementation scope and current product workflow.</p><Link href="/help-center/prepare-data-for-import" className="marketing-text-action">Read the complete import preparation guide →</Link></div>
        <div className="migration-template-grid">
          <a href="/templates/hisaberp-customers-import.csv" download><span>CSV</span><strong>Customer template</strong><small>Name, contact, TIN and opening credit information</small><b>Download →</b></a>
          <a href="/templates/hisaberp-suppliers-import.csv" download><span>CSV</span><strong>Supplier template</strong><small>Supplier identity, contact and approved opening obligation</small><b>Download →</b></a>
          <a href="/templates/hisaberp-products-import.csv" download><span>CSV</span><strong>Product template</strong><small>SKU, unit, prices, reorder level and opening quantity</small><b>Download →</b></a>
        </div>
      </section>

      <section className="marketing-section migration-responsibility-section">
        <div className="marketing-section-heading"><span>Shared responsibility</span><h2>Clear ownership prevents hidden migration risk.</h2><p>HisabTech can support configuration and data movement, but the business remains responsible for source accuracy and approval.</p></div>
        <div className="migration-responsibility-grid">{responsibilities.map((group) => <article key={group.owner}><h3>{group.owner}</h3><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
      </section>

      <section className="migration-package-section">
        <div className="marketing-section-heading marketing-section-heading-wide"><span>Choose the right level of assistance</span><h2>Migration services are scoped separately from the software subscription.</h2><p>The assessment determines record volume, source complexity, required history, number of branches and validation effort before a final quotation is issued.</p></div>
        <div className="migration-package-grid">{packages.map((item) => <article key={item.title}><span>{item.badge}</span><h3>{item.title}</h3><p>{item.text}</p><ul>{item.includes.map((included) => <li key={included}>{included}</li>)}</ul><Link href={`/request-demo?topic=${encodeURIComponent(item.title)}`}>Discuss this approach →</Link></article>)}</div>
      </section>

      <section className="migration-warning-section"><div><span>Important migration principle</span><h2>Do not migrate bad data faster.</h2><p>Duplicates, unsupported balances and unclear ownership should be resolved before cutover. Old source records should remain preserved until the organization confirms the new workspace is stable and required evidence is retained.</p></div><Link href="/compare/excel" className="marketing-demo marketing-large">Compare HisabERP with Excel</Link></section>

      <section className="marketing-cta marketing-cta-v2"><div><span>Plan the transition before importing</span><h2>Start with a migration assessment based on your real source data.</h2><p>Share the source systems, approximate record volumes, branch structure and target go-live period. HisabTech will identify the preparation and validation path.</p></div><div><Link href="/request-demo?topic=migration" className="marketing-start marketing-large">Request assessment</Link><Link href="/help-center" className="marketing-demo marketing-large">Browse help guides</Link></div></section>
    </MarketingPageShell>
  );
}
