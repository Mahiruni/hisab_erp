import Link from "next/link";
import { getServerFoundationCopy } from "../lib/server-locale";

export default async function NotFound() {
  const c = (await getServerFoundationCopy()).copy.errors;
  return <main className="error-page"><section><p className="eyebrow">{c.notFoundLabel}</p><h1>{c.notFoundTitle}</h1><p>{c.notFoundText}</p><Link className="primary action-link" href="/">{c.returnDashboard}</Link></section></main>;
}
