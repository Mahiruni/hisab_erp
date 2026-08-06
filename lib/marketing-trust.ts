export type TrustControlStatus = "implemented" | "configuration" | "operational" | "upgrade";

export type TrustControl = {
  number: string;
  title: string;
  status: TrustControlStatus;
  statusLabel: string;
  description: string;
  evidence: string;
};

export const trustControls: TrustControl[] = [
  {
    number: "01",
    title: "Privileged administrator MFA",
    status: "implemented",
    statusLabel: "Implemented",
    description: "Owner and administrator mutations require an AAL2 authenticator session before sensitive financial, inventory, payroll, user or security changes are accepted.",
    evidence: "Enforced in the application session and PostgreSQL control path.",
  },
  {
    number: "02",
    title: "Organization and role boundaries",
    status: "implemented",
    statusLabel: "Implemented",
    description: "Workspace access is scoped by organization and role so operational users do not automatically receive administrator-level control.",
    evidence: "Production health checks include detection of public tables that are missing row-level security.",
  },
  {
    number: "03",
    title: "Business and authentication audit trails",
    status: "implemented",
    statusLabel: "Implemented",
    description: "Material financial actions, authentication activity and security alerts can be recorded as organization-scoped audit events.",
    evidence: "MFA-verified administrators can export enabled audit streams as spreadsheet-safe CSV evidence.",
  },
  {
    number: "04",
    title: "Browser and application security headers",
    status: "implemented",
    statusLabel: "Implemented",
    description: "Responses apply a restrictive content security policy, frame protection, MIME-type protection, referrer controls and permissions restrictions.",
    evidence: "Security headers are applied centrally by the Next.js request proxy.",
  },
  {
    number: "05",
    title: "Sensitive-route rate limiting",
    status: "operational",
    statusLabel: "Baseline control",
    description: "Authentication and API routes use fixed-window request limits as a baseline against repeated automated requests.",
    evidence: "The current in-memory limiter is a fallback and should be replaced with a shared regional limiter as deployment scale increases.",
  },
  {
    number: "06",
    title: "Leaked-password screening",
    status: "implemented",
    statusLabel: "Implemented",
    description: "New and reset passwords are screened for predictable patterns and checked through a privacy-preserving breach-prefix lookup.",
    evidence: "Only a short hash prefix is sent to the breach lookup service; the password itself is not transmitted.",
  },
  {
    number: "07",
    title: "Backup and restore evidence",
    status: "operational",
    statusLabel: "Operational process",
    description: "Administrators can record encrypted backup evidence, checksums, storage references and isolated restore-test results.",
    evidence: "Readiness depends on the organization keeping backup evidence current and performing periodic restore tests.",
  },
  {
    number: "08",
    title: "Error-monitoring webhook",
    status: "configuration",
    statusLabel: "Configuration-ready",
    description: "Structured server errors can be logged by the hosting platform and forwarded to an external monitoring endpoint.",
    evidence: "External forwarding requires the monitoring webhook environment variable to be configured.",
  },
  {
    number: "09",
    title: "Point-in-time recovery",
    status: "upgrade",
    statusLabel: "Platform upgrade required",
    description: "Point-in-time recovery is intentionally not presented as active until the connected database plan confirms the capability.",
    evidence: "The production controls page keeps this state visible rather than marking an unavailable safeguard as ready.",
  },
];

export const sharedResponsibility = {
  hisab: [
    "Maintain application access controls and secure-by-default product behavior.",
    "Apply security headers and protect sensitive authentication and API routes.",
    "Provide administrator MFA, audit evidence, alerts and production-control workflows.",
    "Communicate configuration requirements and avoid presenting planned controls as active.",
  ],
  customer: [
    "Assign the minimum required role to each user and remove access when responsibilities change.",
    "Require administrators to complete MFA and protect recovery methods.",
    "Review alerts, audit activity, backup evidence and restore-test status regularly.",
    "Protect exported data, devices, passwords and third-party integration credentials.",
  ],
};
