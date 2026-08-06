import type { UserContext } from "../lib/data/types";

type Role = UserContext["role"];

type ReadinessItem = {
  number: string;
  title: string;
  status: string;
  tone: "success" | "review" | "info";
  summary: string;
  points: string[];
};

const roleNames: Record<Role, string> = {
  owner: "Owner",
  admin: "Administrator",
  accountant: "Accountant",
  sales: "Sales",
  inventory: "Inventory",
  manager: "Manager",
  staff: "Staff",
  viewer: "Viewer",
};

export function ReadinessRoadmap({ role }: { role: Role }) {
  const items: ReadinessItem[] = [
    {
      number: "07",
      title: "Standardize the design system",
      status: "Implemented",
      tone: "success",
      summary: "Hisab now uses one semantic token system for color, spacing, typography, radius, elevation, focus and reusable interface states.",
      points: [
        "Use semantic tokens instead of page-specific color values.",
        "Reuse the same card, badge, action, field and focus patterns.",
        "Review responsive behavior and dark mode before release.",
      ],
    },
    {
      number: "08",
      title: "Review translations professionally",
      status: "Professional sign-off required",
      tone: "review",
      summary: "Automated coverage and terminology checks are active. Native-language reviewers must approve Amharic and Tigrinya before formal certification.",
      points: [
        "Assign named native Amharic and Tigrinya reviewers.",
        "Review accounting, tax, payroll and legal terminology in context.",
        "Check truncation, tone, dates, numbers, currencies and accessibility labels.",
        "Record reviewer, date, application version and approved exceptions.",
      ],
    },
    {
      number: "09",
      title: "Add role-based dashboards",
      status: "Active",
      tone: "success",
      summary: `The ${roleNames[role]} workspace now prioritizes the right actions, operational signals and ERP modules for that role.`,
      points: [
        "Owners and administrators see executive control priorities.",
        "Accountants see finance, journals, receivables and reporting priorities.",
        "Sales and inventory teams receive task-focused operational shortcuts.",
        "Managers, staff and viewers receive appropriate read or action emphasis.",
      ],
    },
    {
      number: "10",
      title: "Obtain Ethiopian compliance review",
      status: "Specialist review required",
      tone: "review",
      summary: "Use this readiness list with licensed Ethiopian tax, accounting, payroll, privacy and sector professionals. It is not a legal certification.",
      points: [
        "Verify legal entity details, TIN, VAT or TOT status and every registered branch.",
        "Confirm invoice numbering, required buyer and seller fields, tax codes, e-invoice or EFD approval and accounting-software acceptance.",
        "Confirm the applicable AABE reporting tier and financial reporting framework.",
        "Validate period locks, balanced journals, audit exports, record retention, backups and restore evidence.",
        "Review payroll, PAYE, pension and employee-record obligations with a local adviser.",
        "Review privacy notices, access controls, retention, processor terms and incident response.",
        "Review electronic consent, signatures and record integrity for digital transactions.",
        "Obtain any sector-specific licence or regulator review before launch.",
      ],
    },
  ];

  return (
    <section className="readiness-roadmap" aria-labelledby="product-readiness-heading">
      <div className="readiness-heading">
        <div>
          <span>Product readiness · steps 7–10</span>
          <h2 id="product-readiness-heading">Finish the controls that make the ERP consistent, usable and reviewable.</h2>
        </div>
        <p>Operational setup remains separate. These release controls apply to the product and every future update.</p>
      </div>
      <div className="readiness-grid">
        {items.map((item) => (
          <details className={`readiness-card ${item.tone}`} key={item.number} open={item.number === "10"}>
            <summary>
              <span className="readiness-number">{item.number}</span>
              <span className="readiness-copy"><strong>{item.title}</strong><small>{item.summary}</small></span>
              <span className={`ds-badge ${item.tone}`}>{item.status}</span>
              <span className="readiness-chevron" aria-hidden="true">⌄</span>
            </summary>
            <ul>{item.points.map((point) => <li key={point}>{point}</li>)}</ul>
          </details>
        ))}
      </div>
    </section>
  );
}
