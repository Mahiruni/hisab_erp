"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "../data/context";
import { createClient } from "../supabase/server";
import { positiveNumber, requiredText } from "../validation";

function fail(reason: unknown) {
  const message = reason instanceof Error ? reason.message : "The production control action failed.";
  redirect(`/security?error=${encodeURIComponent(message)}`);
}

function finish(message: string) {
  revalidatePath("/security");
  redirect(`/security?success=${encodeURIComponent(message)}`);
}

async function requireStrongAdmin() {
  const context = await getCurrentUserContext({ required: true });
  if (!context || !context.mfaRequired || context.aal !== "aal2") throw new Error("Verify administrator MFA before changing production controls.");
  return context;
}

export async function updateProductionControlsAction(formData: FormData) {
  try {
    const context = await requireStrongAdmin();
    const supabase = await createClient();
    const { error } = await supabase.rpc("update_production_controls", {
      p_organization_id: context.organizationId,
      p_login_alerts: formData.get("loginAlerts") === "on",
      p_financial_alerts: formData.get("financialAlerts") === "on",
      p_audit_export: formData.get("auditExport") === "on",
      p_backup_mode: requiredText(formData.get("backupMode"), "backup mode", 24),
      p_backup_retention_days: Math.round(positiveNumber(formData.get("retentionDays"), "retention days")),
    });
    if (error) throw new Error(error.message);
  } catch (reason) { fail(reason); }
  finish("Production control policy updated");
}

export async function runDatabaseHealthAction() {
  try {
    const context = await requireStrongAdmin();
    const supabase = await createClient();
    const { error } = await supabase.rpc("run_database_health_checks", { p_target_organization_id: context.organizationId });
    if (error) throw new Error(error.message);
  } catch (reason) { fail(reason); }
  finish("Database health check completed");
}

export async function acknowledgeSecurityAlertAction(formData: FormData) {
  try {
    const context = await requireStrongAdmin();
    const supabase = await createClient();
    const { error } = await supabase.rpc("acknowledge_security_alert", {
      p_organization_id: context.organizationId,
      p_alert_id: requiredText(formData.get("alertId"), "alert", 80),
    });
    if (error) throw new Error(error.message);
  } catch (reason) { fail(reason); }
  finish("Security alert acknowledged");
}

export async function recordBackupEvidenceAction(formData: FormData) {
  try {
    const context = await requireStrongAdmin();
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_backup_evidence", {
      p_organization_id: context.organizationId,
      p_completed_at: requiredText(formData.get("completedAt"), "backup time", 40),
      p_checksum: requiredText(formData.get("checksum"), "checksum", 160),
      p_reference: requiredText(formData.get("reference"), "backup reference", 500),
    });
    if (error) throw new Error(error.message);
  } catch (reason) { fail(reason); }
  finish("Backup evidence recorded");
}

export async function recordRestoreTestAction(formData: FormData) {
  try {
    const context = await requireStrongAdmin();
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_restore_test", {
      p_organization_id: context.organizationId,
      p_completed_at: requiredText(formData.get("completedAt"), "restore time", 40),
      p_status: requiredText(formData.get("status"), "restore status", 12),
      p_notes: requiredText(formData.get("notes"), "restore notes", 2000),
    });
    if (error) throw new Error(error.message);
  } catch (reason) { fail(reason); }
  finish("Restore-test evidence recorded");
}
