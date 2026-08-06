import { redirect } from "next/navigation";

export const metadata = { title: "Journal entries" };

export default function JournalsPage() {
  redirect("/finance?tab=journal");
}