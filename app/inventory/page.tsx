import { InventoryOperationsWorkspace } from "../../components/inventory-operations-workspace";
import { can, getCurrentUserContext } from "../../lib/data/context";
import { getInventoryOperationsSnapshot } from "../../lib/data/core-operations";

export const metadata = { title: "Inventory & Warehouse" };
export const dynamic = "force-dynamic";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [query, snapshot, user] = await Promise.all([
    searchParams,
    getInventoryOperationsSnapshot(),
    getCurrentUserContext({ required: true }),
  ]);
  return <InventoryOperationsWorkspace snapshot={snapshot} initialTab={query.tab} canManage={Boolean(user && can(user, "manage_inventory"))} />;
}