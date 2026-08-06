"use client";

import Link from "next/link";
import { getFoundationCopy } from "../lib/foundation-copy";
import { useLanguage } from "./language-provider";

export function DemoNotice({ mode }: { mode: "demo" | "live" }) {
  const { language } = useLanguage();
  const copy = getFoundationCopy(language).common;
  if (mode === "live") return <div className="mode-notice live"><strong>{copy.liveTitle}</strong><span>{copy.liveText}</span></div>;
  return <div className="mode-notice demo"><strong>{copy.demoTitle}</strong><span>{copy.demoText}</span><Link href="/docs/setup">{copy.setupGuide}</Link></div>;
}
