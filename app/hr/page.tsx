import { HrPayrollWorkspace } from "../../components/hr-payroll-workspace";
import { can, getCurrentUserContext } from "../../lib/data/context";
import { getHrPayrollSnapshot } from "../../lib/data/core-operations";

export const metadata = { title: "Human Resources & Payroll" };
export const dynamic = "force-dynamic";

export default async function HrPayrollPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [query, snapshot, user] = await Promise.all([
    searchParams,
    getHrPayrollSnapshot(),
    getCurrentUserContext({ required: true }),
  ]);
  return <HrPayrollWorkspace snapshot={snapshot} initialTab={query.tab} canManage={Boolean(user && can(user, "manage_hr"))} />;
}