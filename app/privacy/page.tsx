import type { Metadata } from "next";
import { LegalDocumentPage } from "../../components/legal-document-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Hisab and Hisab Technologies collect, use, protect and manage personal information across the public website and Hisab ERP services.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      eyebrow="Legal · Privacy"
      title="Privacy should be clear, practical and under your control."
      description="This policy explains how Hisab, operated by Hisab Technologies, handles personal information when you visit our website, request a demo, contact us, create an account or use Hisab ERP."
      effectiveDate="August 6, 2026"
      readingTime="10 minutes"
      relatedHref="/terms"
      relatedLabel="Read Website Terms"
      highlights={[
        { label: "Data principle", value: "Collect only what supports the service" },
        { label: "Visitor control", value: "Cookie preferences can be changed anytime" },
        { label: "Privacy contact", value: "mahir@hisabtech.com" },
      ]}
      sections={[
        {
          id: "scope",
          title: "Who we are and what this policy covers",
          summary: "The organizations, services and interactions governed by this notice.",
          content: <>
            <p>Hisab is a business operating system developed and operated by Hisab Technologies in Addis Ababa, Ethiopia. In this policy, “Hisab,” “Hisab Technologies,” “we,” “us” and “our” refer to the entity responsible for the public website and the Hisab ERP service.</p>
            <p>This policy applies when you visit hisabtech.com, request a demonstration, contact our team, create or manage a Hisab account, or use features that link to this policy. A separate customer agreement, data-processing agreement or implementation statement may provide additional terms for an organization using Hisab ERP.</p>
            <div className="legal-note"><strong>Business customer data</strong>When an organization uses Hisab ERP to manage its own records, that organization determines what business data is entered and who may access it. We process that data to provide the contracted service and according to the customer’s instructions, subject to applicable law.</div>
          </>,
        },
        {
          id: "information-collected",
          title: "Information we collect",
          summary: "The categories of information that may be provided directly or generated through use.",
          content: <>
            <h3>Information you provide</h3>
            <ul>
              <li>Contact details such as name, business email, telephone number and preferred contact method.</li>
              <li>Organization information including company name, sector, team size and operational requirements.</li>
              <li>Account details such as login identifiers, profile information and security preferences.</li>
              <li>Messages, demo requests, support questions, feedback and other communications.</li>
              <li>Billing and transaction references required to administer paid services. Complete payment-card details are handled by the applicable payment provider rather than stored directly by Hisab unless specifically stated.</li>
            </ul>
            <h3>Information generated through use</h3>
            <ul>
              <li>Technical data such as IP address, browser type, device type, operating system, referring page and approximate region.</li>
              <li>Security and access events used to protect accounts, investigate errors and prevent abuse.</li>
              <li>Product interaction and performance information where analytics has been permitted or where collection is necessary to operate the requested service.</li>
              <li>Cookie and storage preferences, including whether optional analytics has been accepted or declined.</li>
            </ul>
          </>,
        },
        {
          id: "how-we-use-data",
          title: "How we use information",
          summary: "Specific operational, security and communication purposes—not unrelated data exploitation.",
          content: <>
            <ul>
              <li>Provide, maintain and secure the website, Hisab ERP accounts and requested business workflows.</li>
              <li>Respond to demo requests, support questions, implementation enquiries and account communications.</li>
              <li>Authenticate users, manage permissions, detect suspicious activity and protect service integrity.</li>
              <li>Process subscriptions, payments, billing records and service-related notices.</li>
              <li>Measure reliability, diagnose errors and improve navigation, content and product usability.</li>
              <li>Comply with applicable legal obligations, enforce agreements and respond to lawful requests.</li>
            </ul>
            <p>We do not sell personal information. We do not use private customer business records for third-party advertising. Where we rely on consent for an optional activity, you may withdraw that consent without affecting processing that occurred before withdrawal.</p>
          </>,
        },
        {
          id: "legal-bases",
          title: "Why processing is permitted",
          summary: "The grounds used to process information depend on the interaction and applicable law.",
          content: <>
            <p>Depending on the circumstances and the law that applies, we process information because it is necessary to provide a requested service or perform a contract; because we must meet a legal obligation; because it supports legitimate interests such as security, service improvement and customer support; or because you have provided consent for a specific optional purpose.</p>
            <p>We balance legitimate interests against the rights and reasonable expectations of individuals. We use consent where required for non-essential storage or tracking technologies and provide controls to change that choice.</p>
          </>,
        },
        {
          id: "cookies",
          title: "Cookies and similar technologies",
          summary: "What is stored on your device, why it is used and how to control optional analytics.",
          content: <>
            <p>The public website may use browser storage, cookies or similar technologies. Essential technologies support security, maintain a consent record, remember display or language choices you request, and keep requested website functions working.</p>
            <p>Optional analytics may be used to understand aggregate performance, page usage and navigation quality. Optional analytics is not required to browse the public website and should only be activated after the visitor permits it.</p>
            <div className="legal-table-wrap"><table><thead><tr><th>Category</th><th>Purpose</th><th>Choice</th></tr></thead><tbody><tr><td>Essential</td><td>Security, requested preferences and consent records.</td><td>Required for the relevant function.</td></tr><tr><td>Analytics</td><td>Aggregated performance and experience improvement.</td><td>Optional and controlled through Cookie settings.</td></tr></tbody></table></div>
            <p>You may reopen the consent panel through the “Cookie settings” control in the website footer. You may also clear browser storage through your browser settings, although doing so may reset preferences.</p>
          </>,
        },
        {
          id: "sharing",
          title: "When information is shared",
          summary: "Limited disclosure to service providers, authorized customer users and lawful authorities.",
          content: <>
            <p>We may share information with carefully selected providers that support hosting, authentication, database services, email delivery, monitoring, payments, customer support or security. Providers receive only the information needed for their role and are expected to protect it under contractual and legal obligations.</p>
            <p>Information may also be shared with authorized administrators of the organization that controls a Hisab workspace, during a corporate restructuring with appropriate safeguards, or where disclosure is required by law, court order or a valid government request.</p>
            <p>We do not disclose customer information to unrelated parties for their independent marketing.</p>
          </>,
        },
        {
          id: "retention-security",
          title: "Retention and security",
          summary: "How long information is kept and the controls used to reduce unauthorized access.",
          content: <>
            <p>We retain information for as long as reasonably necessary to provide the service, maintain business and security records, resolve disputes, meet legal obligations and enforce agreements. Retention periods vary by data type, customer instructions and regulatory requirements.</p>
            <p>We use administrative, technical and organizational safeguards designed to protect information. These may include access controls, authentication protections, encrypted transmission, logging, backups, least-privilege access and operational review. No online system can be guaranteed completely secure, so users should protect credentials and report suspected misuse promptly.</p>
          </>,
        },
        {
          id: "international-processing",
          title: "International service providers",
          summary: "Some infrastructure may process information outside Ethiopia with contractual and technical safeguards.",
          content: <>
            <p>Hisab may use cloud and technology providers operating in other countries. As a result, information may be processed outside the country where it was collected. We assess provider security and use appropriate contractual, organizational and technical safeguards based on the information and applicable requirements.</p>
            <p>Customer-specific hosting, residency or transfer commitments should be documented in the relevant customer agreement or implementation statement.</p>
          </>,
        },
        {
          id: "your-rights",
          title: "Your choices and rights",
          summary: "Ways to access, correct, delete or limit the handling of personal information.",
          content: <>
            <p>Subject to applicable law and the role Hisab has in the relevant processing, you may request access to personal information, correction of inaccurate information, deletion, restriction, objection, portability, or withdrawal of consent.</p>
            <p>For information held inside an employer’s or customer organization’s Hisab workspace, contact that organization first because it normally controls the business record and user permissions. We will support the organization where required.</p>
            <p>To submit a privacy request, email <a href="mailto:mahir@hisabtech.com?subject=Hisab%20privacy%20request">mahir@hisabtech.com</a>. We may need to verify identity and clarify the scope before responding.</p>
          </>,
        },
        {
          id: "children-changes-contact",
          title: "Children, policy changes and contact",
          summary: "Age limitations, notice updates and the direct privacy contact.",
          content: <>
            <p>The Hisab business service is not directed to children. We do not knowingly invite children to create business accounts or submit personal information through the public website.</p>
            <p>We may update this policy when services, providers or legal requirements change. The effective date at the top of the page will be revised, and material changes may be communicated through the website, service or account contact details.</p>
            <p>Privacy questions and requests may be sent to <a href="mailto:mahir@hisabtech.com">mahir@hisabtech.com</a> or addressed to Hisab Technologies, Addis Ababa, Ethiopia.</p>
          </>,
        },
      ]}
    />
  );
}
