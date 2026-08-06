const phraseEntries: Array<[string, string]> = [
  ["Request a focused demo", "የተመረጠ ማሳያ ይጠይቁ"],
  ["Request a demo", "ማሳያ ይጠይቁ"],
  ["Start free", "በነፃ ይጀምሩ"],
  ["Create an account", "መለያ ይፍጠሩ"],
  ["Product tour", "የምርት ማሳያ"],
  ["Interactive product tour", "ተግባራዊ የምርት ማሳያ"],
  ["Explore the product", "ምርቱን ይመልከቱ"],
  ["View complete pricing", "ሙሉ የዋጋ ዝርዝር ይመልከቱ"],
  ["Business operating system", "የንግድ ማስኬጃ ስርዓት"],
  ["Built for Ethiopia", "ለኢትዮጵያ የተገነባ"],
  ["ERP built for Ethiopia", "ለኢትዮጵያ የተገነባ ERP"],
  ["Industry solutions", "የኢንዱስትሪ መፍትሄዎች"],
  ["Customer proof", "የደንበኛ ማስረጃ"],
  ["Trust Center", "የእምነት ማዕከል"],
  ["Help Center", "የእገዛ ማዕከል"],
  ["Data migration and onboarding", "የመረጃ ሽግግር እና ማስጀመር"],
  ["Compare plan details", "የፕላን ዝርዝሮችን ያወዳድሩ"],
  ["Open the complete product tour", "ሙሉውን የምርት ማሳያ ይክፈቱ"],
  ["See how daily activity becomes management insight", "ዕለታዊ ሥራ ወደ የአስተዳደር ግንዛቤ እንዴት እንደሚቀየር ይመልከቱ"],
  ["Connected product modules", "የተገናኙ የምርት ሞጁሎች"],
  ["Transparent ETB pricing", "ግልጽ የኢትዮጵያ ብር ዋጋ"],
  ["Implementation journey", "የትግበራ ጉዞ"],
  ["Why businesses choose HisabERP", "ንግዶች HisabERPን ለምን ይመርጣሉ"],
  ["From activity to action", "ከእንቅስቃሴ ወደ እርምጃ"],
  ["Needs attention", "ትኩረት የሚፈልግ"],
  ["Management summary", "የአስተዳደር ማጠቃለያ"],
  ["Updated now", "አሁን ተዘምኗል"],
  ["Monthly", "ወርሃዊ"],
  ["Annual", "ዓመታዊ"],
  ["Custom pricing", "በልዩ ጥያቄ የሚወሰን ዋጋ"],
  ["Available", "ዝግጁ"],
  ["Configuration required", "ማዋቀር ያስፈልጋል"],
  ["Planned", "በዕቅድ ላይ"],
  ["Beta", "የሙከራ ደረጃ"],
  ["Implemented", "ተተግብሯል"],
  ["Operational process", "የአሰራር ሂደት"],
  ["Platform upgrade required", "የመድረክ ማሻሻያ ያስፈልጋል"],
  ["Security contact", "የደህንነት ግንኙነት"],
  ["Sign in", "ይግቡ"],
  ["Return to website", "ወደ ድር ጣቢያው ይመለሱ"],
  ["Submit demo request", "የማሳያ ጥያቄውን ይላኩ"],
  ["Tell us about your business", "ስለ ንግድዎ ይንገሩን"],
  ["Preferred contact method", "የሚመረጥ የግንኙነት መንገድ"],
  ["Full name", "ሙሉ ስም"],
  ["Business email", "የንግድ ኢሜይል"],
  ["Phone number", "ስልክ ቁጥር"],
  ["Business type", "የንግድ ዓይነት"],
  ["Team size", "የቡድን መጠን"],
  ["What would you like to improve?", "ምን ማሻሻል ይፈልጋሉ?"],
  ["Request received", "ጥያቄው ደርሷል"],
  ["Thank you", "እናመሰግናለን"],
  ["All rights reserved", "መብቶቹ ሁሉ የተጠበቁ ናቸው"],
];

