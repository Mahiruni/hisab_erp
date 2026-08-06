import Link from "next/link";
import { EmailAuthCard } from "../../../components/email-auth-card";

export const metadata = { title: "Invalid link" };
export default function Page() {
  return <EmailAuthCard title="This link is no longer valid" description="The link may have expired or already been used." footer={<Link href="/auth/forgot-password">Request a new recovery link</Link>}><div className="form-alert warning" role="alert">For your security, authentication links are time-limited and single-use.</div></EmailAuthCard>;
}
