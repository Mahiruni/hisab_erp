import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "../../../../lib/data/context";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  let text = typeof value === "string" ? value : value == null ? "" : JSON.stringify(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const context = await getCurrentUserContext();
  if (!context) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!context.mfaRequired || context.aal !== "aal2") return NextResponse.json({ error: "Administrator MFA verification required" }, { status: 403 });

  const requestedDays = Number(request.nextUrl.searchParams.get("days") || 90);
  const days = Math.min(Math.max(Number.isFinite(requestedDays) ? Math.round(requestedDays) : 90, 1), 365);
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const supabase = await createClient();
  const settings = await supabase.from("production_control_settings").select("audit_export_enabled").eq("organization_id", context.organizationId).single();
  if (settings.error || !settings.data?.audit_export_enabled) return NextResponse.json({ error: "Audit export is disabled" }, { status: 403 });

  const [business, authentication, alerts] = await Promise.all([
    supabase.from("audit_events").select("id,actor_id,action,entity_type,entity_id,metadata,created_at").eq("organization_id", context.organizationId).gte("created_at", since).order("created_at"),
    supabase.from("auth_audit_events").select("id,user_id,event_type,severity,ip_address,user_agent,metadata,occurred_at").eq("organization_id", context.organizationId).gte("occurred_at", since).order("occurred_at"),
    supabase.from("security_alerts").select("id,category,severity,title,description,status,metadata,created_at").eq("organization_id", context.organizationId).gte("created_at", since).order("created_at"),
  ]);
  const firstError = [business, authentication, alerts].find((result) => result.error)?.error;
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

  const rows: unknown[][] = [["stream", "id", "occurred_at", "actor", "event", "entity_or_severity", "details"]];
  for (const event of business.data || []) rows.push(["business", event.id, event.created_at, event.actor_id, event.action, `${event.entity_type}:${event.entity_id || ""}`, event.metadata]);
  for (const event of authentication.data || []) rows.push(["authentication", event.id, event.occurred_at, event.user_id, event.event_type, event.severity, { ip: event.ip_address, userAgent: event.user_agent, ...event.metadata }]);
  for (const event of alerts.data || []) rows.push(["security_alert", event.id, event.created_at, "", event.title, `${event.severity}:${event.status}`, { category: event.category, description: event.description, ...event.metadata }]);
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

  await supabase.rpc("record_auth_audit", {
    p_event_type: "auth.audit.exported",
    p_organization_id: context.organizationId,
    p_severity: "warning",
    p_metadata: { days, rows: rows.length - 1 },
  });

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hisab-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
