"use client";

import { createBrowserClient } from "@supabase/ssr";
import { appConfig } from "../config";

export function createClient() {
  if (!appConfig.supabaseUrl || !appConfig.supabaseKey) {
    throw new Error("Supabase is not configured. Add the required Vercel environment variables.");
  }

  return createBrowserClient(appConfig.supabaseUrl, appConfig.supabaseKey);
}
