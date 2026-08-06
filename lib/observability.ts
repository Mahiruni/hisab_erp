type ErrorContext = { area: string; organizationId?: string; userId?: string; metadata?: Record<string, unknown> };

export async function reportError(error: unknown, context: ErrorContext) {
  const event = {
    level: "error",
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  };
  console.error(JSON.stringify(event));
  const endpoint = process.env.MONITORING_WEBHOOK_URL;
  if (!endpoint) return;
  try { await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event), cache: "no-store" }); } catch { /* Monitoring failures must never break ERP workflows. */ }
}
