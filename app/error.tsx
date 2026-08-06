"use client";

import { useEffect } from "react";
import { getFoundationCopy } from "../lib/foundation-copy";
import { useLanguage } from "../components/language-provider";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { language } = useLanguage();
  const c = getFoundationCopy(language).errors;
  useEffect(() => { console.error("Hisab ERP route error", error); }, [error]);
  return <main className="error-page"><section><p className="eyebrow">{c.routeLabel}</p><h1>{c.routeTitle}</h1><p>{c.routeText}</p><div><button className="primary" onClick={reset}>{c.tryAgain}</button><a className="ghost action-link" href="/">{c.returnDashboard}</a></div>{error.digest && <small>{c.reference}: {error.digest}</small>}</section></main>;
}