const wordMap: Record<string, string> = {
  a: "አንድ", about: "ስለ", access: "መዳረሻ", account: "መለያ", accurate: "ትክክለኛ", action: "እርምጃ", active: "ንቁ", activity: "እንቅስቃሴ", add: "ጨምር", advanced: "የላቀ", after: "በኋላ", all: "ሁሉ", allow: "ፍቀድ", already: "አስቀድሞ", amharic: "አማርኛ", amount: "መጠን", analytics: "ትንታኔ", and: "እና", annual: "ዓመታዊ", application: "መተግበሪያ", approval: "ማጽደቅ", approvals: "ማጽደቆች", available: "ዝግጁ", balance: "ቀሪ ሂሳብ", balances: "ቀሪ ሂሳቦች", bank: "ባንክ", before: "በፊት", better: "የተሻለ", billing: "ክፍያ", branch: "ቅርንጫፍ", branches: "ቅርንጫፎች", build: "ገንባ", business: "ንግድ", businesses: "ንግዶች", button: "አዝራር", by: "በ", cash: "ጥሬ ገንዘብ", category: "ምድብ", center: "ማዕከል", change: "ለውጥ", choose: "ይምረጡ", clear: "ግልጽ", clearer: "የበለጠ ግልጽ", close: "ዝጋ", cloud: "ደመና", company: "ኩባንያ", compare: "አወዳድር", complete: "ሙሉ", completed: "ተጠናቋል", configuration: "ማዋቀር", connected: "የተገናኘ", contact: "ግንኙነት", control: "ቁጥጥር", controlled: "ቁጥጥር ያለው", controls: "ቁጥጥሮች", create: "ፍጠር", customer: "ደንበኛ", customers: "ደንበኞች", daily: "ዕለታዊ", dashboard: "ዳሽቦርድ", data: "መረጃ", date: "ቀን", decision: "ውሳኔ", decisions: "ውሳኔዎች", demo: "ማሳያ", description: "መግለጫ", details: "ዝርዝሮች", digital: "ዲጂታል", directory: "ማውጫ", document: "ሰነድ", download: "አውርድ", email: "ኢሜይል", english: "እንግሊዝኛ", enterprise: "ትልቅ ድርጅት", evidence: "ማስረጃ", expense: "ወጪ", expenses: "ወጪዎች", explore: "ይመልከቱ", export: "ወደ ፋይል አውጣ", finance: "ፋይናንስ", financial: "የፋይናንስ", for: "ለ", free: "ነፃ", from: "ከ", full: "ሙሉ", get: "ያግኙ", getting: "ማግኘት", growth: "እድገት", guide: "መመሪያ", guidance: "መመሪያ", help: "እገዛ", hisab: "ሂሳብ", how: "እንዴት", implementation: "ትግበራ", improve: "ማሻሻል", in: "ውስጥ", included: "የተካተተ", information: "መረጃ", insight: "ግንዛቤ", integration: "ውህደት", integrations: "ውህደቶች", inventory: "ክምችት", invoice: "ደረሰኝ", invoices: "ደረሰኞች", journey: "ጉዞ", language: "ቋንቋ", launch: "ማስጀመር", learn: "ይማሩ", learning: "ትምህርት", local: "አካባቢያዊ", login: "መግቢያ", management: "አስተዳደር", manage: "አስተዳድር", migration: "ሽግግር", mobile: "ሞባይል", module: "ሞጁል", modules: "ሞጁሎች", monthly: "ወርሃዊ", more: "ተጨማሪ", multilingual: "ብዙ ቋንቋ", new: "አዲስ", next: "ቀጣይ", no: "አይ", of: "የ", on: "ላይ", onboarding: "ማስጀመሪያ", one: "አንድ", open: "ክፈት", operations: "አሰራር", organization: "ድርጅት", organizations: "ድርጅቶች", our: "የእኛ", overview: "አጠቃላይ እይታ", password: "የይለፍ ቃል", payment: "ክፍያ", payments: "ክፍያዎች", people: "ሰዎች", plan: "ፕላን", planned: "በዕቅድ ላይ", platform: "መድረክ", pricing: "ዋጋ", process: "ሂደት", product: "ምርት", products: "ምርቶች", professional: "ሙያዊ", ready: "ዝግጁ", real: "እውነተኛ", reconciliation: "ማስታረቅ", record: "መዝገብ", records: "መዝገቦች", report: "ሪፖርት", reporting: "ሪፖርት", reports: "ሪፖርቶች", required: "ያስፈልጋል", resources: "ምንጮች", review: "ግምገማ", role: "ሚና", sales: "ሽያጭ", secure: "ደህንነቱ የተጠበቀ", security: "ደህንነት", see: "ይመልከቱ", select: "ይምረጡ", service: "አገልግሎት", services: "አገልግሎቶች", setup: "ማዋቀር", sign: "ይግቡ", small: "አነስተኛ", software: "ሶፍትዌር", start: "ይጀምሩ", status: "ሁኔታ", stock: "ክምችት", supplier: "አቅራቢ", suppliers: "አቅራቢዎች", support: "ድጋፍ", system: "ስርዓት", team: "ቡድን", the: "", this: "ይህ", to: "ወደ", today: "ዛሬ", tools: "መሳሪያዎች", tour: "ማሳያ", transaction: "ግብይት", transactions: "ግብይቶች", transparent: "ግልጽ", trust: "እምነት", update: "አዘምን", user: "ተጠቃሚ", users: "ተጠቃሚዎች", view: "ይመልከቱ", website: "ድር ጣቢያ", what: "ምን", when: "መቼ", with: "ጋር", workflow: "የሥራ ሂደት", workflows: "የሥራ ሂደቶች", workspace: "የሥራ ቦታ", your: "የእርስዎ"
};

const protectedTokens = new Set(["HisabERP", "HisabTech", "ERP", "ETB", "CSV", "API", "MFA", "OAuth", "Supabase", "telebirr", "M-PESA", "Google", "Apple", "WhatsApp", "Excel"]);

function replacePhrases(source: string) {
  let result = source;
  for (const [english, amharic] of phraseEntries.sort((a, b) => b[0].length - a[0].length)) {
    result = result.replace(new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), amharic);
  }
  return result;
}

export function translateUnknownAmharic(source: string) {
  if (!/[A-Za-z]/.test(source)) return source;
  const phraseTranslated = replacePhrases(source);
  return phraseTranslated.replace(/[A-Za-z][A-Za-z’'-]*/g, (word) => {
    if (protectedTokens.has(word)) return word;
    return wordMap[word.toLowerCase()] ?? word;
  }).replace(/\s{2,}/g, " ").trim();
}
