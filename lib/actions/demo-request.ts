"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../config";
import { ADMIN_CONTACT_EMAIL, sendDemoRequestEmail } from "../email/demo-request-email";
import { createClient } from "../supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEAM_SIZES = new Set(["1-5", "6-20", "21-50", "51-200", "200+"]);
const CONTACT_METHODS = new Set(["phone", "email"]);

function value(formData: FormData, key: string, maxLength: number) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

function fail(message: string): never {
  redirect(`/request-demo?error=${encodeURIComponent(message)}`);
}

export async function submitDemoRequest(formData: FormData) {
  const honeypot = value(formData, "website", 200);
  if (honeypot) redirect("/request-demo?submitted=1");

  const fullName = value(formData, "full_name", 120);
  const businessName = value(formData, "business_name", 160);
  const email = value(formData, "email", 254).toLowerCase();
  const phone = value(formData, "phone", 32);
  const businessType = value(formData, "business_type", 80);
  const teamSize = value(formData, "team_size", 20);
  const preferredContact = value(formData, "preferred_contact", 20);
  const message = value(formData, "message", 2000);
  const requestContext = value(formData, "request_context", 300);

  if (fullName.length < 2 || businessName.length < 2) fail("Please enter your name and business name.");
  if (!EMAIL_PATTERN.test(email)) fail("Please enter a valid business email address.");
  if (phone.length < 7) fail("Please enter a valid telephone number.");
  if (businessType.length < 2) fail("Please select your business type.");
  if (!TEAM_SIZES.has(teamSize)) fail("Please select your team size.");
  if (!CONTACT_METHODS.has(preferredContact)) fail("Please choose how we should contact you.");

  const request = {
    fullName,
    businessName,
    email,
    phone,
    businessType,
    teamSize,
    preferredContact,
    message,
    requestContext,
  };

  const emailDelivery = sendDemoRequestEmail(request);
  const databaseStorage = isSupabaseConfigured()
    ? createClient().then((supabase) => supabase.from("demo_requests").insert({
        full_name: fullName,
        business_name: businessName,
        email,
        phone,
        business_type: businessType,
        team_size: teamSize,
        preferred_contact: preferredContact,
        message: [requestContext ? `Context: ${requestContext}` : "", message].filter(Boolean).join("\n\n") || null,
      }))
    : Promise.resolve({ error: null });

  const [deliveryResult, storageResult] = await Promise.all([emailDelivery, databaseStorage]);

  if (storageResult.error) {
    console.error("Demo request database storage failed", { code: storageResult.error.code });
  }

  if (!deliveryResult.ok) {
    const reason = deliveryResult.reason === "not_configured"
      ? "Email delivery is being configured."
      : "We could not deliver your request automatically.";
    fail(`${reason} Please email ${ADMIN_CONTACT_EMAIL} directly.`);
  }

  redirect("/request-demo?submitted=1&delivered=1");
}
