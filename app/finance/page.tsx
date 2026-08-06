import { FinanceWorkspaceV2 } from "../../components/finance-workspace-v2";
import { getCurrentUserContext } from "../../lib/data/context";
import { getFinanceSnapshot } from "../../lib/data/erp";

export const metadata = {
  title: "Finance & Accounting",
  description: "General ledger, payments, taxes, assets and accounting period controls.",
};

export const dynamic = "force-dynamic";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; success?: string }>;
}) {
  const [params, snapshot, user] = await Promise.all([
    searchParams,
    getFinanceSnapshot(),
    getCurrentUserContext({ required: true }),
  ]);

  const canManage = user?.role === "owner" || user?.role === "admin" || user?.role === "accountant";

  return (
    <FinanceWorkspaceV2
      snapshot={snapshot}
      initialTab={params.tab || "overview"}
      success={params.success}
      canManage={Boolean(canManage)}
    />
  );
}
