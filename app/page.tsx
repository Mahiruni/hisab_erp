import type { Metadata } from "next";
import { MarketingPageShell } from "../components/marketing-site-chrome";
import { MarketingHome } from "../components/marketing-home";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Hisab ERP — Run the whole business from one ledger",
  description:
    "Hisab ERP connects sales, finance, inventory, purchasing and reporting to a single double-entry general ledger, built for Ethiopian businesses in English, Amharic and Tigrinya.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Hisab ERP — Run the whole business from one ledger",
    description:
      "One connected operating system for sales, finance, inventory and reporting. Built in Addis Ababa for Ethiopian businesses.",
    url: "/",
    type: "website",
    images: [{ url: "/hisab-logo.svg", width: 512, height: 512, alt: "Hisab ERP" }],
  },
};

export default function HomePage() {
  return (
    <MarketingPageShell>
      <MarketingHome />
    </MarketingPageShell>
  );
}
