"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { pricingAddOns, pricingPlans } from "../lib/marketing-pricing";

function formatEtb(value: number) {
  return new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 }).format(value);
}

export function PricingExperience() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const annual = billing === "annual";
  const savings = useMemo(() => pricingPlans.map((plan) => plan.monthlyEtb && plan.annualEtb ? plan.monthlyEtb * 12 - plan.annualEtb : 0), []);

  return (
    <>
      <div className="pricing-controls" aria-label="Access period">
        <button type="button" className={!annual ? "active" : undefined} aria-pressed={!annual} onClick={() => setBilling("monthly")}>Monthly access</button>
        <button type="button" className={annual ? "active" : undefined} aria-pressed={annual} onClick={() => setBilling("annual")}>Annual access <span>Save about 2 months</span></button>
      </div>

      <div className="pricing-plan-grid">
        {pricingPlans.map((plan, index) => {
          const amount = annual ? plan.annualEtb : plan.monthlyEtb;
          const checkoutHref = plan.code === "enterprise" ? plan.href : `/checkout?plan=${plan.code}&billing=${billing}`;
          return (
            <article className={plan.badge ? "featured" : undefined} key={plan.name}>
              {plan.badge ? <b className="pricing-badge">{plan.badge}</b> : null}
              <header><span>{String(index + 1).padStart(2, "0")}</span><h2>{plan.name}</h2><p>{plan.audience}</p></header>
              <div className="pricing-amount">
                {amount === null ? <><strong>Custom</strong><small>Scoped to your organization</small></> : <><strong>ETB {formatEtb(amount)}</strong><small>{annual ? "for one year" : "for one month"}{annual && savings[index] ? ` · save ETB ${formatEtb(savings[index])}` : ""}</small></>}
              </div>
              <p className="pricing-description">{plan.description}</p>
              <div className="pricing-capacity"><span>{plan.users}</span><span>{plan.branches}</span></div>
              <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <Link href={checkoutHref} className={plan.badge ? "marketing-start" : "marketing-demo"}>{plan.cta}</Link>
              {plan.code !== "enterprise" ? <small className="pricing-secure-note">Secure Chapa checkout · manual renewal · no automatic charge</small> : null}
            </article>
          );
        })}
      </div>

      <div className="pricing-addons">
        <div><span className="marketing-eyebrow">Optional additions</span><h2>Know what changes the final commercial scope.</h2><p>These items are separated so businesses can compare paid software access with migration, branch growth and specialized implementation work.</p></div>
        <div>{pricingAddOns.map((item) => <article key={item.label}><span><strong>{item.label}</strong><small>{item.detail}</small></span><b>{item.price}</b></article>)}</div>
      </div>
    </>
  );
}
