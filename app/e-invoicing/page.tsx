import { EInvoicingWorkspace } from "../../components/e-invoicing-workspace";
import { can, getCurrentUserContext } from "../../lib/data/context";
import { getEInvoiceSnapshot } from "../../lib/data/e-invoicing";

export const metadata = {
  title: "Electronic Invoicing",
  description: "Government clearance readiness, invoice identifiers, QR evidence, offline queues and cancellation records.",
};

export const dynamic = "force-dynamic";

export default async function EInvoicingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const [params, snapshot, user] = await Promise.all([
    searchParams,
    getEInvoiceSnapshot(),
    getCurrentUserContext({ required: true }),
  ]);

  return (
    <EInvoicingWorkspace
      snapshot={snapshot}
      success={params.success}
      canConfigure={Boolean(user && can(user, "manage_users"))}
      canQueue={Boolean(user && can(user, "manage_sales"))}
      canClear={Boolean(user && can(user, "manage_finance"))}
    />
  );
}
