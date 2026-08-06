import { unstable_noStore as noStore } from "next/cache";
import { isSupabaseConfigured } from "../config";
import { isOperationalModuleSlug, operationalModuleDefinitions, type OperationalModuleSlug } from "../operational-modules";
import { createClient } from "../supabase/server";
import { getCurrentUserContext } from "./context";
import type { OperationalSnapshot } from "./operational-types";
import type { UserContext } from "./types";

function demoSnapshot(moduleSlug: OperationalModuleSlug): OperationalSnapshot {
  const definition = operationalModuleDefinitions[moduleSlug];
  const now = new Date();
  const due = new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);
  const record = {
    id: `demo-${moduleSlug}`,
    number: `${moduleSlug.slice(0, 3).toUpperCase()}-2026-000001`,
    type: definition.recordTypes[0],
    title: "Example operational record",
    description: "This sample demonstrates the live workflow. Configure Supabase to create organization data.",
    counterparty: "Demo business partner",
    owner: "Operations team",
    status: definition.statuses[Math.min(1, definition.statuses.length - 1)],
    priority: "normal" as const,
    amount: definition.phase === 3 ? 0 : 25_000,
    dueDate: due,
    metadata: { demo: true },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  return {
    mode: "demo",
    moduleSlug,
    organizationName: "Hisab Trading Enterprise",
    metrics: { total: 1, active: 1, completed: 0, atRisk: 0, value: record.amount },
    records: [record],
    activity: [{ id: `activity-${moduleSlug}`, recordId: record.id, recordNumber: record.number, eventType: "created", previousStatus: null, newStatus: record.status, message: `Created ${record.number} · ${record.title}`, createdAt: now.toISOString() }],
  };
}

export async function getOperationalModuleSnapshot(moduleSlug: string): Promise<OperationalSnapshot> {
  noStore();
  if (!isOperationalModuleSlug(moduleSlug)) throw new Error("Unsupported operational module.");
  if (!isSupabaseConfigured()) return demoSnapshot(moduleSlug);

  const context = await getCurrentUserContext({ required: true });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_operational_module_snapshot", { target_organization_id: context!.organizationId, target_module_slug: moduleSlug });
  if (error || !data) throw new Error(`Unable to load ${moduleSlug}: ${error?.message ?? "Unknown error"}`);

  const snapshot = data as Omit<OperationalSnapshot, "mode" | "moduleSlug" | "organizationName">;
  return { ...snapshot, mode: "live", moduleSlug, organizationName: context!.organizationName };
}

export function canManageOperationalModule(role: UserContext["role"], moduleSlug: OperationalModuleSlug) {
  if (role === "owner" || role === "admin") return true;
  if (["purchasing-expenses", "reports-analytics", "localization-compliance", "fixed-assets", "budgeting-projects"].includes(moduleSlug)) return role === "accountant" || role === "manager";
  if (moduleSlug === "inventory-warehouse") return role === "inventory" || role === "manager";
  if (moduleSlug === "customers-suppliers") return role === "accountant" || role === "sales" || role === "manager";
  if (moduleSlug === "human-resources-payroll") return role === "accountant" || role === "manager";
  return false;
}