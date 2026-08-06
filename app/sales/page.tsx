import { SalesWorkspace } from "../../components/sales-workspace";
import { can, getCurrentUserContext } from "../../lib/data/context";
import { getSalesSnapshot } from "../../lib/data/sales";

export const metadata = {
  title: "Sales & Invoicing",
  description: "Quotations, sales orders, invoices, receipts, returns and customer balances.",
};

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; success?: string }>;
}) {
  const [params, snapshot, user] = await Promise.all([
    searchParams,
    getSalesSnapshot(),
    getCurrentUserContext({ required: true }),
  ]);

  return (
    <SalesWorkspace
      snapshot={snapshot}
      initialTab={params.tab || "overview"}
      success={params.success}
      canManage={Boolean(user && can(user, "manage_sales"))}
    />
  );
}
