import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { LanguageSelector } from "../../components/language-provider";
import { MfaSecurityPanel } from "../../components/mfa-security-panel";
import { ReadinessRoadmap } from "../../components/readiness-roadmap";
import { ThemeToggle } from "../../components/theme-toggle";
import { Icon, type IconName } from "../../components/ui/icon";
import { bootstrapGuidedOrganization, createOnboardingBranchAction, importCustomersAction, importProductsAction, importSuppliersAction, postOpeningBalanceAction, updateCompanyProfileAction } from "../../lib/actions/onboarding";
import { getCurrentUserContext } from "../../lib/data/context";
import { getOnboardingSnapshot } from "../../lib/data/setup";
import type { SetupStepKey } from "../../lib/data/setup-types";

export const metadata = { title: "Company Launch" };
export const dynamic = "force-dynamic";

type StepCopy = {
  number: string;
  title: string;
  description: string;
  outcome: string;
  icon: IconName;
};

const stepCopy: Record<SetupStepKey, StepCopy> = {
  company: {
    number: "01",
    title: "Company profile",
    description: "Legal identity, business model and regional settings.",
    outcome: "These details become the source of truth for reports, invoices, tax records and company-level controls.",
    icon: "building",
  },
  branches: {
    number: "02",
    title: "Branches & warehouses",
    description: "Operating locations for transactions and inventory.",
    outcome: "Create the locations where teams sell, purchase, receive stock and account for daily activity.",
    icon: "boxes",
  },
  contacts: {
    number: "03",
    title: "Customers & suppliers",
    description: "Bring in opening contact master data.",
    outcome: "Import the counterparties needed for receivables, payables, quotations, orders and invoices.",
    icon: "users",
  },
  products: {
    number: "04",
    title: "Products & opening stock",
    description: "Catalog, pricing, cost and initial quantities.",
    outcome: "Establish a clean item catalog and the opening quantities that inventory control will build on.",
    icon: "package-check",
  },
  taxes: {
    number: "05",
    title: "Taxes & accounts",
    description: "Review the provisioned ledger and tax controls.",
    outcome: "Confirm the chart of accounts, VAT rules and posting controls before financial activity begins.",
    icon: "scale",
  },
  opening: {
    number: "06",
    title: "Opening balances",
    description: "Post the first balanced accounting journal.",
    outcome: "Bring the company into HisabTech with a traceable opening position for cash, capital, stock and obligations.",
    icon: "landmark",
  },
  invoice: {
    number: "07",
    title: "First invoice",
    description: "Validate the full quote-to-cash workflow.",
    outcome: "Prove that sales, VAT, receivables, inventory and cost postings work together before wider rollout.",
    icon: "receipt",
  },
  security: {
    number: "08",
    title: "Administrator security",
    description: "Protect privileged users with authenticator MFA.",
    outcome: "Secure finance, inventory, payroll and production controls before inviting the wider team.",
    icon: "shield-check",
  },
};

const orderedSteps = Object.keys(stepCopy) as SetupStepKey[];

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function LaunchBrand() {
  return (
    <Link href="/" className="launch-brand" aria-label="HisabTech home">
      <span aria-hidden="true">H</span>
      <div><strong>HisabTech</strong><small>Company launch</small></div>
    </Link>
  );
}

function LaunchPreferences() {
  return (
    <div className="launch-header-preferences" aria-label="Language and appearance">
      <LanguageSelector compact />
      <span className="launch-preference-divider" aria-hidden="true" />
      <ThemeToggle />
    </div>
  );
}

