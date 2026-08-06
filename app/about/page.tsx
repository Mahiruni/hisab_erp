import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "../../components/marketing-site-chrome";
import { getPublicLanguage } from "../../lib/public-localization";

export const metadata: Metadata = {
  title: "About Hisab Technologies",
  description: "Learn about Hisab Technologies, the Addis Ababa team building HisabERP for Ethiopian businesses.",
};

const copy = {
  en: {
    eyebrow: "About Hisab Technologies",
    title: "Building a clearer operating system for Ethiopian business.",
    intro: "Hisab Technologies is an Addis Ababa product company focused on making daily business records more connected, controlled and useful for decision-making.",
    facts: [
      ["Based in", "Addis Ababa, Ethiopia"],
      ["Flagship product", "HisabERP"],
      ["Product focus", "Business operations and financial visibility"],
      ["Primary market", "Growing Ethiopian organizations"],
    ],
    missionEyebrow: "Our mission",
    missionTitle: "Help businesses move from scattered records to reliable management information.",
    missionText: "HisabERP is being built around one practical idea: sales, purchasing, inventory, finance, customers, suppliers and reporting should contribute to the same trusted business picture.",
    principlesEyebrow: "How we build",
    principlesTitle: "Product principles that guide every release.",
    principles: [
      ["01", "Local context first", "Ethiopian birr, multilingual access, mobile workflows and local implementation realities are considered from the beginning."],
      ["02", "Evidence over claims", "Security, integrations and customer outcomes are described according to what is implemented and verified."],
      ["03", "Control without complexity", "The product should make responsibilities, approvals and exceptions visible without making routine work difficult."],
      ["04", "Connected decisions", "Operational activity should become useful management information without rebuilding reports manually."],
    ],
    leadershipEyebrow: "Leadership",
    leadershipTitle: "Founder-led product development from Addis Ababa.",
    founderName: "Mahir Aman",
    founderRole: "Founder and Product Lead",
    founderText: "Mahir leads HisabTech product direction, business workflow design and the development of HisabERP as a practical platform for Ethiopian organizations.",
    standardsEyebrow: "Our standard",
    standardsTitle: "What customers should expect from HisabTech.",
    standards: [
      "Clear product scope and implementation responsibilities",
      "Transparent pricing and integration statuses",
      "No fabricated testimonials, certifications or performance claims",
      "Security controls documented with their real limitations",
      "Migration validation before a production cutover",
      "A product roadmap shaped by real operating problems",
    ],
    contactEyebrow: "Talk to HisabTech",
    contactTitle: "Evaluate the product with the people building it.",
    contactText: "Share your current process, business size and main control problem. We will use that context to prepare a relevant conversation or demonstration.",
    demo: "Request a demo",
    email: "Email HisabTech",
    resources: "Read business guides",
  },
  am: {
    eyebrow: "ስለ Hisab Technologies",
    title: "ለኢትዮጵያ ንግድ የበለጠ ግልጽ የሥራ ስርዓት እየገነባን ነው።",
    intro: "Hisab Technologies በአዲስ አበባ የሚገኝ የምርት ኩባንያ ሲሆን ዕለታዊ የንግድ መዝገቦችን የተገናኙ፣ ቁጥጥር ያላቸው እና ለውሳኔ ጠቃሚ ለማድረግ ያተኩራል።",
    facts: [
      ["የምንገኝበት", "አዲስ አበባ፣ ኢትዮጵያ"],
      ["ዋና ምርት", "HisabERP"],
      ["የምርት ትኩረት", "የንግድ አሰራር እና የፋይናንስ ግልጽነት"],
      ["ዋና ገበያ", "እያደጉ ያሉ የኢትዮጵያ ድርጅቶች"],
    ],
    missionEyebrow: "ተልዕኳችን",
    missionTitle: "ንግዶች ከተበታተኑ መዝገቦች ወደ አስተማማኝ የአስተዳደር መረጃ እንዲሸጋገሩ መርዳት።",
    missionText: "HisabERP በአንድ ተግባራዊ ሀሳብ ላይ እየተገነባ ነው፤ ሽያጭ፣ ግዢ፣ ክምችት፣ ፋይናንስ፣ ደንበኞች፣ አቅራቢዎች እና ሪፖርት ለአንድ የታመነ የንግድ ምስል መረጃ ማቅረብ አለባቸው።",
    principlesEyebrow: "እንዴት እንገነባለን",
    principlesTitle: "እያንዳንዱን ልቀት የሚመሩ የምርት መርሆዎች።",
    principles: [
      ["01", "አካባቢያዊ ሁኔታ በቅድሚያ", "የኢትዮጵያ ብር፣ ብዙ ቋንቋ፣ የሞባይል የሥራ ሂደት እና የአካባቢ ትግበራ ሁኔታዎች ከመጀመሪያ ይታሰባሉ።"],
      ["02", "ከንግግር በላይ ማስረጃ", "ደህነት፣ ውህደቶች እና የደንበኛ ውጤቶች በተተገበረውና በተረጋገጠው መሠረት ይገለጻሉ።"],
      ["03", "ያለ አላስፈላጊ ውስብስብነት ቁጥጥር", "ምርቱ የተለመደውን ሥራ ሳያስቸግር ኃላፊነትን፣ ማጽደቅን እና ልዩነቶችን ግልጽ ማድረግ አለበት።"],
      ["04", "የተገናኙ ውሳኔዎች", "የሥራ እንቅስቃሴ ሪፖርቶችን በእጅ ሳይገነቡ ጠቃሚ የአስተዳደር መረጃ መሆን አለበት።"],
    ],
    leadershipEyebrow: "አመራር",
    leadershipTitle: "በአዲስ አበባ በመሥራች የሚመራ የምርት ልማት።",
    founderName: "ማሂር አማን",
    founderRole: "መሥራች እና የምርት መሪ",
    founderText: "ማሂር የHisabTech የምርት አቅጣጫን፣ የንግድ የሥራ ሂደት ንድፍን እና HisabERPን ለኢትዮጵያ ድርጅቶች ተግባራዊ መድረክ አድርጎ የማሳደግ ሥራን ይመራል።",
    standardsEyebrow: "የሥራ ደረጃችን",
    standardsTitle: "ደንበኞች ከHisabTech ምን መጠበቅ አለባቸው።",
    standards: [
      "ግልጽ የምርት ወሰን እና የትግበራ ኃላፊነቶች",
      "ግልጽ ዋጋ እና የውህደት ሁኔታ",
      "የተፈጠሩ ምስክርነቶች፣ ሰርተፍኬቶች ወይም የአፈጻጸም ጥያቄዎች አለመጠቀም",
      "የደህነት ቁጥጥሮችን ከእውነተኛ ገደቦቻቸው ጋር መግለጽ",
      "ወደ ምርት ሥራ ከመሸጋገር በፊት የመረጃ ማረጋገጥ",
      "በእውነተኛ የሥራ ችግሮች የሚመራ የምርት ዕቅድ",
    ],
    contactEyebrow: "ከHisabTech ጋር ይነጋገሩ",
    contactTitle: "ምርቱን ከሚገነቡት ሰዎች ጋር ይገምግሙ።",
    contactText: "የአሁኑን አሰራርዎን፣ የንግድዎን መጠን እና ዋናውን የቁጥጥር ችግር ያጋሩ። ተገቢ ውይይት ወይም ማሳያ ለማዘጋጀት ይህን መረጃ እንጠቀማለን።",
    demo: "ማሳያ ይጠይቁ",
    email: "ለHisabTech ኢሜይል ይላኩ",
    resources: "የንግድ መመሪያዎችን ያንብቡ",
  },
} as const;

