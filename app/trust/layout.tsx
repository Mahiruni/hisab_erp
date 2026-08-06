import type { ReactNode } from "react";

export const dynamic = "force-static";
export const revalidate = 3600;

export default function TrustPublicLayout({ children }: { children: ReactNode }) {
  return children;
}