function SetupTask({ stepKey, complete, current, children }: { stepKey: SetupStepKey; complete: boolean; current: boolean; children: ReactNode }) {
  const copy = stepCopy[stepKey];
  return (
    <details id={`setup-${stepKey}`} className={`launch-task ${complete ? "complete" : ""} ${current ? "current" : ""}`} open={current}>
      <summary>
        <span className="launch-task-index"><Icon name={complete ? "check-circle" : copy.icon} size={19} /><small>{copy.number}</small></span>
        <span className="launch-task-copy"><strong>{copy.title}</strong><small>{copy.description}</small></span>
        <span className={`launch-task-status ${complete ? "complete" : current ? "current" : "pending"}`}>{complete ? "Complete" : current ? "Next step" : "Pending"}</span>
        <span className="launch-task-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="launch-task-body">
        <div className="launch-task-context"><Icon name="lightbulb" size={18} /><p>{copy.outcome}</p></div>
        {children}
      </div>
    </details>
  );
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const [context, query] = await Promise.all([getCurrentUserContext(), searchParams]);

  if (!context) {
    return (
      <main className="guided-setup-page launch-center launch-create-company">
        <header className="launch-topbar">
          <LaunchBrand />
          <nav className="launch-header-nav" aria-label="Company launch navigation">
            <a href="#launch-company-form">Company details</a>
            <a href="#launch-blueprint">What gets created</a>
            <Link href="/help">Help center</Link>
          </nav>
          <div className="launch-header-actions"><LaunchPreferences /></div>
        </header>

        <section className="launch-create-shell">
          <aside className="launch-create-intro">
            <div className="launch-create-copy">
              <span className="launch-kicker light"><Icon name="sparkles" size={15} /> Guided ERP launch</span>
              <h1>Launch your company on a finance-ready foundation.</h1>
              <p>Start with the legal and operating details HisabTech needs to prepare your books, locations, stock controls and administrator access correctly from day one.</p>
            </div>

            <div className="launch-create-proof" aria-label="Launch benefits">
              <span><Icon name="check-circle" size={17} /><b>Structured correctly</b><small>Accounts, tax rules and periods are provisioned together.</small></span>
              <span><Icon name="check-circle" size={17} /><b>Ready for operations</b><small>Your first branch and warehouse are connected automatically.</small></span>
              <span><Icon name="check-circle" size={17} /><b>Protected by default</b><small>Owner controls and privileged access are established early.</small></span>
            </div>

            <section className="launch-blueprint" id="launch-blueprint" aria-label="Workspace blueprint">
              <div className="launch-blueprint-heading"><div><span>Workspace blueprint</span><strong>Prepared automatically</strong></div><Icon name="workflow" size={23} /></div>
              <div className="launch-blueprint-grid">
                <article><Icon name="landmark" size={20} /><div><strong>Finance core</strong><small>Ledger, periods and VAT</small></div></article>
                <article><Icon name="building" size={20} /><div><strong>Operating structure</strong><small>Branch and warehouse</small></div></article>
                <article><Icon name="boxes" size={20} /><div><strong>Inventory controls</strong><small>Stock-ready locations</small></div></article>
                <article><Icon name="shield-check" size={20} /><div><strong>Owner security</strong><small>Protected administration</small></div></article>
              </div>
            </section>
          </aside>

          <section className="launch-create-card" id="launch-company-form">
            <div className="launch-create-heading">
              <span>Company launch · Step 1 of 8</span>
              <div className="launch-create-title"><span><Icon name="building" size={23} /></span><div><h2>Create your company workspace</h2><p>Use the legal details that should appear on invoices, reports and statutory records.</p></div></div>
            </div>

            <div className="launch-form-note"><Icon name="lightbulb" size={18} /><p><strong>Start with the essentials.</strong> You can refine tax, branch and product information in the guided roadmap after the workspace is created.</p></div>
            {query.error ? <p className="setup-flash error">{query.error}</p> : null}

            <form action={bootstrapGuidedOrganization} className="setup-form launch-form two-column">
              <label><span className="launch-field-label">Owner full name<small>Primary administrator</small></span><input name="fullName" autoComplete="name" required maxLength={120} placeholder="Mahir Aman" /></label>
              <label><span className="launch-field-label">Company name<small>Legal or trading name</small></span><input name="organizationName" autoComplete="organization" required maxLength={160} placeholder="Your company name" /></label>
              <label><span className="launch-field-label">Business type<small>Used to tailor your setup</small></span><select name="businessType" defaultValue="Retail & distribution"><option>Retail & distribution</option><option>Wholesale</option><option>Manufacturing</option><option>Professional services</option><option>Construction</option><option>Hospitality</option><option>Nonprofit</option><option>Other</option></select></label>
              <label><span className="launch-field-label">Primary branch<small>Your first operating location</small></span><input name="branchName" defaultValue="Main Branch" required maxLength={160} /></label>
              <label><span className="launch-field-label">Country<small>Localization and tax context</small></span><select name="countryCode" defaultValue="ET"><option value="ET">Ethiopia</option><option value="KE">Kenya</option><option value="AE">United Arab Emirates</option><option value="US">United States</option><option value="GB">United Kingdom</option></select></label>
              <label><span className="launch-field-label">Base currency<small>Primary reporting currency</small></span><select name="currency" defaultValue="ETB"><option value="ETB">ETB — Ethiopian Birr</option><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="AED">AED — UAE Dirham</option><option value="KES">KES — Kenyan Shilling</option></select></label>
              <label><span className="launch-field-label">Timezone<small>Dates, periods and audit events</small></span><select name="timezone" defaultValue="Africa/Addis_Ababa"><option>Africa/Addis_Ababa</option><option>Africa/Nairobi</option><option>Asia/Dubai</option><option>Europe/London</option><option>America/New_York</option></select></label>
              <label><span className="launch-field-label">TIN<small>Optional during initial setup</small></span><input name="tin" maxLength={30} placeholder="Tax identification number" /></label>
              <label className="full"><span className="launch-field-label">Business phone<small>Optional company contact</small></span><input name="phone" autoComplete="tel" maxLength={40} placeholder="+251 ..." /></label>
              <button type="submit" className="primary full launch-submit-button"><span>Create company workspace</span><Icon name="arrow-right" size={19} /></button>
            </form>

            <footer className="launch-create-footer"><Icon name="lock" size={16} /><span>Your company data is protected by Supabase authentication and organization-level access controls.</span></footer>
          </section>
        </section>
      </main>
    );
  }

  const snapshot = await getOnboardingSnapshot();
  if (!snapshot) return null;
  const strongAdmin = context.mfaRequired && context.aal === "aal2";
  const completeMap = new Map(snapshot.progress.steps.map((step) => [step.key, step.complete]));
  const nextStep = orderedSteps.find((key) => !completeMap.get(key)) ?? "security";
  const remaining = snapshot.progress.total - snapshot.progress.completed;
  const masterRecords = snapshot.counts.customers + snapshot.counts.suppliers + snapshot.counts.products;
  const progressStyle = { "--launch-progress": `${snapshot.progress.percent}%` } as CSSProperties;

  return (
    <main className="guided-setup-page launch-center">
      <header className="launch-topbar">
        <LaunchBrand />
        <nav className="launch-header-nav" aria-label="Company launch navigation">
          <a href="#launch-overview">Overview</a>
          <a href="#launch-roadmap">Roadmap</a>
          <a href="#launch-tasks">Setup tasks</a>
          <Link href="/help">Help</Link>
        </nav>
        <div className="launch-header-actions"><LaunchPreferences /><Link href="/" className="launch-dashboard-link"><Icon name="grid" size={17} /><span>Open dashboard</span><Icon name="arrow-right" size={15} /></Link></div>
      </header>

      <section className="launch-overview" id="launch-overview" style={progressStyle}>
        <div className="launch-overview-copy">
          <span className="launch-kicker"><Icon name="sparkles" size={15} /> Company launch center</span>
          <div className="launch-title-row"><h1>{snapshot.organization.name}</h1><span className={remaining === 0 ? "ready" : "in-progress"}>{remaining === 0 ? "Launch ready" : "Setup in progress"}</span></div>
          <p>Build the operating foundation once, validate the critical controls, and move into daily work with dependable financial and inventory data.</p>
          <div className="launch-overview-actions">
            <a href={`#setup-${nextStep}`} className="launch-primary-action"><span>Continue: {stepCopy[nextStep].title}</span><Icon name="arrow-right" size={17} /></a>
            <Link href="/" className="launch-tertiary-action"><Icon name="home" size={17} /><span>View workspace</span></Link>
          </div>
        </div>

        <aside className="launch-progress-card" aria-label={`${formatPercent(snapshot.progress.percent)} of company setup complete`}>
          <div className="launch-progress-ring"><div><strong>{formatPercent(snapshot.progress.percent)}</strong><span>complete</span></div></div>
          <div className="launch-progress-copy"><span>Launch readiness</span><strong>{snapshot.progress.completed} of {snapshot.progress.total} milestones complete</strong><p>{remaining === 0 ? "Your operating foundation is ready for daily use." : `${remaining} focused ${remaining === 1 ? "task remains" : "tasks remain"} before launch readiness.`}</p></div>
          <div className="launch-progress-track"><span /></div>
        </aside>
      </section>

      <section className="launch-snapshot-grid" aria-label="Workspace launch snapshot">
        <article><span><Icon name="building" size={20} /></span><div><strong>{snapshot.branches.length}</strong><b>Branches</b><small>Operating locations</small></div></article>
        <article><span><Icon name="boxes" size={20} /></span><div><strong>{snapshot.warehouses.length}</strong><b>Warehouses</b><small>Inventory locations</small></div></article>
        <article><span><Icon name="landmark" size={20} /></span><div><strong>{snapshot.accounts.length}</strong><b>Ledger accounts</b><small>Finance foundation</small></div></article>
        <article><span><Icon name="users" size={20} /></span><div><strong>{masterRecords}</strong><b>Master records</b><small>Contacts and products</small></div></article>
      </section>

      {query.success ? <p className="setup-flash success">{query.success}</p> : null}
      {query.error ? <p className="setup-flash error">{query.error}</p> : null}

      <section className="launch-layout">
        <aside className="launch-rail" id="launch-roadmap">
          <div className="launch-rail-card">
            <div className="launch-rail-heading"><span><Icon name="workflow" size={18} /></span><div><small>Launch roadmap</small><strong>{snapshot.progress.completed}/{snapshot.progress.total} completed</strong></div></div>
            <nav aria-label="Company setup progress">
              {orderedSteps.map((key) => {
                const complete = Boolean(completeMap.get(key));
                const current = key === nextStep;
                return (
                  <a href={`#setup-${key}`} className={`${complete ? "complete" : ""} ${current ? "current" : ""}`} key={key}>
                    <span className="launch-rail-step-icon"><Icon name={complete ? "check-circle" : stepCopy[key].icon} size={16} /><small>{stepCopy[key].number}</small></span>
                    <div><strong>{stepCopy[key].title}</strong><small>{complete ? "Completed" : current ? "Recommended next" : "Not started"}</small></div>
                    <Icon className="launch-rail-chevron" name="chevron-right" size={15} />
                  </a>
                );
              })}
            </nav>
          </div>

          <div className="launch-rail-note">
            <span><Icon name="lightbulb" size={16} /> Recommended next</span>
            <strong>{stepCopy[nextStep].title}</strong>
            <p>{stepCopy[nextStep].description}</p>
            <a href={`#setup-${nextStep}`}>Continue setup <Icon name="arrow-right" size={15} /></a>
          </div>
        </aside>

        <section className="launch-main" aria-label="Company setup tasks" id="launch-tasks">
          {!strongAdmin ? <div className="launch-security-gate"><MfaSecurityPanel organizationId={context.organizationId} required={context.mfaRequired} initialAal={context.aal} /></div> : null}

          <div className="launch-main-heading">
            <div><span>Guided company setup</span><h2>Complete the foundation in a controlled order.</h2></div>
            <p>Open each milestone for the required action, context and current company data. Completed sections remain available for review.</p>
          </div>

          <div className="launch-guidance-bar"><span><Icon name="lightbulb" size={19} /></span><div><strong>Focus on the recommended step.</strong><p>Imports and refinements can happen later. The roadmap prioritizes the controls that protect accounting accuracy and operational continuity.</p></div></div>

          <div className="launch-task-list">
            <SetupTask stepKey="company" complete={Boolean(completeMap.get("company"))} current={nextStep === "company"}>
              <form action={updateCompanyProfileAction} className="setup-form launch-form two-column">
                <label>Company name<input name="organizationName" defaultValue={snapshot.organization.name} required /></label>
                <label>Business type<input name="businessType" defaultValue={snapshot.organization.industry || ""} required /></label>
                <label>Country code<input name="countryCode" defaultValue={snapshot.organization.country_code} required maxLength={2} /></label>
                <label>Currency<input name="currency" defaultValue={snapshot.organization.base_currency} required maxLength={3} /></label>
                <label>Timezone<input name="timezone" defaultValue={snapshot.organization.timezone} required /></label>
                <label>TIN<input name="tin" defaultValue={snapshot.organization.tin || ""} /></label>
                <label>VAT number<input name="vatNumber" defaultValue={snapshot.organization.vat_number || ""} /></label>
                <label>Phone<input name="phone" defaultValue={snapshot.organization.phone || ""} /></label>
                <button className="primary full button-with-icon" type="submit" disabled={!strongAdmin}><Icon name="save" size={18} /><span>Save company profile</span></button>
              </form>
            </SetupTask>

            <SetupTask stepKey="branches" complete={Boolean(completeMap.get("branches"))} current={nextStep === "branches"}>
              <div className="launch-inline-stats"><span><strong>{snapshot.branches.length}</strong> active branches</span><span><strong>{snapshot.warehouses.length}</strong> warehouses</span></div>
              {snapshot.branches.length ? <div className="launch-record-list">{snapshot.branches.map((branch) => <span key={branch.id}><Icon name="building" size={15} /><strong>{branch.name}</strong><small>{branch.code}</small></span>)}</div> : null}
              <form action={createOnboardingBranchAction} className="setup-form launch-form two-column">
                <label>Branch name<input name="name" required placeholder="Bole Branch" /></label>
                <label>Code<input name="code" required placeholder="BOLE" /></label>
                <label className="full">Address<input name="address" placeholder="City, sub-city and street" /></label>
                <label className="setup-checkbox full"><input type="checkbox" name="createWarehouse" defaultChecked /><span>Create a linked warehouse automatically</span></label>
                <button className="secondary full button-with-icon" type="submit" disabled={!strongAdmin}><Icon name="plus" size={18} /><span>Add branch</span></button>
              </form>
            </SetupTask>

            <SetupTask stepKey="contacts" complete={Boolean(completeMap.get("contacts"))} current={nextStep === "contacts"}>
              <div className="launch-inline-stats"><span><strong>{snapshot.counts.customers}</strong> customers</span><span><strong>{snapshot.counts.suppliers}</strong> suppliers</span></div>
              <div className="launch-import-grid">
                <form action={importCustomersAction} className="launch-import-card"><div className="launch-import-icon"><Icon name="users" size={21} /></div><div><span>CSV import</span><h3>Customer master data</h3><p>Required column: <code>name</code></p></div><input type="file" name="file" accept=".csv,text/csv" required /><button type="submit" disabled={!strongAdmin}><Icon name="upload" size={16} /> Import customers</button></form>
                <form action={importSuppliersAction} className="launch-import-card"><div className="launch-import-icon"><Icon name="receipt" size={21} /></div><div><span>CSV import</span><h3>Supplier master data</h3><p>Required column: <code>name</code></p></div><input type="file" name="file" accept=".csv,text/csv" required /><button type="submit" disabled={!strongAdmin}><Icon name="upload" size={16} /> Import suppliers</button></form>
              </div>
            </SetupTask>

            <SetupTask stepKey="products" complete={Boolean(completeMap.get("products"))} current={nextStep === "products"}>
              <div className="launch-inline-stats"><span><strong>{snapshot.counts.products}</strong> products</span><span><strong>{snapshot.counts.openingStock}</strong> stocked SKUs</span></div>
              <form action={importProductsAction} className="launch-import-card launch-import-wide">
                <div className="launch-import-icon"><Icon name="package-check" size={21} /></div>
                <div><span>CSV import</span><h3>Products and opening stock</h3><p><code>sku</code> and <code>name</code> are required. Opening quantity is optional.</p></div>
                <label>Opening warehouse<select name="warehouseId" required>{snapshot.warehouses.map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name} · {warehouse.code}</option>)}</select></label>
                <input type="file" name="file" accept=".csv,text/csv" required />
                <button type="submit" disabled={!strongAdmin}><Icon name="upload" size={16} /> Import products and stock</button>
              </form>
            </SetupTask>

            <SetupTask stepKey="taxes" complete={Boolean(completeMap.get("taxes"))} current={nextStep === "taxes"}>
              <div className="launch-review-card"><div className="launch-review-icon"><Icon name="check-circle" size={22} /></div><div><span>Provisioned automatically</span><h3>{snapshot.accounts.length} ledger accounts · {snapshot.counts.taxCodes} tax codes</h3><p>Review account naming, manual-posting permissions, VAT rates and statutory treatment before filing.</p></div><Link href="/finance?tab=accounts" className="launch-secondary-action"><span>Review finance setup</span><Icon name="arrow-right" size={16} /></Link></div>
            </SetupTask>

            <SetupTask stepKey="opening" complete={Boolean(completeMap.get("opening"))} current={nextStep === "opening"}>
              <form action={postOpeningBalanceAction} className="setup-form launch-form two-column">
                <label>Branch<select name="branchId" required>{snapshot.branches.map((branch) => <option value={branch.id} key={branch.id}>{branch.name}</option>)}</select></label>
                <label>Entry date<input name="entryDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
                <label>Debit account<select name="debitAccountId" required>{snapshot.accounts.map((account) => <option value={account.id} key={account.id}>{account.code} · {account.name}</option>)}</select></label>
                <label>Credit account<select name="creditAccountId" required>{snapshot.accounts.map((account) => <option value={account.id} key={account.id}>{account.code} · {account.name}</option>)}</select></label>
                <label>Amount<input type="number" min="0.01" step="0.01" name="amount" required /></label>
                <label>Notes<input name="notes" placeholder="Opening cash, capital, inventory, payable…" /></label>
                <button type="submit" className="primary full button-with-icon" disabled={!strongAdmin}><Icon name="landmark" size={18} /><span>Post opening journal</span></button>
              </form>
            </SetupTask>

            <SetupTask stepKey="invoice" complete={Boolean(completeMap.get("invoice"))} current={nextStep === "invoice"}>
              <div className="launch-review-card"><div className="launch-review-icon invoice"><Icon name="receipt" size={22} /></div><div><span>Workflow validation</span><h3>{snapshot.counts.invoices ? `${snapshot.counts.invoices} invoice${snapshot.counts.invoices === 1 ? "" : "s"} posted` : "Create the first live invoice"}</h3><p>The invoice workflow posts receivable, revenue, VAT, inventory and cost of goods sold atomically.</p></div><Link href="/sales/invoices/new" className="launch-primary-action"><span>Create invoice</span><Icon name="arrow-right" size={16} /></Link></div>
            </SetupTask>

            <SetupTask stepKey="security" complete={Boolean(completeMap.get("security"))} current={nextStep === "security"}>
              <div className="launch-review-card"><div className="launch-review-icon security"><Icon name="shield-check" size={22} /></div><div><span>Privileged access</span><h3>{completeMap.get("security") ? "Administrator protection is active" : "Authenticator enrollment is required"}</h3><p>MFA-gated permissions protect finance, inventory, payroll, user management and production controls.</p></div><Link href="/account" className="launch-primary-action"><span>Open account security</span><Icon name="arrow-right" size={16} /></Link></div>
            </SetupTask>
          </div>

          <ReadinessRoadmap role={context.role} />

          <footer className="launch-finish">
            <div className="launch-finish-icon"><Icon name={snapshot.progress.completed === 8 ? "check-circle" : "workflow"} size={24} /></div>
            <div><span>{snapshot.progress.completed === 8 ? "Launch complete" : `${remaining} task${remaining === 1 ? "" : "s"} remaining`}</span><strong>{snapshot.progress.completed === 8 ? "Your operating foundation is ready." : "Finish the critical controls, then move into daily operations."}</strong><p>{snapshot.progress.completed === 8 ? "Continue monitoring production controls as the team and transaction volume grow." : "The roadmap keeps accounting, security and inventory dependencies in the correct order."}</p></div>
            <Link href="/security">Review production controls <Icon name="arrow-right" size={17} /></Link>
          </footer>
        </section>
      </section>
    </main>
  );
}
