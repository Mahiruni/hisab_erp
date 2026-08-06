import { isSupabaseConfigured } from "../config";
import { createClient } from "../supabase/server";
import { getCurrentUserContext } from "./context";
import type { OnboardingSnapshot, ProductionControlSnapshot } from "./setup-types";

function asObject<T>(value: unknown): T {
  if (!value || typeof value !== "object") throw new Error("The setup service returned an invalid response.");
  return value as T;
}

export async function getOnboardingSnapshot(): Promise<OnboardingSnapshot | null> {
  if (!isSupabaseConfigured()) return null;
  const context = await getCurrentUserContext({ required: true });
  if (!context) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_onboarding_snapshot", { p_organization_id: context.organizationId });
  if (error) throw new Error(error.message);
  return asObject<OnboardingSnapshot>(data);
}

export async function getProductionControlSnapshot(): Promise<ProductionControlSnapshot | null> {
  if (!isSupabaseConfigured()) return null;
  const context = await getCurrentUserContext({ required: true });
  if (!context || !context.mfaRequired || context.aal !== "aal2") return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_production_controls_snapshot", { p_organization_id: context.organizationId });
  if (error) throw new Error(error.message);
  return {
    ...asObject<Omit<ProductionControlSnapshot, "monitoringConfigured" | "projectPlan">>(data),
    monitoringConfigured: Boolean(process.env.MONITORING_WEBHOOK_URL),
    projectPlan: "free",
  };
}