export default async function AboutPage() {
  const language = await getPublicLanguage();
  const c = copy[language];

  return (
    <MarketingPageShell>
      <section className="about-hero">
        <div><span className="marketing-eyebrow">{c.eyebrow}</span><h1>{c.title}</h1><p>{c.intro}</p><div className="marketing-hero-actions"><Link href="/request-demo?source=about" className="marketing-start marketing-large">{c.demo}</Link><a href="mailto:mahir@hisabtech.com" className="marketing-demo marketing-large">{c.email}</a></div></div>
        <div className="about-fact-grid">{c.facts.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
      </section>

      <section className="about-mission-section"><div><span>{c.missionEyebrow}</span><h2>{c.missionTitle}</h2><p>{c.missionText}</p></div><div className="about-mission-mark"><img src="/hisab-logo.svg" alt="" width="150" height="150" className="hisab-logo"/><strong>HisabERP</strong><span>Business operating system</span></div></section>

      <section className="marketing-section about-principles-section"><div className="marketing-section-heading marketing-section-heading-wide"><span>{c.principlesEyebrow}</span><h2>{c.principlesTitle}</h2></div><div className="about-principles-grid">{c.principles.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section className="about-leadership-section"><div><span className="marketing-eyebrow">{c.leadershipEyebrow}</span><h2>{c.leadershipTitle}</h2><p>{c.founderText}</p></div><article><span className="about-founder-avatar">MA</span><div><strong>{c.founderName}</strong><small>{c.founderRole}</small><a href="mailto:mahir@hisabtech.com">mahir@hisabtech.com</a></div></article></section>

      <section className="marketing-section about-standards-section"><div className="marketing-section-heading"><span>{c.standardsEyebrow}</span><h2>{c.standardsTitle}</h2></div><div className="about-standards-grid">{c.standards.map((standard, index) => <article key={standard}><span>{String(index + 1).padStart(2, "0")}</span><strong>{standard}</strong></article>)}</div></section>

      <section className="marketing-cta marketing-cta-v2"><div><span>{c.contactEyebrow}</span><h2>{c.contactTitle}</h2><p>{c.contactText}</p></div><div><Link href="/request-demo?source=about" className="marketing-start marketing-large">{c.demo}</Link><Link href="/resources" className="marketing-demo marketing-large">{c.resources}</Link></div></section>
    </MarketingPageShell>
  );
}
