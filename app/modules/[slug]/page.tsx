import { notFound, redirect } from "next/navigation";
import { OperationalModuleWorkspace } from "../../../components/operational-module-workspace";
import { getCurrentUserContext } from "../../../lib/data/context";
import { canManageOperationalModule, getOperationalModuleSnapshot } from "../../../lib/data/operational";
import { erpModules, getErpModule } from "../../../lib/erp-modules";
import { isOperationalModuleSlug } from "../../../lib/operational-modules";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return erpModules.map((module) => ({ slug: module.slug }));
}

export default async function ModuleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (slug === "finance-accounting") redirect("/finance");
  if (slug === "sales-invoicing") redirect("/sales");
  if (slug === "purchasing-expenses") redirect("/purchasing");
  if (slug === "inventory-warehouse") redirect("/inventory");
  if (slug === "human-resources-payroll") redirect("/hr");
  if (!getErpModule(slug) || !isOperationalModuleSlug(slug)) notFound();

  const [snapshot, user] = await Promise.all([
    getOperationalModuleSnapshot(slug),
    getCurrentUserContext({ required: true }),
  ]);

  return (
    <OperationalModuleWorkspace
      snapshot={snapshot}
      initialTab={query.tab}
      canManage={Boolean(user && canManageOperationalModule(user.role, slug))}
    />
  );
}