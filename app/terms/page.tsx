import type { Metadata } from "next";
import { LegalDocumentPage } from "../../components/legal-document-page";

export const metadata: Metadata = {
  title: "Website Terms",
  description: "Terms governing access to the Hisab website, public resources, demo requests, accounts and related services provided by Hisab Technologies.",
  alternates: { canonical: "/terms" },
};

export default function WebsiteTermsPage() {
  return (
    <LegalDocumentPage
      eyebrow="Legal · Website Terms"
      title="Straightforward terms for using the Hisab website and services."
      description="These terms explain the rules that apply when you browse Hisab’s public website, request information, create an account or access a Hisab service. Customer contracts may add service-specific commitments."
      effectiveDate="August 6, 2026"
      readingTime="11 minutes"
      relatedHref="/privacy"
      relatedLabel="Read Privacy Policy"
      highlights={[
        { label: "Service operator", value: "Hisab Technologies, Addis Ababa" },
        { label: "Primary rule", value: "Use the service lawfully and responsibly" },
        { label: "Terms contact", value: "mahir@hisabtech.com" },
      ]}
      sections={[
        {
          id: "acceptance",
          title: "Acceptance and scope",
          summary: "When these terms apply and how service-specific agreements interact with them.",
          content: <>
            <p>These Website Terms govern access to hisabtech.com, Hisab public resources, demo and contact forms, account-registration journeys and any service that links to these terms. By accessing or using those services, you agree to these terms.</p>
            <p>If you use Hisab for an organization, you confirm that you are authorized to act for that organization. A signed subscription agreement, order form, implementation statement, data-processing agreement or other customer contract will control if it expressly conflicts with these Website Terms for the contracted service.</p>
            <div className="legal-note"><strong>Please read before creating an account</strong>If you do not agree to these terms, do not create an account or use the service. You may still contact us to ask for clarification.</div>
          </>,
        },
        {
          id: "website-use",
          title: "Using the public website",
          summary: "Permitted access to product information, resources and communication tools.",
          content: <>
            <p>You may use the public website to learn about Hisab, review resources, compare features, request a demonstration, contact the team and access available account entry points. Information is provided for general product evaluation and business education.</p>
            <p>You must not interfere with website operation, attempt unauthorized access, scrape the website in a way that creates unreasonable load, bypass security controls, distribute malicious code, impersonate another person, or use forms to send unlawful, deceptive or abusive content.</p>
          </>,
        },
        {
          id: "accounts",
          title: "Accounts and access security",
          summary: "Responsibilities for credentials, authorized users and account activity.",
          content: <>
            <p>You are responsible for providing accurate account information, protecting login credentials and promptly notifying us of suspected unauthorized access. Organizations are responsible for deciding who may access their workspace and for reviewing user roles and permissions.</p>
            <p>You may not share credentials in a way that defeats account controls, access another customer’s information without authorization, or use an account after authority has been withdrawn. We may require password changes, multifactor authentication or other safeguards where reasonably necessary to protect the service.</p>
          </>,
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          summary: "Prohibited conduct designed to protect customers, systems and lawful business use.",
          content: <>
            <p>You may not use Hisab or the website to:</p>
            <ul>
              <li>Violate applicable law, regulation, court order or another person’s legal rights.</li>
              <li>Upload malware, exploit vulnerabilities, conduct unauthorized security testing or disrupt availability.</li>
              <li>Store or transmit content you do not have the right to use.</li>
              <li>Misrepresent identity, affiliation, financial records or authority.</li>
              <li>Attempt to reverse engineer protected service components except where applicable law expressly permits it.</li>
              <li>Use automated methods to extract data or train competing products without written authorization.</li>
              <li>Use the service for harassment, fraud, spam or activity that creates material risk for Hisab, customers or third parties.</li>
            </ul>
            <p>We may investigate suspected misuse and take proportionate steps, including restricting access, preserving evidence or notifying affected parties or authorities where legally appropriate.</p>
          </>,
        },
        {
          id: "subscriptions-payments",
          title: "Subscriptions, pricing and payments",
          summary: "How commercial terms, taxes, renewals and payment providers are handled.",
          content: <>
            <p>Public pricing may describe standard plans but does not replace an accepted order form or subscription confirmation. Prices, included usage, implementation services and renewal terms may vary by plan, customer needs and applicable taxes.</p>
            <p>Paid services must be paid according to the applicable checkout, invoice or customer agreement. Third-party payment providers may apply their own terms and privacy notices. Failure to pay may result in restricted access or suspension after any notice or remedy period required by the applicable agreement or law.</p>
            <p>Unless an applicable agreement states otherwise, fees paid for completed service periods or delivered implementation work are not refundable merely because the customer no longer wishes to use the service.</p>
          </>,
        },
        {
          id: "customer-data",
          title: "Customer data and responsibilities",
          summary: "Ownership remains with the customer while Hisab receives the rights needed to operate the service.",
          content: <>
            <p>Customers retain their rights in data submitted to their Hisab workspace. The customer grants Hisab the limited rights necessary to host, process, transmit, back up, secure and otherwise handle that data to provide the requested service and support.</p>
            <p>Customers are responsible for the lawfulness, accuracy and quality of data they submit; obtaining required permissions and notices; configuring users and workflows appropriately; and maintaining independent records where required by law or business policy.</p>
            <p>Hisab may generate service metadata, diagnostic information and aggregated statistics that do not identify a customer or individual. Such information may be used to operate, secure and improve the service.</p>
          </>,
        },
        {
          id: "intellectual-property",
          title: "Intellectual property",
          summary: "Ownership of the website, software, brand and materials.",
          content: <>
            <p>Hisab, Hisab Technologies and their licensors own the website, software, designs, documentation, trademarks, logos and other protected materials, excluding customer data and third-party content. These terms provide a limited, revocable, non-exclusive right to use the service for its intended purpose; they do not transfer ownership.</p>
            <p>You may download or share public resources for internal evaluation or educational use where the resource permits it, but you may not remove ownership notices, resell materials, publish misleading modified versions or use Hisab branding in a way that suggests endorsement without permission.</p>
            <p>Feedback may be used to improve Hisab without an obligation to compensate the person providing it, provided we do not publicly identify confidential customer information without authorization.</p>
          </>,
        },
        {
          id: "third-party-services",
          title: "Third-party services and integrations",
          summary: "External providers have their own availability, security and contractual responsibilities.",
          content: <>
            <p>Hisab may link to or integrate with payment providers, communications services, banks, cloud providers or other third parties. Third-party services are governed by their own terms and privacy practices. Hisab does not control their independent systems or guarantee uninterrupted third-party availability.</p>
            <p>Customers are responsible for maintaining required third-party accounts, credentials and permissions. Integration descriptions should be understood according to the implementation status and scope documented for the relevant service.</p>
          </>,
        },
        {
          id: "availability-changes",
          title: "Availability, changes and suspension",
          summary: "How maintenance, product evolution and risk-based access restrictions may occur.",
          content: <>
            <p>We aim to provide a reliable service, but availability may be affected by maintenance, updates, internet conditions, third-party services, security events or circumstances beyond reasonable control. Specific uptime commitments apply only where stated in a customer agreement.</p>
            <p>Features may be added, changed or discontinued to improve the product, meet legal or security requirements, or reflect commercial priorities. We will use reasonable efforts to communicate material changes affecting contracted customer use.</p>
            <p>Access may be suspended where reasonably necessary to address security threats, unlawful activity, material breach, non-payment, infrastructure risk or harm to other users. We will consider the circumstances and applicable contractual or legal requirements.</p>
          </>,
        },
        {
          id: "warranties-liability",
          title: "Disclaimers and limitation of liability",
          summary: "Reasonable allocation of risk without excluding obligations that cannot lawfully be excluded.",
          content: <>
            <p>The public website and general resources are provided for informational purposes and may not address every legal, accounting, tax, operational or technical requirement. Customers should obtain professional advice for decisions requiring specialist judgment.</p>
            <p>Except for commitments expressly stated in an applicable customer agreement, services are provided on an “as available” basis to the extent permitted by law. We do not promise that every feature will be error-free, uninterrupted or suitable for every business process.</p>
            <p>To the extent permitted by applicable law, Hisab and Hisab Technologies will not be liable for indirect, incidental, special, punitive or consequential losses, including lost profits, lost opportunity or loss resulting from unauthorized customer configuration. Any contractual liability cap or remedy in a customer agreement will govern the contracted service.</p>
            <p>Nothing in these terms excludes liability that cannot legally be excluded or limits rights that applicable law gives to a user and does not permit to be waived.</p>
          </>,
        },
        {
          id: "termination-law-contact",
          title: "Termination, governing law and contact",
          summary: "Ending access, resolving disputes and communicating changes to these terms.",
          content: <>
            <p>You may stop using the public website at any time. Account closure and customer data handling are governed by the relevant account process and customer agreement. Provisions that by their nature should continue—such as ownership, payment obligations, confidentiality, disclaimers and liability terms—survive termination.</p>
            <p>These Website Terms are governed by the laws of Ethiopia, without preventing the application of mandatory protections that cannot lawfully be excluded. Parties should first attempt to resolve concerns through good-faith communication before pursuing formal remedies.</p>
            <p>We may update these terms to reflect service, legal or business changes. The effective date will be revised, and material changes may be communicated through the website or account contact information.</p>
            <p>Questions may be sent to <a href="mailto:mahir@hisabtech.com?subject=Hisab%20website%20terms">mahir@hisabtech.com</a> or addressed to Hisab Technologies, Addis Ababa, Ethiopia.</p>
          </>,
        },
      ]}
    />
  );
}
