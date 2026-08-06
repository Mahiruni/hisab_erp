import type { LocalizedText } from "./public-localization";

export type ResourceSection = {
  heading: LocalizedText;
  paragraphs: LocalizedText[];
  checklist?: LocalizedText[];
};

export type MarketingResource = {
  slug: string;
  category: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  audience: LocalizedText;
  readingMinutes: number;
  published: string;
  sections: ResourceSection[];
};

export const marketingResources: MarketingResource[] = [
  {
    slug: "move-from-excel-to-erp",
    category: { en: "Digital operations", am: "ዲጂታል አሰራር" },
    title: { en: "How to move from Excel to ERP without losing control", am: "ቁጥጥርን ሳያጡ ከExcel ወደ ERP እንዴት መሸጋገር ይቻላል" },
    summary: { en: "A practical sequence for cleaning records, agreeing opening balances, testing imports and controlling cutover.", am: "መዝገቦችን ለማጽዳት፣ የመክፈቻ ቀሪ ሂሳቦችን ለማስማማት፣ ማስገባትን ለመፈተሽ እና ሽግግሩን ለመቆጣጠር ተግባራዊ ቅደም ተከተል።" },
    audience: { en: "Owners, finance teams and implementation leads", am: "ባለቤቶች፣ የፋይናንስ ቡድኖች እና የትግበራ መሪዎች" },
    readingMinutes: 7,
    published: "2026-07-22",
    sections: [
      {
        heading: { en: "Start with the business truth", am: "ከንግዱ እውነተኛ መረጃ ይጀምሩ" },
        paragraphs: [
          { en: "Do not begin by importing every spreadsheet. First decide which customer, supplier, product, stock and opening-balance records are authoritative.", am: "ሁሉንም ስፕሬድሺት በማስገባት አይጀምሩ። በመጀመሪያ የትኞቹ የደንበኛ፣ የአቅራቢ፣ የምርት፣ የክምችት እና የመክፈቻ ቀሪ መዝገቦች ዋና ምንጭ እንደሆኑ ይወስኑ።" },
          { en: "Assign one named business owner to approve each data group. Technical success is not enough; the business must confirm that balances and record counts are correct.", am: "ለእያንዳንዱ የመረጃ ቡድን ፈቃድ የሚሰጥ አንድ የተሰየመ የንግድ ኃላፊ ይመድቡ። ቴክኒካዊ ስኬት ብቻ በቂ አይደለም፤ ንግዱ ቀሪ ሂሳቦችና የመዝገብ ብዛት ትክክል መሆናቸውን ማረጋገጥ አለበት።" }
        ]
      },
      {
        heading: { en: "Use a controlled migration cycle", am: "ቁጥጥር ያለው የሽግግር ዙር ይጠቀሙ" },
        paragraphs: [{ en: "Prepare, dry-run, reconcile, correct and repeat. Only schedule the final cutover after the same templates import cleanly and the business signs off the results.", am: "ያዘጋጁ፣ የሙከራ ማስገባት ያድርጉ፣ ያስታርቁ፣ ያስተካክሉ እና ይድገሙ። ተመሳሳይ ቴምፕሌቶች ያለ ችግር ከገቡ እና ንግዱ ውጤቱን ካጸደቀ በኋላ ብቻ የመጨረሻ ሽግግሩን ያቅዱ።" }],
        checklist: [
          { en: "Freeze the agreed source files", am: "የተስማሙባቸውን ምንጭ ፋይሎች ይቆልፉ" },
          { en: "Reconcile customer and supplier totals", am: "የደንበኛና የአቅራቢ ድምሮችን ያስታርቁ" },
          { en: "Validate stock quantities and valuation assumptions", am: "የክምችት ብዛትና የዋጋ ግምት መሠረቶችን ያረጋግጡ" },
          { en: "Record the person who approved each result", am: "እያንዳንዱን ውጤት ያጸደቀውን ሰው ይመዝግቡ" }
        ]
      }
    ]
  },
  {
    slug: "improve-cash-flow-visibility",
    category: { en: "Cash flow", am: "የገንዘብ ፍሰት" },
    title: { en: "How to improve cash-flow visibility every week", am: "በየሳምንቱ የገንዘብ ፍሰት ግልጽነትን እንዴት ማሻሻል ይቻላል" },
    summary: { en: "Build a repeatable review of cash, receivables, payables and upcoming commitments.", am: "ጥሬ ገንዘብ፣ ተሰብሳቢ፣ ተከፋይ እና መጪ ግዴታዎችን የሚያካትት ተደጋጋሚ ግምገማ ይገንቡ።" },
    audience: { en: "Owners and finance managers", am: "ባለቤቶች እና የፋይናንስ ኃላፊዎች" },
    readingMinutes: 5,
    published: "2026-07-22",
    sections: [
      { heading: { en: "Separate balance from availability", am: "ቀሪ ሂሳብን ከእውነተኛ አጠቃቀም ይለዩ" }, paragraphs: [{ en: "A bank balance does not show unpaid supplier bills, overdue customer invoices or payroll that is due soon. Review all four together.", am: "የባንክ ቀሪ ሂሳብ ያልተከፈሉ የአቅራቢ ደረሰኞችን፣ ያለፈባቸው የደንበኛ ደረሰኞችን ወይም በቅርቡ የሚከፈል ደመወዝን አያሳይም። አራቱንም በአንድነት ይገምግሙ።" }] },
      { heading: { en: "Run one weekly cash meeting", am: "አንድ ሳምንታዊ የገንዘብ ስብሰባ ያድርጉ" }, paragraphs: [{ en: "Use the same day, the same reports and the same action owners. Record who will collect, who will approve payments and which commitments can wait.", am: "ተመሳሳይ ቀን፣ ተመሳሳይ ሪፖርቶች እና ተመሳሳይ የተግባር ኃላፊዎችን ይጠቀሙ። ማን እንደሚሰበስብ፣ ማን ክፍያን እንደሚያጸድቅ እና የትኞቹ ግዴታዎች ሊጠብቁ እንደሚችሉ ይመዝግቡ።" }] }
    ]
  },
  {
    slug: "control-customer-debt",
    category: { en: "Receivables", am: "ተሰብሳቢ ሂሳብ" },
    title: { en: "A practical system for controlling customer debt", am: "የደንበኛ ዕዳን ለመቆጣጠር ተግባራዊ ስርዓት" },
    summary: { en: "Turn credit limits, due dates, follow-up ownership and collection evidence into one operating routine.", am: "የብድር ገደብ፣ የመክፈያ ቀን፣ የክትትል ኃላፊነት እና የስብስብ ማስረጃን ወደ አንድ የሥራ ልማድ ይቀይሩ።" },
    audience: { en: "Sales, finance and business owners", am: "ሽያጭ፣ ፋይናንስ እና የንግድ ባለቤቶች" },
    readingMinutes: 6,
    published: "2026-07-22",
    sections: [
      { heading: { en: "Set rules before the sale", am: "ከሽያጭ በፊት ደንቦችን ያዘጋጁ" }, paragraphs: [{ en: "Define who may approve credit, the maximum balance, standard payment terms and the action taken when an account becomes overdue.", am: "ብድርን ማን ማጽደቅ እንደሚችል፣ ከፍተኛውን ቀሪ ሂሳብ፣ መደበኛ የክፍያ ጊዜ እና ሂሳቡ ሲያልፍ የሚወሰደውን እርምጃ ይወስኑ።" }] },
      { heading: { en: "Make every follow-up visible", am: "እያንዳንዱን ክትትል ግልጽ ያድርጉ" }, paragraphs: [{ en: "A collection process is stronger when calls, promises, partial payments and disputes are recorded against the customer account instead of living in private messages.", am: "ጥሪዎች፣ የክፍያ ቃል ኪዳኖች፣ ከፊል ክፍያዎች እና ክርክሮች በግል መልዕክት ውስጥ ከመቆየት ይልቅ በደንበኛው ሂሳብ ላይ ሲመዘገቡ የስብስብ ሂደቱ ይጠናከራል።" }] }
    ]
  },
  {
    slug: "inventory-accuracy-routine",
    category: { en: "Inventory", am: "ክምችት" },
    title: { en: "The operating routine behind accurate inventory", am: "ትክክለኛ ክምችት የሚፈጥረው የሥራ ልማድ" },
    summary: { en: "Improve stock accuracy through controlled receipts, issues, adjustments and cycle counts.", am: "ቁጥጥር ያለው ገቢ፣ ወጪ፣ ማስተካከያ እና ዙር ቆጠራ በመጠቀም የክምችት ትክክለኛነትን ያሻሽሉ።" },
    audience: { en: "Storekeepers, operations and finance teams", am: "የመጋዘን ኃላፊዎች፣ ኦፕሬሽን እና ፋይናንስ ቡድኖች" },
    readingMinutes: 6,
    published: "2026-07-22",
    sections: [
      { heading: { en: "Record movement when it happens", am: "እንቅስቃሴውን በሚከሰትበት ጊዜ ይመዝግቡ" }, paragraphs: [{ en: "Delayed stock entry creates a gap between the physical shelf and the system. Design receiving and issuing steps that can be completed at the point of work.", am: "የዘገየ የክምችት መመዝገብ በእውነተኛው መደርደሪያ እና በስርዓቱ መካከል ልዩነት ይፈጥራል። በሥራው ቦታ ላይ ሊጠናቀቁ የሚችሉ የመቀበያና የማውጫ ደረጃዎችን ይንደፉ።" }] },
      { heading: { en: "Count by risk, not only by calendar", am: "በቀን መቁጠሪያ ብቻ ሳይሆን በአደጋ ደረጃ ይቁጠሩ" }, paragraphs: [{ en: "Count fast-moving, high-value and frequently adjusted items more often. Investigate repeated differences instead of treating every adjustment as normal.", am: "ፈጣን የሚንቀሳቀሱ፣ ከፍተኛ ዋጋ ያላቸው እና ብዙ ጊዜ የሚስተካከሉ ዕቃዎችን በተደጋጋሚ ይቁጠሩ። እያንዳንዱን ማስተካከያ መደበኛ ነው ብለው ከመውሰድ ይልቅ ተደጋጋሚ ልዩነቶችን ይመርምሩ።" }] }
    ]
  },
  {
    slug: "monthly-close-checklist",
    category: { en: "Finance operations", am: "የፋይናንስ አሰራር" },
    title: { en: "A small-business monthly close checklist", am: "ለአነስተኛ ንግድ የወር መዝጊያ ማረጋገጫ ዝርዝር" },
    summary: { en: "Close each month with reconciled cash, reviewed balances and documented exceptions.", am: "እያንዳንዱን ወር በተስተካከለ ጥሬ ገንዘብ፣ በተገመገመ ቀሪ ሂሳብ እና በተመዘገቡ ልዩነቶች ይዝጉ።" },
    audience: { en: "Accountants and business owners", am: "የሂሳብ ባለሙያዎች እና የንግድ ባለቤቶች" },
    readingMinutes: 5,
    published: "2026-07-22",
    sections: [
      { heading: { en: "Reconcile before reporting", am: "ከሪፖርት በፊት ያስታርቁ" }, paragraphs: [{ en: "Confirm bank, mobile-money and cash balances before using profit or cash-flow reports for management decisions.", am: "ለአስተዳደር ውሳኔ የትርፍ ወይም የገንዘብ ፍሰት ሪፖርት ከመጠቀምዎ በፊት የባንክ፣ የሞባይል ገንዘብ እና የጥሬ ገንዘብ ቀሪ ሂሳቦችን ያረጋግጡ።" }] },
      { heading: { en: "Document every unresolved item", am: "ያልተፈታ እያንዳንዱን ጉዳይ ይመዝግቡ" }, paragraphs: [{ en: "A close can proceed with known exceptions when each item has an owner, amount, reason and due date. Unknown differences should stop the close.", am: "እያንዳንዱ ጉዳይ ኃላፊ፣ መጠን፣ ምክንያት እና የመጨረሻ ቀን ካለው የታወቁ ልዩነቶች ጋር መዝጊያው ሊቀጥል ይችላል። ያልታወቁ ልዩነቶች መዝጊያውን ማቆም አለባቸው።" }] }
    ]
  },
  {
    slug: "choose-erp-for-ethiopian-business",
    category: { en: "ERP selection", am: "ERP ምርጫ" },
    title: { en: "How to evaluate ERP software for an Ethiopian business", am: "ለኢትዮጵያ ንግድ ERP ሶፍትዌርን እንዴት መገምገም ይቻላል" },
    summary: { en: "A decision framework covering workflow fit, implementation effort, localization, security and total operating cost.", am: "የሥራ ሂደት ተስማሚነት፣ የትግበራ ጥረት፣ አካባቢያዊነት፣ ደህንነት እና አጠቃላይ የሥራ ወጪን የሚያካትት የውሳኔ መስፈርት።" },
    audience: { en: "Owners, executives and project sponsors", am: "ባለቤቶች፣ ከፍተኛ አመራሮች እና የፕሮጀክት ደጋፊዎች" },
    readingMinutes: 8,
    published: "2026-07-22",
    sections: [
      { heading: { en: "Evaluate the operating model, not the feature count", am: "የባህሪ ብዛትን ሳይሆን የሥራ ሞዴሉን ይገምግሙ" }, paragraphs: [{ en: "Ask vendors to demonstrate your real sales, purchasing, inventory, cash and approval scenarios. A long feature list does not prove that daily work will become clearer.", am: "አቅራቢዎች እውነተኛ የሽያጭ፣ የግዢ፣ የክምችት፣ የገንዘብ እና የማጽደቅ ሁኔታዎችዎን እንዲያሳዩ ይጠይቁ። ረጅም የባህሪ ዝርዝር ዕለታዊ ሥራ ግልጽ እንደሚሆን አያረጋግጥም።" }] },
      { heading: { en: "Price the implementation, not only the subscription", am: "የደንበኝነት ክፍያን ብቻ ሳይሆን ትግበራውንም ዋጋ ይስጡ" }, paragraphs: [{ en: "Include data preparation, configuration, training, integrations, internal staff time, support and the cost of operating two systems during transition.", am: "የመረጃ ዝግጅት፣ ማዋቀር፣ ስልጠና፣ ውህደቶች፣ የውስጥ ሰራተኞች ጊዜ፣ ድጋፍ እና በሽግግር ጊዜ ሁለት ስርዓቶችን የማስኬድ ወጪን ያካትቱ።" }] }
    ]
  }
];

export function getMarketingResource(slug: string) {
  return marketingResources.find((article) => article.slug === slug);
}
