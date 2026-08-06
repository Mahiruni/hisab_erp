import { permanentRedirect } from "next/navigation";

export default function LegacyHelpRedirectPage() {
  permanentRedirect("/help-center");
}
