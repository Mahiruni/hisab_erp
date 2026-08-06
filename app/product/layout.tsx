import type { ReactNode } from "react";

export const dynamic = "force-static";
export const revalidate = 3600;

export default function ProductPublicLayout({ children }: { children: ReactNode }) {
  return children;
}
