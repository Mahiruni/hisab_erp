import { getDashboardSnapshot } from "../../../../lib/data/erp";

function csv(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET() {
  const snapshot = await getDashboardSnapshot();
  const rows = [
    ["Hisab ERP dashboard export"],
    ["Organization", snapshot.organizationName],
    ["Generated", new Date().toISOString()],
    ["Data mode", snapshot.mode],
    [],
    ["Metric", "ETB"],
    ["Sales", snapshot.metrics.sales],
    ["Expenses", snapshot.metrics.expenses],
    ["Cash", snapshot.metrics.cash],
    ["Outstanding debt", snapshot.metrics.debt],
    [],
    ["Transaction", "Description", "Category", "Date", "Type", "ETB"],
    ...snapshot.recentTransactions.map((transaction) => [transaction.id, transaction.description, transaction.category, transaction.date, transaction.type, transaction.amount]),
  ];
  const body = rows.map((row) => row.map(csv).join(",")).join("\n");
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="hisab-dashboard-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "private, no-store" } });
}
