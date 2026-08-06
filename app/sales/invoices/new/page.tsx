import { redirect } from "next/navigation";

export const metadata = { title: "Sales & Invoicing" };

export default function NewInvoicePage() {
  redirect("/sales?tab=invoices");
}
