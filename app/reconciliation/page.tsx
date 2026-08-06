import { MpesaDarajaSettings } from "../../components/mpesa-daraja-settings";
import { ReconciliationWorkspace } from "../../components/reconciliation-workspace";
import { can, getCurrentUserContext } from "../../lib/data/context";
import { getReconciliationSnapshot } from "../../lib/data/reconciliation";
import { getMpesaDarajaStatus } from "../../lib/reconciliation/daraja";

export const metadata = {
  title: "Bank and Mobile-Money Reconciliation",
  description: "Bank statement, Telebirr and Safaricom M-Pesa settlement matching with controlled accounting posting.",
};

export const dynamic = "force-dynamic";

export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const [params, snapshot, user] = await Promise.all([
    searchParams,
    getReconciliationSnapshot(),
    getCurrentUserContext({ required: true }),
  ]);
  const finance = Boolean(user && can(user, "manage_finance"));
  const importing = Boolean(user && (can(user, "manage_finance") || can(user, "manage_sales")));
  const canManageDaraja = Boolean(user && ["owner", "admin"].includes(user.role) && user.aal === "aal2");
  const darajaStatus = user && canManageDaraja
    ? await getMpesaDarajaStatus(user.organizationId)
    : { configured: false, environment: "sandbox" as const, keySuffix: null, callbackTokenPresent: false, lastCheck: null };

  return (
    <>
      <ReconciliationWorkspace snapshot={snapshot} success={params.success} canConfigure={finance} canImport={importing} canPost={finance} />
      <MpesaDarajaSettings status={darajaStatus} canManage={canManageDaraja} />
    </>
  );
}
