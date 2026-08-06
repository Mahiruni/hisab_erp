export type MarketingIndustry = {
  slug: string;
  number: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  summary: string;
  challenge: string;
  outcome: string;
  capabilities: string[];
  workflow: Array<{ title: string; text: string }>;
  metrics: Array<{ label: string; value: string; detail: string }>;
  teams: string[];
  modules: string[];
};

export const marketingIndustries: MarketingIndustry[] = [
  {
    slug: "retail",
    number: "01",
    title: "ERP for retail businesses",
    shortTitle: "Retail",
    eyebrow: "Fast-moving daily operations",
    summary: "Connect sales, cash, inventory, customer balances and daily performance in one workspace built for busy retail teams.",
    challenge: "Retail owners often discover stock shortages, cash differences and declining product performance after the problem has already affected the business.",
    outcome: "HisabERP gives owners and store teams a live view of sales, stock movement, cash position and the products that need attention.",
    capabilities: ["Daily sales and receipt records", "Low-stock and reorder visibility", "Cashier and manager access controls", "Customer credit tracking", "Product and category performance", "Branch-level operational summaries"],
    workflow: [
      { title: "Record the sale", text: "Capture each sale, payment method, customer and product movement as the transaction happens." },
      { title: "Update stock automatically", text: "Keep quantities and product availability aligned with recorded sales and returns." },
      { title: "Review the day", text: "Compare revenue, cash, outstanding balances and stock risks before closing." },
    ],
    metrics: [{ label: "Daily revenue", value: "ETB 84,600", detail: "Across recorded sales" }, { label: "Low-stock items", value: "9", detail: "Need reorder attention" }, { label: "Open customer credit", value: "ETB 38,200", detail: "Across 14 accounts" }],
    teams: ["Retail owners", "Store managers", "Cashiers", "Inventory teams"],
    modules: ["sales-invoicing", "inventory", "customers-suppliers", "reports-analytics"],
  },
  {
    slug: "wholesale-distribution",
    number: "02",
    title: "ERP for wholesale and distribution",
    shortTitle: "Wholesale & distribution",
    eyebrow: "Control stock, credit and fulfillment",
    summary: "Coordinate customer orders, inventory, supplier purchases, receivables and distribution performance without disconnected spreadsheets.",
    challenge: "Wholesale teams manage high transaction values, many products, customer credit and supplier obligations—often across several people and locations.",
    outcome: "HisabERP connects orders, stock, customer balances, purchasing and management reporting so teams can fulfil demand with better control.",
    capabilities: ["Customer order and invoice tracking", "Receivables and credit follow-up", "Warehouse stock visibility", "Purchasing and supplier obligations", "Fast-moving product analysis", "Multi-branch performance review"],
    workflow: [
      { title: "Receive the order", text: "Create the customer transaction with products, quantities, prices and payment terms." },
      { title: "Confirm availability", text: "Review stock position and identify shortages before committing delivery." },
      { title: "Collect and replenish", text: "Follow customer balances while purchasing teams restore required inventory." },
    ],
    metrics: [{ label: "Orders this month", value: "286", detail: "Across customer accounts" }, { label: "Receivables", value: "ETB 1.24M", detail: "With aging visibility" }, { label: "Stock coverage", value: "32 days", detail: "Based on movement" }],
    teams: ["Owners", "Sales teams", "Warehouse teams", "Finance teams"],
    modules: ["sales-invoicing", "inventory", "expenses-purchasing", "finance-cashflow"],
  },
  {
    slug: "restaurants-hospitality",
    number: "03",
    title: "ERP for restaurants and hospitality",
    shortTitle: "Restaurants & hospitality",
    eyebrow: "Understand sales, costs and stock",
    summary: "Bring daily revenue, ingredient purchasing, expenses, suppliers, cash and management reporting into one clear operating picture.",
    challenge: "Hospitality businesses can generate strong sales while losing margin through uncontrolled purchasing, stock waste, cash differences and incomplete expense records.",
    outcome: "HisabERP helps management compare revenue with operating costs, supplier obligations, stock movement and cash position every day.",
    capabilities: ["Daily revenue and payment summaries", "Ingredient and consumable stock", "Supplier purchasing records", "Operating expense control", "Cash and digital payment review", "Location-level profitability"],
    workflow: [
      { title: "Capture daily activity", text: "Record revenue, payment channels and operational expenses for each day or shift." },
      { title: "Control replenishment", text: "Track purchases, supplier balances and essential stock levels." },
      { title: "Protect margin", text: "Review revenue, costs, cash and exceptions before they become monthly surprises." },
    ],
    metrics: [{ label: "Today’s revenue", value: "ETB 126,400", detail: "Across service periods" }, { label: "Operating costs", value: "31.2%", detail: "Of recorded revenue" }, { label: "Supplier bills due", value: "6", detail: "This week" }],
    teams: ["Restaurant owners", "General managers", "Cashiers", "Purchasing teams"],
    modules: ["sales-invoicing", "expenses-purchasing", "inventory", "reports-analytics"],
  },
  {
    slug: "professional-services",
    number: "04",
    title: "ERP for service companies",
    shortTitle: "Professional services",
    eyebrow: "Track work, billing and collections",
    summary: "Manage clients, service revenue, expenses, invoices, collections and project-level visibility from one secure workspace.",
    challenge: "Service companies frequently deliver work before billing, invoice without consistent follow-up and struggle to connect project activity with cash collection.",
    outcome: "HisabERP keeps client records, invoices, expenses, receivables and performance connected so owners know what was delivered, billed and collected.",
    capabilities: ["Client and service records", "Invoice and collection tracking", "Recurring operating expenses", "Project or engagement visibility", "Receivables aging", "Revenue and margin summaries"],
    workflow: [
      { title: "Create the client record", text: "Maintain the organization, contacts, service terms and outstanding position." },
      { title: "Invoice completed work", text: "Create a clear billing record and track partial or full collection." },
      { title: "Review profitability", text: "Compare service revenue, expenses and unpaid balances by period." },
    ],
    metrics: [{ label: "Billed this month", value: "ETB 642,000", detail: "Across client work" }, { label: "Collected", value: "78%", detail: "Of issued invoices" }, { label: "Overdue invoices", value: "7", detail: "Need follow-up" }],
    teams: ["Consultancies", "Agencies", "Professional firms", "Service operators"],
    modules: ["customers-suppliers", "sales-invoicing", "finance-cashflow", "reports-analytics"],
  },
  {
    slug: "construction",
    number: "05",
    title: "ERP for construction companies",
    shortTitle: "Construction",
    eyebrow: "Control project cash and procurement",
    summary: "Track project spending, supplier obligations, materials, customer billing and financial performance across active construction work.",
    challenge: "Construction businesses must coordinate purchases, materials, subcontractor costs, staged billing and cash requirements across multiple projects.",
    outcome: "HisabERP creates a structured record of purchasing, expenses, supplier balances, billing and project-level management indicators.",
    capabilities: ["Project-linked expenses", "Materials and inventory control", "Supplier and subcontractor balances", "Progress billing records", "Cash requirement visibility", "Project performance summaries"],
    workflow: [
      { title: "Set the project context", text: "Organize the customer, budget, responsible team and expected billing stages." },
      { title: "Record costs and materials", text: "Connect purchasing, expenses and inventory movement to the work being delivered." },
      { title: "Review project position", text: "Compare billing, collection, cost and obligations before approving the next stage." },
    ],
    metrics: [{ label: "Active projects", value: "8", detail: "Under management" }, { label: "Committed costs", value: "ETB 3.8M", detail: "Purchases and obligations" }, { label: "Unbilled work", value: "ETB 920K", detail: "Awaiting billing stage" }],
    teams: ["Contractors", "Project managers", "Procurement teams", "Finance teams"],
    modules: ["expenses-purchasing", "inventory", "finance-cashflow", "reports-analytics"],
  },
  {
    slug: "manufacturing",
    number: "06",
    title: "ERP for manufacturing businesses",
    shortTitle: "Manufacturing",
    eyebrow: "Connect materials, purchasing and output",
    summary: "Coordinate raw materials, supplier purchases, stock movement, operating expenses, sales and management reporting in one system.",
    challenge: "Manufacturers need dependable visibility across raw materials, work requirements, finished goods, purchasing, sales and cash commitments.",
    outcome: "HisabERP helps teams understand material availability, purchasing obligations, stock movement and the financial impact of operational activity.",
    capabilities: ["Raw-material stock visibility", "Supplier purchasing and balances", "Finished-goods inventory", "Operating expense control", "Sales and customer demand", "Production-oriented reporting"],
    workflow: [
      { title: "Plan material requirements", text: "Review available quantities and purchasing needs before production activity begins." },
      { title: "Record movement and cost", text: "Maintain structured purchasing, inventory and operating expense records." },
      { title: "Connect output to revenue", text: "Review finished goods, sales, customer balances and cash impact together." },
    ],
    metrics: [{ label: "Raw material coverage", value: "18 days", detail: "At current movement" }, { label: "Finished goods", value: "ETB 2.1M", detail: "Recorded stock value" }, { label: "Purchase obligations", value: "ETB 740K", detail: "Open supplier balances" }],
    teams: ["Manufacturers", "Production managers", "Warehouse teams", "Finance teams"],
    modules: ["inventory", "expenses-purchasing", "sales-invoicing", "finance-cashflow"],
  },
  {
    slug: "cooperatives",
    number: "07",
    title: "ERP for cooperatives",
    shortTitle: "Cooperatives",
    eyebrow: "Create accountable shared operations",
    summary: "Maintain structured sales, purchases, member-facing balances, inventory and reporting with role-controlled access and traceable records.",
    challenge: "Cooperatives need transparent records and clear responsibility across teams while managing shared assets, purchasing, sales and member-related balances.",
    outcome: "HisabERP provides one controlled operational record that authorized teams can use for daily work and management reporting.",
    capabilities: ["Role-controlled team access", "Sales and purchase records", "Inventory and shared assets", "Customer, supplier and member balances", "Audit-ready activity history", "Periodic management reporting"],
    workflow: [
      { title: "Define responsibility", text: "Assign access according to operational and approval responsibilities." },
      { title: "Record shared activity", text: "Capture sales, purchases, expenses, inventory and balances in one workspace." },
      { title: "Report with confidence", text: "Prepare management and stakeholder summaries from structured records." },
    ],
    metrics: [{ label: "Recorded transactions", value: "1,842", detail: "This operating period" }, { label: "Open balances", value: "ETB 486K", detail: "Customers and suppliers" }, { label: "Authorized users", value: "14", detail: "Across defined roles" }],
    teams: ["Cooperative leaders", "Accountants", "Store teams", "Operational committees"],
    modules: ["customers-suppliers", "inventory", "finance-cashflow", "reports-analytics"],
  },
  {
    slug: "import-export",
    number: "08",
    title: "ERP for import and export businesses",
    shortTitle: "Import & export",
    eyebrow: "Manage high-value trade operations",
    summary: "Track suppliers, customers, purchasing, landed operational costs, inventory, receivables, payables and cash requirements across trade activity.",
    challenge: "Import and export companies coordinate high-value purchases, long lead times, supplier obligations, inventory availability, customer credit and significant cash commitments.",
    outcome: "HisabERP brings purchasing, supplier balances, stock, sales, receivables and cash visibility into one management view.",
    capabilities: ["Supplier and purchase tracking", "Inventory availability", "Customer orders and receivables", "Operational cost records", "Payables and cash planning", "Trade performance reporting"],
    workflow: [
      { title: "Record the purchase cycle", text: "Track supplier, products, quantities, costs, payments and outstanding obligations." },
      { title: "Receive and control stock", text: "Update availability and monitor the products committed to customers." },
      { title: "Manage collection and cash", text: "Review receivables, payables and upcoming requirements before making commitments." },
    ],
    metrics: [{ label: "Inventory available", value: "ETB 6.4M", detail: "Across active products" }, { label: "Supplier obligations", value: "ETB 2.7M", detail: "Open payable position" }, { label: "Customer receivables", value: "ETB 1.9M", detail: "With aging detail" }],
    teams: ["Importers", "Exporters", "Trade managers", "Finance and logistics teams"],
    modules: ["expenses-purchasing", "inventory", "customers-suppliers", "bank-reconciliation"],
  },
  {
    slug: "multi-branch",
    number: "09",
    title: "ERP for multi-branch businesses",
    shortTitle: "Multi-branch businesses",
    eyebrow: "One business view across locations",
    summary: "Give each location the workspace it needs while owners and management review consolidated activity, balances and performance.",
    challenge: "As a business adds locations, separate spreadsheets and informal reporting make it difficult to compare branches or understand the total financial position.",
    outcome: "HisabERP structures branch activity and management reporting so leaders can review location performance and consolidated business indicators.",
    capabilities: ["Branch-aware transaction records", "Location-level sales and expenses", "Inventory visibility by location", "Team access by responsibility", "Consolidated management summaries", "Cross-branch comparison"],
    workflow: [
      { title: "Configure each location", text: "Define branch responsibilities, users and operating context." },
      { title: "Run locally", text: "Allow teams to record daily operational activity for their location." },
      { title: "Manage centrally", text: "Compare branches and review the consolidated business position." },
    ],
    metrics: [{ label: "Active branches", value: "5", detail: "In one organization" }, { label: "Top branch growth", value: "+18.6%", detail: "Versus prior period" }, { label: "Consolidated revenue", value: "ETB 4.2M", detail: "Current month" }],
    teams: ["Business owners", "Branch managers", "Finance leaders", "Operations teams"],
    modules: ["sales-invoicing", "inventory", "finance-cashflow", "reports-analytics"],
  },
];

export function getMarketingIndustry(slug: string) {
  return marketingIndustries.find((industry) => industry.slug === slug);
}
