import "server-only";
import { createClient } from "@supabase/supabase-js";
import { appConfig } from "../config";

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!appConfig.supabaseUrl || !serviceRoleKey) {
    throw new Error("Provider callback processing is not configured.");
  }
  return createClient(appConfig.supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
