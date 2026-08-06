"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "./language-provider";
import { Icon, type IconName } from "./ui/icon";

type HelpArticle = {
  title: string;
  summary: string;
  body: string;
  steps?: string[];
  href?: string;
  actionLabel?: string;
};

type HelpCategory = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  articles: HelpArticle[];
};

type Props = {
  activeLabel: string;
  onNavigate: () => void;
};

const popularGuides: Array<{ title: string; copy: string; href: string; icon: IconName }> = [
  {
    title: "Set up your company",
    copy: "Complete organization details, security controls, and the guided launch checklist.",
    href: "/onboarding",
    icon: "building",
  },
  {
    title: "Create your first invoice",
    copy: "Add a customer, confirm stock, calculate VAT, and post a protected sales invoice.",
    href: "/sales/invoices/new",
    icon: "file-check",
  },
  {
    title: "Review business performance",
    copy: "Understand sales, expenses, cash, operating result, and exportable reports.",
    href: "/reports",
    icon: "chart",
  },
  {
    title: "Secure administrator access",
    copy: "Configure authenticator MFA and review session assurance before sensitive work.",
    href: "/account",
    icon: "shield-check",
  },
];

const helpCategories: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "Learn what HisabTech manages and prepare a safe first workspace.",
    icon: "building",
    articles: [
      {
        title: "What is HisabTech?",
        summary: "A secure ERP workspace for operating and understanding your business.",
        body: "HisabTech brings customers, sales, inventory, purchasing, finance, reporting, people operations, electronic invoicing, reconciliation, and production controls into one protected workspace. Access is role-based, and sensitive workflows remain subject to security and accounting controls.",
        href: "/modules",
        actionLabel: "Explore ERP modules",
      },
      {
        title: "First-time setup checklist",
        summary: "Complete the minimum configuration before entering live business records.",
        body: "Use Guided Setup to prepare the organization, administrator security, accounting defaults, operational modules, backup expectations, and launch readiness. Resolve critical warnings before treating the workspace as production-ready.",
        steps: [
          "Confirm the legal organization name and operating details.",
          "Enroll privileged users in authenticator MFA.",
          "Review accounting, tax, inventory, and invoice defaults.",
          "Confirm backup and restore-test responsibilities.",
          "Use test records before entering live transactions.",
        ],
        href: "/onboarding",
        actionLabel: "Open guided setup",
      },
      {
        title: "Navigate the workspace",
        summary: "Use the hover sidebar, global search, page groups, and mobile navigation.",
        body: "On desktop, the compact sidebar expands when you hover over it or move keyboard focus into it. Use Ctrl or Command plus K to search pages, modules, reports, and quick actions. On mobile, use the drawer, bottom navigation, and search button.",
      },
      {
        title: "Language and display preferences",
        summary: "Switch between English and Amharic and use the supported display modes.",
        body: "Language selection changes supported interface labels without changing stored business data. Display preferences affect the interface only. Always review financial values, dates, tax settings, and document content before posting.",
      },
    ],
  },
  {
    id: "sales-customers",
    title: "Sales and customers",
    description: "Manage customer records, invoices, credit exposure, and collections.",
    icon: "users",
    articles: [
      {
        title: "Create and maintain customers",
        summary: "Store contact details, taxpayer information, and credit limits.",
        body: "Create a customer before issuing a sales document. Keep names, phone numbers, email addresses, TIN details, and credit limits accurate. Review duplicate records and outstanding exposure before extending more credit.",
        href: "/customers",
        actionLabel: "Open customers",
      },
      {
        title: "Create a sales invoice",
        summary: "Choose a customer and products, verify VAT and stock, then review before posting.",
        body: "Invoice creation should follow a controlled sequence. Confirm the customer, product, quantity, price, VAT rate, available stock, notes, and totals. Posting may affect receivables, revenue, tax, inventory, cost, and audit records depending on the configured workflow.",
        steps: [
          "Select the correct customer and confirm credit exposure.",
          "Add products and verify available quantity.",
          "Review price, discounts, VAT, and document notes.",
          "Confirm totals and posting date before submission.",
          "Review the resulting invoice and accounting impact.",
        ],
        href: "/sales/invoices/new",
        actionLabel: "Create sales invoice",
      },
      {
        title: "Customer credit and collections",
        summary: "Monitor credit limits, receivables, overdue balances, and payment follow-up.",
        body: "Credit limits are a control, not a guarantee of payment. Review the customer's current exposure before invoicing and use reports to identify overdue or partially paid balances. Reconcile receipts against the correct customer and invoice.",
        href: "/reports",
        actionLabel: "Review receivables",
      },
    ],
  },
  {
    id: "inventory-purchasing",
    title: "Inventory and purchasing",
    description: "Control products, stock levels, replenishment, and warehouse movement.",
    icon: "boxes",
    articles: [
      {
        title: "Products and stock positions",
        summary: "Review SKU, quantity, reorder level, price, and warehouse assignment.",
        body: "Inventory records represent operational and financial information. Keep product names, SKUs, units, selling prices, reorder levels, and warehouse assignments consistent. Investigate unexpected negative or unusually high quantities before continuing transactions.",
        href: "/inventory",
        actionLabel: "Open inventory",
      },
      {
        title: "Reorder and purchasing workflow",
        summary: "Use stock exceptions and demand signals to plan replenishment.",
        body: "Review low-stock products and open purchasing activity before ordering. Confirm supplier terms, quantity, unit cost, tax treatment, delivery location, and approval responsibility. Avoid duplicate purchase activity for the same requirement.",
        href: "/purchasing",
        actionLabel: "Open purchasing",
      },
      {
        title: "Warehouse and stock controls",
        summary: "Protect valuation, movement history, and negative-stock prevention.",
        body: "Stock changes should be traceable to a valid sale, purchase, transfer, return, adjustment, or production event. Review movement history and supporting evidence before correcting quantity differences. Never use an adjustment to hide an unresolved operational problem.",
        href: "/modules/inventory-warehouse",
        actionLabel: "Review inventory controls",
      },
    ],
  },
  {
    id: "finance-reporting",
    title: "Finance, reconciliation, and reports",
    description: "Understand journals, periods, payments, reconciliation, and business results.",
    icon: "landmark",
    articles: [
      {
        title: "Finance workspace overview",
        summary: "Review accounts, balances, journals, payments, tax, periods, and assets.",
        body: "The Finance workspace summarizes accounting structures and activity. Use it to review chart-of-account balances, journal entries, receipts and payments, tax codes, accounting periods, fixed assets, invoices, receivables, and financial position.",
        href: "/finance",
        actionLabel: "Open finance",
      },
      {
        title: "Journal entries and period locks",
        summary: "Post balanced entries only to an appropriate open accounting period.",
        body: "Every journal must have equal debit and credit totals and enough evidence to explain the transaction. Confirm the posting date, account selection, memo, reference, and approval responsibility. Locked periods protect completed reporting and should not be bypassed casually.",
        href: "/finance/journals",
        actionLabel: "Review journals",
      },
      {
        title: "Payments and reconciliation",
        summary: "Match receipts and payments to the correct source records and bank activity.",
        body: "Reconciliation confirms that internal records agree with external payment or bank evidence. Match by amount, date, reference, counterparty, and source document. Investigate duplicates, missing entries, timing differences, and unexplained balances before marking work complete.",
        href: "/reconciliation",
        actionLabel: "Open reconciliation",
      },
      {
        title: "Reports and exports",
        summary: "Review performance after transactions are posted and validated.",
        body: "Reports summarize sales, expenses, cash, operating result, receivables, and other configured measures. Confirm the reporting period and transaction completeness before relying on the output. Exported files are snapshots and should be stored and shared securely.",
        href: "/reports",
        actionLabel: "Open reports",
      },
    ],
  },
  {
    id: "operations-compliance",
    title: "Operations and compliance",
    description: "Use people, electronic invoicing, and module controls responsibly.",
    icon: "workflow",
    articles: [
      {
        title: "Human resources and payroll",
        summary: "Manage people operations with restricted access and careful review.",
        body: "HR and payroll data may contain sensitive personal and compensation information. Use role-based access, validate employee details and pay periods, and review calculations and approvals before finalizing any payroll-related workflow.",
        href: "/hr",
        actionLabel: "Open HR workspace",
      },
      {
        title: "Electronic invoicing readiness",
        summary: "Prepare issuer identity, submission method, document evidence, and cancellation controls.",
        body: "Electronic invoicing requires accurate taxpayer identity, approved submission configuration, invoice identifiers, QR or clearance evidence where applicable, offline queue handling, and cancellation records. Secret keys and certificate files must be stored only in approved secure configuration.",
        href: "/e-invoicing",
        actionLabel: "Open electronic invoicing",
      },
      {
        title: "ERP modules and feature scope",
        summary: "Understand which modules are active, planned, or controlled for your organization.",
        body: "The module catalog explains functional areas and implementation priority. Availability may depend on configuration, permissions, and rollout phase. A visible module does not automatically grant permission to view or change its records.",
        href: "/modules",
        actionLabel: "Browse modules",
      },
    ],
  },
  {
    id: "security-admin",
    title: "Security and administration",
    description: "Protect identities, permissions, audit evidence, backups, and production data.",
    icon: "shield-check",
    articles: [
      {
        title: "Account security and MFA",
        summary: "Use authenticator MFA and strong session assurance for privileged work.",
        body: "Administrators and other privileged users should enroll an authenticator and complete the required assurance step before sensitive operations. Never share passwords, one-time codes, recovery information, tokens, or secret keys.",
        href: "/account",
        actionLabel: "Open account security",
      },
      {
        title: "Roles and permissions",
        summary: "Access is limited by organization membership, role, and protected route rules.",
        body: "Owners, administrators, accountants, sales users, inventory users, managers, staff, and viewers may have different capabilities. Use the least privilege needed for each person. Access denial usually means the user lacks the required role, organization context, or assurance level.",
      },
      {
        title: "Production controls and database health",
        summary: "Review alerts, backup evidence, restore testing, health checks, and control warnings.",
        body: "Production Controls is the operational assurance center. Review critical alerts, administrator MFA status, backup freshness, restore-test evidence, accounting integrity checks, inventory exceptions, database security checks, and deployment health before relying on the system for critical work.",
        href: "/security",
        actionLabel: "Open production controls",
      },
      {
        title: "Audit evidence and safe operation",
        summary: "Keep actions traceable and avoid destructive shortcuts.",
        body: "Use accurate user accounts, meaningful references, supporting documents, and approved workflows. Do not share accounts, edit production data directly, bypass locked periods, hide stock differences, or restore over live data without an authorized recovery plan.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Resolve common access, data, total, inventory, and session problems safely.",
    icon: "alert-triangle",
    articles: [
      {
        title: "I cannot open a page",
        summary: "Check authentication, organization access, role permissions, and MFA assurance.",
        body: "Sign in again if the session has expired. Confirm that you belong to the correct organization and have the required role. Sensitive pages may require authenticator MFA. Contact an organization owner or administrator when access is expected but still denied.",
        href: "/account",
        actionLabel: "Review account security",
      },
      {
        title: "New data is not appearing",
        summary: "Confirm filters, dates, organization context, posting status, and page refresh.",
        body: "Check the selected organization, date range, status filters, search terms, and whether the record was saved or posted successfully. Refresh the page after confirming the operation. Avoid recreating the transaction until you verify that it does not already exist.",
      },
      {
        title: "Totals or reports do not match",
        summary: "Review posting dates, document status, journals, tax, payments, and reporting period.",
        body: "Differences often come from draft or unposted records, incorrect dates, partial payments, tax treatment, duplicate entries, period selection, or reconciliation timing. Trace the result back to source documents and balanced journal entries before making corrections.",
        href: "/finance/journals",
        actionLabel: "Review journal entries",
      },
      {
        title: "Stock quantity looks wrong",
        summary: "Trace sales, purchases, transfers, returns, adjustments, and warehouse selection.",
        body: "Review the product, warehouse, movement history, document dates, and posting status. Confirm whether a sale, purchase, return, transfer, or adjustment created the difference. Correct the source workflow when possible instead of adding an unexplained stock adjustment.",
        href: "/inventory",
        actionLabel: "Review inventory",
      },
      {
        title: "The app appears unavailable",
        summary: "Check the health endpoint, deployment state, database configuration, and recent alerts.",
        body: "Administrators should review Production Controls and deployment health before retrying critical work. Preserve any error message, page, time, and action that triggered the problem. Do not repeatedly submit financial transactions during an uncertain outage.",
        href: "/security",
        actionLabel: "Review system health",
      },
    ],
  },
];

export function HelpCenterPanel({ activeLabel, onNavigate }: Props) {
  const { t } = useLanguage();
  const [helpQuery, setHelpQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const normalized = helpQuery.trim().toLowerCase();
    if (!normalized) return helpCategories;

    return helpCategories
      .map((category) => ({
        ...category,
        articles: category.articles.filter((article) => {
          const searchable = [
            category.title,
            category.description,
            article.title,
            article.summary,
            article.body,
            ...(article.steps ?? []),
            t(category.title),
            t(category.description),
            t(article.title),
            t(article.summary),
            t(article.body),
            ...(article.steps ?? []).map((step) => t(step)),
          ].join(" ").toLowerCase();
          return searchable.includes(normalized);
        }),
      }))
      .filter((category) => category.articles.length > 0);
  }, [helpQuery, t]);

  const resultCount = filteredCategories.reduce((count, category) => count + category.articles.length, 0);

  return (
    <div className="assistance-panel-body help-center-body">
      <section className="help-welcome" aria-labelledby="help-welcome-title">
        <span className="help-welcome-icon"><Icon name="circle-help" size={22} /></span>
        <div>
          <strong id="help-welcome-title">{t("How can we help?")}</strong>
          <p>{t("Learn HisabTech workflows, controls, and safe operating practices for {0}.", [activeLabel])}</p>
        </div>
      </section>

      <label className="help-search-field">
        <span className="sr-only">{t("Search help articles")}</span>
        <Icon name="search" size={18} />
        <input
          value={helpQuery}
          onChange={(event) => setHelpQuery(event.target.value)}
          placeholder={t("Search setup, invoices, stock, reports, security…")}
        />
        {helpQuery && <button type="button" onClick={() => setHelpQuery("")} aria-label={t("Clear help search")}><Icon name="x" size={16} /></button>}
      </label>

      {!helpQuery && (
        <>
          <section className="help-section" aria-labelledby="popular-guides-title">
            <div className="help-section-heading">
              <div><span>{t("Start here")}</span><h3 id="popular-guides-title">{t("Popular guides")}</h3></div>
              <small>{t("Recommended for most users")}</small>
            </div>
            <div className="help-featured-grid">
              {popularGuides.map((guide) => (
                <Link href={guide.href} onClick={onNavigate} key={guide.title}>
                  <span><Icon name={guide.icon} size={19} /></span>
                  <strong>{t(guide.title)}</strong>
                  <small>{t(guide.copy)}</small>
                  <Icon name="arrow-right" size={15} />
                </Link>
              ))}
            </div>
          </section>

          <section className="help-learning-path" aria-labelledby="learning-path-title">
            <div className="help-section-heading">
              <div><span>{t("Recommended order")}</span><h3 id="learning-path-title">{t("Your first operating workflow")}</h3></div>
            </div>
            <ol>
              <li><span>01</span><div><strong>{t("Secure the account")}</strong><small>{t("Enroll MFA and confirm the correct organization and role.")}</small></div></li>
              <li><span>02</span><div><strong>{t("Configure the company")}</strong><small>{t("Complete setup, tax, accounting, stock, and invoice defaults.")}</small></div></li>
              <li><span>03</span><div><strong>{t("Create master records")}</strong><small>{t("Add customers and products before transactional work.")}</small></div></li>
              <li><span>04</span><div><strong>{t("Test, post, and review")}</strong><small>{t("Use test records, review accounting impact, then confirm reports.")}</small></div></li>
            </ol>
          </section>
        </>
      )}

      <section className="help-section help-library" aria-labelledby="help-library-title">
        <div className="help-section-heading">
          <div>
            <span>{helpQuery ? t("Search results") : t("Knowledge base")}</span>
            <h3 id="help-library-title">{helpQuery ? t("{0} matching articles", [resultCount]) : t("HisabTech user guide")}</h3>
          </div>
          {!helpQuery && <small>{t("Select an article to expand it")}</small>}
        </div>

        {filteredCategories.length ? filteredCategories.map((category) => (
          <section className="help-category" key={category.id} aria-labelledby={`help-${category.id}`}>
            <header>
              <span><Icon name={category.icon} size={18} /></span>
              <div><h4 id={`help-${category.id}`}>{t(category.title)}</h4><p>{t(category.description)}</p></div>
              <small>{t("{0} articles", [category.articles.length])}</small>
            </header>
            <div className="help-article-list">
              {category.articles.map((article) => (
                <details key={article.title}>
                  <summary>
                    <span><strong>{t(article.title)}</strong><small>{t(article.summary)}</small></span>
                    <Icon name="chevron-right" size={17} />
                  </summary>
                  <div className="help-article-content">
                    <p>{t(article.body)}</p>
                    {article.steps && (
                      <ol>
                        {article.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{t(step)}</p></li>)}
                      </ol>
                    )}
                    {article.href && article.actionLabel && (
                      <Link href={article.href} onClick={onNavigate}>{t(article.actionLabel)}<Icon name="arrow-right" size={15} /></Link>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )) : (
          <div className="help-empty-state">
            <Icon name="search" size={24} />
            <strong>{t("No help articles match your search.")}</strong>
            <p>{t("Try a module name such as sales, inventory, finance, reports, security, or setup.")}</p>
            <button type="button" onClick={() => setHelpQuery("")}>{t("Clear search")}</button>
          </div>
        )}
      </section>

      <section className="shortcut-reference help-shortcuts">
        <p>{t("Keyboard shortcuts")}</p>
        <div><span>{t("Open global search")}</span><kbd>Ctrl K</kbd></div>
        <div><span>{t("Close active panel")}</span><kbd>Esc</kbd></div>
        <div><span>{t("Expand sidebar")}</span><kbd>{t("Hover or focus")}</kbd></div>
      </section>

      <div className="help-safety-note"><Icon name="shield-check" size={16} /><p>{t("Help content is read-only. Opening or searching this panel never changes business records.")}</p></div>
    </div>
  );
}
