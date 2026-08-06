import { PurchasingWorkspace } from "../../components/purchasing-workspace";
import { can, getCurrentUserContext } from "../../lib/data/context";
import { getPurchasingSnapshot } from "../../lib/data/core-operations";

export const metadata = { title: "Purchasing & Accounts Payable" };
export const dynamic = "force-dynamic";

export default async function PurchasingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [query, snapshot, user] = await Promise.all([
    searchParams,
    getPurchasingSnapshot(),
    getCurrentUserContext({ required: true }),
  ]);
  return <PurchasingWorkspace snapshot={snapshot} initialTab={query.tab} canManage={Boolean(user && can(user, "manage_purchasing"))} />;
}