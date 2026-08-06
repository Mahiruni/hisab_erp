"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BillingState = "processing" | "activating" | "verified" | "failed" | "error";

const MAX_STATUS_CHECKS = 24;

const copy: Record<BillingState, { eyebrow: string; title: string; description: string }> = {
  processing: {
    eyebrow: "Payment submitted through Chapa",
    title: "Verifying the transaction directly…",
    description: "HisabTech is checking the reference, ETB amount, currency and final payment status with Chapa.",
  },
  activating: {
    eyebrow: "Chapa payment verified",
    title: "Activating your HisabERP access…",
    description: "The payment is successful. Your monthly or annual access period is being recorded securely.",
  },
  verified: {
    eyebrow: "Paid access verified",
    title: "Your HisabERP workspace is ready.",
    description: "The Chapa transaction was verified and your paid access period is active.",
  },
  failed: {
    eyebrow: "Payment not completed",
    title: "Your HisabERP access was not activated.",
    description: "The payment failed, was cancelled, refunded or reversed. No browser-only status was accepted.",
  },
  error: {
    eyebrow: "Verification is taking longer",
    title: "Your payment status is still being checked.",
    description: "Open the paid access center to review the latest verified status or contact HisabTech support.",
  },
};

export function BillingSuccessStatus({ txRef }: { txRef: string }) {
  const [state, setState] = useState<BillingState>("processing");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let checks = 0;

    async function check() {
      if (cancelled) return;
      if (checks >= MAX_STATUS_CHECKS) {
        setState("error");
        return;
      }
      checks += 1;

      try {
        const response = await fetch(`/api/billing/status?tx_ref=${encodeURIComponent(txRef)}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Status unavailable");
        const payload = await response.json() as { state?: BillingState };
        const nextState = payload.state || "processing";
        if (cancelled) return;
        if (nextState === "verified" || nextState === "failed") {
          setState(nextState);
          return;
        }
        setState(nextState === "activating" ? "activating" : "processing");
        timer = setTimeout(check, 1800);
      } catch {
        if (cancelled) return;
        if (checks >= MAX_STATUS_CHECKS) {
          setState("error");
          return;
        }
        timer = setTimeout(check, 2500);
      }
    }

    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [txRef]);

  const content = copy[state];
  return (
    <section className={`billing-success-card ${state}`} aria-live="polite">
      <div className="billing-verification-visual" aria-hidden="true"><span/><i/><b>{state === "verified" ? "✓" : state === "failed" ? "!" : "H"}</b></div>
      <span className="commerce-kicker">{content.eyebrow}</span>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
      {state === "processing" || state === "activating" ? <div className="billing-verification-progress"><span/><small>Keep this page open while verification is in progress.</small></div> : null}
      <div className="billing-success-actions">
        {state === "verified" ? <Link href="/onboarding" className="commerce-primary">Continue to company setup <b aria-hidden="true">→</b></Link> : null}
        {state === "failed" ? <Link href="/pricing" className="commerce-primary">Return to pricing <b aria-hidden="true">→</b></Link> : null}
        {state === "error" ? <Link href="/billing" className="commerce-primary">Open paid access center <b aria-hidden="true">→</b></Link> : null}
        <Link href="/" className="commerce-secondary">Go to HisabTech</Link>
      </div>
    </section>
  );
}
