export type HelpCategory = {
  slug: string;
  title: string;
  summary: string;
};

export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  audience: string;
  tags: string[];
  prerequisites: string[];
  steps: Array<{ title: string; text: string }>;
  notes: string[];
  related: string[];
};

export const helpCategories: HelpCategory[] = [
  { slug: "getting-started", title: "Getting started", summary: "Create the organization, complete company setup and prepare the first users." },
  { slug: "sales-invoicing", title: "Sales and invoicing", summary: "Create customers, issue invoices, record payments and review receivables." },
  { slug: "inventory", title: "Inventory", summary: "Set up products, opening quantities, stock movements and reorder controls." },
  { slug: "finance", title: "Finance and reporting", summary: "Record expenses, review cash flow, reconcile payments and understand reports." },
  { slug: "security", title: "Users and security", summary: "Invite users, assign responsibilities and protect administrator actions with MFA." },
  { slug: "data-migration", title: "Data migration", summary: "Prepare clean import files, opening balances and a controlled cutover." },
];

export const helpArticles: HelpArticle[] = [
  {
    slug: "create-your-organization",
    category: "getting-started",
    title: "Create and configure your organization",
    summary: "Set the organization identity, business context and initial workspace foundation before entering transactions.",
    readTime: "6 min",
    audience: "Owners and administrators",
    tags: ["organization", "company setup", "onboarding", "business profile"],
    prerequisites: ["A verified HisabTech account", "The legal or operating business name", "A designated organization owner"],
    steps: [
      { title: "Create the workspace", text: "Sign in and complete the organization creation flow. Use the business name your team recognizes and can distinguish from other organizations." },
      { title: "Review business details", text: "Confirm the operating location, contact information and any fiscal details requested by the setup flow. Do not enter placeholder values that will later appear in business records." },
      { title: "Choose the starting modules", text: "Prioritize the modules required for the first operating phase. A focused launch is usually easier to validate than enabling every workflow at once." },
      { title: "Set the first responsibilities", text: "Identify who will administer users, maintain products, create sales, record expenses and review reports." },
      { title: "Complete readiness checks", text: "Use the setup and production-control areas to review missing configuration before the organization begins live transactions." },
    ],
    notes: ["Organization owners and administrators can access sensitive setup and security functions.", "Use real business data only after the team has agreed on the cutover date and validation process."],
    related: ["invite-users-and-assign-access", "prepare-data-for-import", "enable-administrator-mfa"],
  },
  {
    slug: "invite-users-and-assign-access",
    category: "security",
    title: "Invite users and assign appropriate access",
    summary: "Give each person the access required for their role without sharing accounts or exposing unnecessary financial information.",
    readTime: "7 min",
    audience: "Owners and administrators",
    tags: ["users", "roles", "permissions", "access", "staff"],
    prerequisites: ["An active organization", "Owner or administrator access", "A list of staff responsibilities"],
    steps: [
      { title: "List business responsibilities", text: "Document who creates sales, manages inventory, records purchases, reviews finance and administers security before assigning access." },
      { title: "Invite individual users", text: "Use a unique email or supported sign-in identity for each person. Shared accounts weaken accountability and should be avoided." },
      { title: "Assign the minimum required role", text: "Start with the least privilege needed for daily work. Add broader access only when the responsibility is confirmed." },
      { title: "Test the user experience", text: "Ask the user to sign in and confirm that required pages are available while sensitive pages remain restricted." },
      { title: "Review access regularly", text: "Remove access promptly when staff leave or responsibilities change. Keep owner and administrator assignments limited." },
    ],
    notes: ["Administrator actions may require an AAL2 authenticator session.", "Permissions protect application access, but teams must also protect their email accounts and devices."],
    related: ["enable-administrator-mfa", "create-your-organization", "understand-audit-and-security-controls"],
  },
  {
    slug: "enable-administrator-mfa",
    category: "security",
    title: "Enable authenticator MFA for administrators",
    summary: "Protect privileged actions with a second authentication factor and verify the administrator session before sensitive changes.",
    readTime: "5 min",
    audience: "Owners and administrators",
    tags: ["mfa", "security", "authenticator", "aal2", "administrator"],
    prerequisites: ["An owner or administrator account", "Access to a compatible authenticator application", "A secure device"],
    steps: [
      { title: "Open account security", text: "Sign in and open the account or production-control area where MFA setup is presented." },
      { title: "Register the authenticator", text: "Scan the setup code using the authenticator application and store any recovery information securely." },
      { title: "Verify a current code", text: "Enter the time-based verification code to complete enrollment and raise the session assurance level." },
      { title: "Test privileged access", text: "Open a protected administrative workflow and confirm that the application recognizes the verified session." },
      { title: "Document recovery ownership", text: "Define who can assist when an administrator loses access. Do not store recovery information in a shared public document." },
    ],
    notes: ["HisabERP requires stronger authentication for protected administrative mutations.", "MFA cannot protect a session if the user approves a fraudulent prompt or exposes recovery material."],
    related: ["invite-users-and-assign-access", "understand-audit-and-security-controls"],
  },
  {
    slug: "create-your-first-customer-and-invoice",
    category: "sales-invoicing",
    title: "Create a customer and issue the first invoice",
    summary: "Set up a customer record, create an invoice and review the resulting receivable in a controlled workflow.",
    readTime: "8 min",
    audience: "Sales, finance and administrators",
    tags: ["customer", "invoice", "sales", "receivable", "first transaction"],
    prerequisites: ["An active organization", "Sales access", "Customer identity and contact details", "Products or services configured"],
    steps: [
      { title: "Create the customer", text: "Add the customer using a consistent legal or trading name. Include a reliable contact method and tax identifier when applicable." },
      { title: "Confirm products or services", text: "Review descriptions, units and prices before creating the invoice. Correct master data prevents repeated invoice corrections." },
      { title: "Create the invoice", text: "Select the customer, add the relevant lines, confirm quantities and prices, then review the total before posting or finalizing." },
      { title: "Verify the balance", text: "Open the sales or finance view and confirm that the invoice appears in the customer balance and receivables position." },
      { title: "Share through the approved channel", text: "Provide the invoice using the organization’s approved delivery process and preserve any required supporting documentation." },
    ],
    notes: ["Invoice numbering, tax treatment and statutory requirements must be validated for the organization’s real operating context.", "Use a test or pilot record first when configuration is not yet approved."],
    related: ["record-a-customer-payment", "read-receivables-and-cashflow", "add-products-and-opening-stock"],
  },
  {
    slug: "record-a-customer-payment",
    category: "sales-invoicing",
    title: "Record and match a customer payment",
    summary: "Capture a received payment, reference the correct customer or invoice and verify the updated outstanding balance.",
    readTime: "6 min",
    audience: "Cashiers, sales and finance",
    tags: ["payment", "customer", "invoice", "cash", "reconciliation"],
    prerequisites: ["A recorded customer or invoice", "Payment evidence", "The correct amount and transaction reference"],
    steps: [
      { title: "Confirm the payment evidence", text: "Check the payer, amount, date, channel and external transaction reference before recording the receipt." },
      { title: "Select the customer or invoice", text: "Match the payment to the correct account. Avoid applying an unidentified payment only because the amount looks similar." },
      { title: "Record the payment", text: "Enter the amount and supported payment details, then save the transaction according to the user’s permissions." },
      { title: "Review the remaining balance", text: "Confirm that the invoice or customer balance changed by the expected amount and that no duplicate receipt was created." },
      { title: "Escalate exceptions", text: "Leave unmatched or disputed payments for finance review rather than forcing them into an incorrect account." },
    ],
    notes: ["Provider callback support still requires provider credentials and production verification before it should be treated as automatic reconciliation.", "Keep external payment evidence for dispute and audit purposes."],
    related: ["create-your-first-customer-and-invoice", "reconcile-bank-and-mobile-payments", "read-receivables-and-cashflow"],
  },
  {
    slug: "add-products-and-opening-stock",
    category: "inventory",
    title: "Add products and establish opening stock",
    summary: "Create clean product records and set a controlled opening quantity before live stock movements begin.",
    readTime: "8 min",
    audience: "Inventory managers and administrators",
    tags: ["products", "inventory", "opening stock", "sku", "warehouse"],
    prerequisites: ["A product list", "Consistent units and SKUs", "A verified physical count or approved opening balance"],
    steps: [
      { title: "Clean the product list", text: "Remove duplicates, standardize names, confirm units and assign unique SKUs or internal codes." },
      { title: "Define stock locations", text: "Confirm the branch or warehouse structure before quantities are loaded so stock is not assigned to the wrong location." },
      { title: "Create product records", text: "Add the product identity, description, unit, selling information and any reorder threshold used by the team." },
      { title: "Load opening quantities", text: "Use a dated, approved physical count. Keep the source count sheet and reviewer evidence." },
      { title: "Validate total stock value and quantity", text: "Compare imported or entered totals with the approved opening statement before live sales and purchases begin." },
    ],
    notes: ["Do not combine duplicate products merely because their names look similar; confirm unit, SKU and tax treatment.", "Opening stock should have a documented cutover date."],
    related: ["perform-and-review-a-stock-count", "prepare-data-for-import", "create-your-first-customer-and-invoice"],
  },
  {
    slug: "perform-and-review-a-stock-count",
    category: "inventory",
    title: "Perform and review a stock count",
    summary: "Compare physical quantities with system quantities and investigate differences before posting adjustments.",
    readTime: "7 min",
    audience: "Inventory managers and reviewers",
    tags: ["stock count", "inventory adjustment", "warehouse", "variance"],
    prerequisites: ["Products and locations configured", "A count date", "Independent count and review responsibilities"],
    steps: [
      { title: "Freeze or control movement", text: "Choose a count window and prevent unrecorded sales, purchases or transfers from changing the physical position during the count." },
      { title: "Count independently", text: "Record physical quantities by product and location without copying the system balance into the count sheet." },
      { title: "Compare variances", text: "Identify missing, excess or unit-related differences and prioritize high-value or repeated exceptions." },
      { title: "Investigate before adjustment", text: "Review recent sales, purchases, transfers and prior counts before changing the system quantity." },
      { title: "Approve and document adjustments", text: "Post only reviewed differences and preserve the reason, approver and supporting evidence." },
    ],
    notes: ["A stock adjustment corrects the recorded balance but does not explain the operational cause.", "Repeated variances should lead to process changes, not only repeated adjustments."],
    related: ["add-products-and-opening-stock", "understand-audit-and-security-controls"],
  },
  {
    slug: "record-and-review-business-expenses",
    category: "finance",
    title: "Record and review business expenses",
    summary: "Capture expenses with consistent categories, evidence and approval context so reports remain meaningful.",
    readTime: "6 min",
    audience: "Finance, purchasing and administrators",
    tags: ["expense", "purchase", "supplier", "receipt", "finance"],
    prerequisites: ["Expense or purchasing access", "Supplier or payee details", "Receipt, invoice or approved evidence"],
    steps: [
      { title: "Verify the evidence", text: "Confirm the payee, date, business purpose, amount and payment channel before entry." },
      { title: "Choose a consistent category", text: "Use the organization’s approved expense classification so similar costs appear together in reporting." },
      { title: "Record supplier and payment context", text: "Link the expense to the correct supplier or obligation where applicable and include the reference used by finance." },
      { title: "Attach or retain supporting evidence", text: "Preserve the receipt, invoice or approval record according to the organization’s document process." },
      { title: "Review reporting impact", text: "Confirm the transaction appears in the expected expense, payable or cash-flow view." },
    ],
    notes: ["Business and personal expenses should remain clearly separated.", "Tax deductibility and statutory evidence requirements must be confirmed with the organization’s qualified adviser."],
    related: ["read-receivables-and-cashflow", "reconcile-bank-and-mobile-payments"],
  },
  {
    slug: "reconcile-bank-and-mobile-payments",
    category: "finance",
    title: "Reconcile bank and mobile-payment activity",
    summary: "Match external payment activity with HisabERP records and keep unresolved exceptions visible for review.",
    readTime: "9 min",
    audience: "Finance and administrators",
    tags: ["reconciliation", "bank", "telebirr", "mpesa", "payments"],
    prerequisites: ["Recorded business transactions", "A statement, export or configured provider source", "A reviewer for unmatched items"],
    steps: [
      { title: "Import or receive the external activity", text: "Use the supported source method. Provider callbacks require credentials, secure tokens and production verification before use." },
      { title: "Normalize references", text: "Confirm dates, amounts, payer references and transaction identifiers are captured consistently." },
      { title: "Match clear records", text: "Connect payments to the correct invoice, customer, supplier or cash movement when the evidence is sufficient." },
      { title: "Keep exceptions unmatched", text: "Do not force ambiguous activity into a convenient account. Assign it for investigation with the available evidence." },
      { title: "Complete reviewer sign-off", text: "Confirm matched totals, unresolved exceptions and closing balances before treating the period as reconciled." },
    ],
    notes: ["telebirr and M-PESA callback paths are not production-ready until provider configuration and end-to-end verification are complete.", "Reconciliation should be performed by someone who can investigate but not silently erase exceptions."],
    related: ["record-a-customer-payment", "record-and-review-business-expenses", "understand-audit-and-security-controls"],
  },
  {
    slug: "read-receivables-and-cashflow",
    category: "finance",
    title: "Read receivables, payables and cash-flow indicators",
    summary: "Use balances and attention lists to understand what is owed, what must be paid and where follow-up is required.",
    readTime: "7 min",
    audience: "Owners, managers and finance",
    tags: ["receivables", "payables", "cash flow", "reports", "dashboard"],
    prerequisites: ["Sales, payment and expense activity recorded", "A defined review period", "Consistent transaction dates"],
    steps: [
      { title: "Confirm the reporting period", text: "Review the date range and organization context before interpreting totals or comparing periods." },
      { title: "Review receivables", text: "Identify open customer balances, overdue accounts and high-concentration exposure requiring collection follow-up." },
      { title: "Review payables", text: "Identify supplier obligations, due dates and payments that may affect near-term cash." },
      { title: "Review cash position", text: "Compare recorded cash and payment activity with reconciled external sources. An unreconciled balance should not be treated as verified cash." },
      { title: "Assign actions", text: "Turn overdue balances, unmatched payments and unusual movements into named follow-up tasks." },
    ],
    notes: ["Reports are only as reliable as the underlying records and reconciliation process.", "Illustrative dashboard figures on the public website are not customer performance claims."],
    related: ["record-a-customer-payment", "record-and-review-business-expenses", "reconcile-bank-and-mobile-payments"],
  },
  {
    slug: "prepare-data-for-import",
    category: "data-migration",
    title: "Prepare customers, suppliers and products for import",
    summary: "Clean master data, use the published templates and validate duplicates before a migration dry run.",
    readTime: "10 min",
    audience: "Migration leads and administrators",
    tags: ["migration", "csv", "import", "customers", "products", "suppliers"],
    prerequisites: ["Export access to the current source", "An assigned data owner", "A cutover plan", "The HisabERP import templates"],
    steps: [
      { title: "Choose the migration scope", text: "Decide whether to move active master data, opening balances and selected history. Avoid migrating every old record without a business reason." },
      { title: "Export source data", text: "Create read-only source exports and preserve the original files before cleaning begins." },
      { title: "Map fields to the template", text: "Use the HisabERP column names and keep one row per unique customer, supplier or product." },
      { title: "Remove duplicates and invalid values", text: "Standardize names, phone formats, units, SKUs and identifiers. Record merge decisions for review." },
      { title: "Run a dry import", text: "Load the data into a non-production or controlled workspace, review error messages and compare counts and totals." },
      { title: "Approve the final file", text: "Freeze the approved version, record the reviewer and use the same file for the scheduled cutover." },
    ],
    notes: ["Never place passwords, secret keys or payment credentials in an import spreadsheet.", "The published CSV templates define a preparation format; final import support depends on the implementation scope."],
    related: ["create-your-organization", "add-products-and-opening-stock", "validate-opening-balances-and-cutover"],
  },
  {
    slug: "validate-opening-balances-and-cutover",
    category: "data-migration",
    title: "Validate opening balances and complete cutover",
    summary: "Reconcile the final source position, approve opening balances and control the transition into live HisabERP operations.",
    readTime: "9 min",
    audience: "Owners, finance and migration leads",
    tags: ["cutover", "opening balance", "migration", "validation", "go live"],
    prerequisites: ["Approved master data", "A cutover date", "Final source reports", "Named business reviewers"],
    steps: [
      { title: "Freeze the source period", text: "Choose a clear cutover timestamp and prevent untracked transactions from being entered after final exports are produced." },
      { title: "Capture approved balances", text: "Prepare customer, supplier, cash, stock and other required opening positions using signed-off source reports." },
      { title: "Load into the controlled workspace", text: "Import or enter the approved balances using the agreed method and preserve import logs or supporting evidence." },
      { title: "Reconcile counts and totals", text: "Compare record counts, outstanding balances, stock quantities and key control totals with the final source statements." },
      { title: "Approve go-live", text: "Require business owners for finance, sales and inventory to confirm their area before live transactions begin." },
      { title: "Monitor the first operating period", text: "Review exceptions daily and keep the old system read-only until the new process is stable and evidence is retained." },
    ],
    notes: ["A successful technical import is not the same as a reconciled business migration.", "Do not delete historical source evidence immediately after cutover."],
    related: ["prepare-data-for-import", "read-receivables-and-cashflow", "perform-and-review-a-stock-count"],
  },
  {
    slug: "understand-audit-and-security-controls",
    category: "security",
    title: "Understand audit evidence and production controls",
    summary: "Review what HisabERP records, which controls require configuration and which responsibilities remain with the customer.",
    readTime: "8 min",
    audience: "Owners, administrators and reviewers",
    tags: ["audit", "security", "backup", "monitoring", "controls"],
    prerequisites: ["Owner or administrator access for internal controls", "An understanding of the organization’s security responsibilities"],
    steps: [
      { title: "Review the public Trust Center", text: "Start with the published control status and limitations before making security or compliance assumptions." },
      { title: "Open production controls", text: "MFA-verified administrators can review security alerts, audit counts, health checks and continuity evidence inside the workspace." },
      { title: "Confirm configured services", text: "Verify monitoring endpoints, provider credentials and platform capabilities rather than assuming optional controls are active." },
      { title: "Record backup and restore evidence", text: "Document completed backups and isolated restore tests using the organization’s approved operational process." },
      { title: "Export and review audit evidence", text: "Use available audit exports for authorized review and preserve them securely outside public channels." },
    ],
    notes: ["HisabTech does not claim certifications or recovery capabilities that have not been independently verified.", "Customers remain responsible for user access, device security, data quality and lawful use."],
    related: ["enable-administrator-mfa", "invite-users-and-assign-access", "reconcile-bank-and-mobile-payments"],
  },
];

export function getHelpArticle(slug: string) {
  return helpArticles.find((article) => article.slug === slug);
}

export function getHelpCategory(slug: string) {
  return helpCategories.find((category) => category.slug === slug);
}
