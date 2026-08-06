export type ProofStandard = {
  number: string;
  title: string;
  description: string;
};

export type ReferenceProgram = {
  number: string;
  title: string;
  summary: string;
  measures: string[];
  status: string;
};

export const proofStandards: ProofStandard[] = [
  { number: "01", title: "Verified business identity", description: "A published story identifies the participating business and confirms that HisabERP was used in the described workflow." },
  { number: "02", title: "Documented starting point", description: "The case study records the process before implementation, including the operational problem and the baseline measurement." },
  { number: "03", title: "Defined implementation scope", description: "Readers can see which modules, teams, locations and reporting periods were included in the evaluation." },
  { number: "04", title: "Measured outcome", description: "Results are published only when they can be supported by product records, operational evidence or an agreed measurement method." },
  { number: "05", title: "Customer approval", description: "The participating business reviews the final story and approves every public statement before publication." },
];

export const referencePrograms: ReferenceProgram[] = [
  {
    number: "01",
    title: "Retail operations",
    summary: "A structured evaluation for stores moving from notebooks or disconnected spreadsheets into a shared sales, inventory and cash workspace.",
    measures: ["Daily sales visibility", "Stock discrepancy rate", "Time required to prepare management totals", "Outstanding customer balance visibility"],
    status: "Reference program open",
  },
  {
    number: "02",
    title: "Wholesale and distribution",
    summary: "A reference track for businesses that need connected order, stock, supplier, receivable and collection information.",
    measures: ["Order-to-cash cycle", "Stock availability", "Receivable follow-up time", "Supplier obligation visibility"],
    status: "Reference program open",
  },
  {
    number: "03",
    title: "Professional services",
    summary: "A measurement program for service teams that want cleaner invoicing, expense control, customer history and management reporting.",
    measures: ["Invoice preparation time", "Collection follow-up", "Expense classification", "Period-end reporting effort"],
    status: "Reference program open",
  },
];

export const inspectableProof = [
  { title: "Interactive product tour", description: "Inspect how sales, inventory, finance and reporting workflows connect before creating an account.", href: "/product-tour", action: "Open product tour" },
  { title: "Transparent ETB pricing", description: "Review published launch pricing, included users, branch capacity and optional implementation costs.", href: "/pricing", action: "Compare pricing" },
  { title: "Public Trust Center", description: "Review implemented security controls, configuration-dependent safeguards and shared responsibilities.", href: "/trust", action: "Review trust controls" },
];
