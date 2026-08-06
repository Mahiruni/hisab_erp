"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../config";
import { getCurrentUserContext } from "../data/context";
import { isOperationalModuleSlug, operationalModuleDefinitions } from "../operational-modules";
import { createClient } from "../supabase/server";

function required(value: FormDataEntryValue | null, label: string, max = 180) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(`${label} is required.`);
  if (text.length > max) throw new Error(`${label} is too long.`);
  return text;
}

function optional(value: FormDataEntryValue | null, max = 500) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > max) throw new Error("A text value is too long.");
  return text || null;
}

function numberValue(value: FormDataEntryValue | null) {
  const amount = Number(typeof value === "string" && value.trim() ? value : 0);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Amount must be zero or greater.");
  return Math.round(amount * 100) / 100;
}

function successRedirect(moduleSlug: string, params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams({ tab: "records" });
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && String(value).length) search.set(key, String(value));
  }
  redirect(`/modules/${moduleSlug}?${search.toString()}`);
}

export async function createOperationalRecord(formData: FormData) {
  if (!isSupabaseConfigured()) throw new Error("This action is disabled in demo mode. Configure Supabase first.");
  const moduleSlug = required(formData.get("moduleSlug"), "Module", 80);
  if (!isOperationalModuleSlug(moduleSlug)) throw new Error("Unsupported operational module.");

  const definition = operationalModuleDefinitions[moduleSlug];
  const recordType = required(formData.get("recordType"), "Record type", 80);
  const status = required(formData.get("status"), "Status", 40);
  const priority = required(formData.get("priority"), "Priority", 20);
  if (!definition.recordTypes.includes(recordType)) throw new Error("Invalid record type.");
  if (!definition.statuses.includes(status)) throw new Error("Invalid status.");
  if (!["low", "normal", "high", "critical"].includes(priority)) throw new Error("Invalid priority.");

  const context = await getCurrentUserContext({ required: true });
  const amount = numberValue(formData.get("amount"));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_operational_record", {
    p_organization_id: context!.organizationId,
    p_branch_id: context!.branchId,
    p_module_slug: moduleSlug,
    p_record_type: recordType,
    p_title: required(formData.get("title"), "Title"),
    p_description: optional(formData.get("description"), 1000),
    p_counterparty: optional(formData.get("counterparty"), 180),
    p_owner_name: optional(formData.get("ownerName"), 160),
    p_status: status,
    p_priority: priority,
    p_amount: amount,
    p_due_date: optional(formData.get("dueDate"), 20),
    p_metadata: { entryLanguage: optional(formData.get("entryLanguage"), 8) ?? "en", source: "hisab-web" },
    p_actor_id: context!.userId,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/modules/${moduleSlug}`);
  successRedirect(moduleSlug, {
    successCode: amount > 0 ? "moneyRecorded" : "recordCreated",
    record: String(data),
    amount,
  });
}

export async function updateOperationalRecordStatus(formData: FormData) {
  if (!isSupabaseConfigured()) throw new Error("This action is disabled in demo mode. Configure Supabase first.");
  const moduleSlug = required(formData.get("moduleSlug"), "Module", 80);
  if (!isOperationalModuleSlug(moduleSlug)) throw new Error("Unsupported operational module.");
  const status = required(formData.get("status"), "Status", 40);
  if (!operationalModuleDefinitions[moduleSlug].statuses.includes(status)) throw new Error("Invalid status.");

  const context = await getCurrentUserContext({ required: true });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_operational_record_status", {
    p_organization_id: context!.organizationId,
    p_record_id: required(formData.get("recordId"), "Record", 80),
    p_status: status,
    p_update_note: optional(formData.get("updateNote"), 500),
    p_actor_id: context!.userId,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/modules/${moduleSlug}`);
  successRedirect(moduleSlug, { successCode: "recordUpdated", record: String(data), status });
}
