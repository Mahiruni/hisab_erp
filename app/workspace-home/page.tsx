import { redirect } from "next/navigation";
import { Dashboard } from "../../components/dashboard";
import { getCurrentUserContext } from "../../lib/data/context";
import { getDashboardSnapshot } from "../../lib/data/erp";

export const dynamic = "force-dynamic";

export default async function WorkspaceHomePage() {
  const user = await getCurrentUserContext({ required: true });
  if (!user) redirect("/auth/login");

  const snapshot = await getDashboardSnapshot();
  return <Dashboard snapshot={snapshot} user={user} />;
}
