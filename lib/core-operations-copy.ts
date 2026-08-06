import type { Language } from "./translations";

export const coreOperationsCopy = {
  en: {
    overview: "Overview", suppliers: "Suppliers", requests: "Requests", quotes: "Supplier quotes", orders: "Purchase orders", receipts: "Goods receipts", bills: "Supplier bills", returns: "Purchase returns",
    products: "Products", transfers: "Transfers", counts: "Stock counts", adjustments: "Adjustments", tracking: "Lots & serials",
    employees: "Employees", attendance: "Attendance", leave: "Leave", payroll: "Payroll",
    live: "Live and secured", newRecord: "New record", save: "Save and continue", update: "Update", approve: "Approve", reject: "Reject", convert: "Convert", complete: "Complete", post: "Post", pay: "Record payment", submit: "Submit", noRecords: "No records yet", actions: "Actions", status: "Status", amount: "Amount", date: "Date", notes: "Notes", total: "Total", due: "Due", quantity: "Quantity", product: "Product", warehouse: "Warehouse", supplier: "Supplier", employee: "Employee", reference: "Reference", description: "Description", addLine: "Add line", remove: "Remove", readOnly: "Your role has read-only access to this workflow.", configurableNotice: "Payroll rates are configurable. Obtain professional review before using them for statutory filing.",
  },
  am: {
    overview: "አጠቃላይ", suppliers: "አቅራቢዎች", requests: "የግዢ ጥያቄዎች", quotes: "የአቅራቢ ዋጋ ማቅረቢያ", orders: "የግዢ ትዕዛዞች", receipts: "ዕቃ መቀበያ", bills: "የአቅራቢ ሂሳቦች", returns: "የግዢ መመለሻ",
    products: "ምርቶች", transfers: "የመጋዘን ዝውውር", counts: "የእቃ ቆጠራ", adjustments: "ማስተካከያ", tracking: "ሎት እና ሲሪያል",
    employees: "ሰራተኞች", attendance: "መገኘት", leave: "ፈቃድ", payroll: "ደመወዝ",
    live: "ቀጥታ እና የተጠበቀ", newRecord: "አዲስ መዝገብ", save: "አስቀምጥ እና ቀጥል", update: "አዘምን", approve: "አጽድቅ", reject: "ውድቅ አድርግ", convert: "ቀይር", complete: "አጠናቅቅ", post: "መዝግብ", pay: "ክፍያ መዝግብ", submit: "ላክ", noRecords: "እስካሁን መዝገብ የለም", actions: "ተግባሮች", status: "ሁኔታ", amount: "መጠን", date: "ቀን", notes: "ማስታወሻ", total: "ጠቅላላ", due: "የመክፈያ ቀን", quantity: "ብዛት", product: "ምርት", warehouse: "መጋዘን", supplier: "አቅራቢ", employee: "ሰራተኛ", reference: "ማጣቀሻ", description: "መግለጫ", addLine: "መስመር ጨምር", remove: "አስወግድ", readOnly: "የእርስዎ ሚና ለዚህ ሂደት የማንበብ ፈቃድ ብቻ አለው።", configurableNotice: "የደመወዝ ተመኖች ሊዋቀሩ ይችላሉ። ለህጋዊ ሪፖርት ከመጠቀምዎ በፊት የባለሙያ ምርመራ ያድርጉ።",
  },
  ti: {
    overview: "ሓፈሻዊ", suppliers: "ኣቕረብቲ", requests: "ሕቶ ዕድጊ", quotes: "ዋጋ ኣቕራቢ", orders: "ትእዛዝ ዕድጊ", receipts: "ቅብሊት ንብረት", bills: "ሕሳብ ኣቕራቢ", returns: "ምምላስ ዕድጊ",
    products: "ፍርያት", transfers: "ዝውውር መኽዘን", counts: "ቆጸራ ንብረት", adjustments: "ምትዕርራይ", tracking: "ሎትን ሴሪያልን",
    employees: "ሰራሕተኛታት", attendance: "ምምጻእ", leave: "ፍቓድ", payroll: "ደሞዝ",
    live: "ቀጥታን ውሑስን", newRecord: "ሓድሽ መዝገብ", save: "ዓቅብን ቀጽልን", update: "ኣሐድስ", approve: "ኣጽድቕ", reject: "ንጸግ", convert: "ቀይር", complete: "ዛዝም", post: "መዝግብ", pay: "ክፍሊት መዝግብ", submit: "ስደድ", noRecords: "ክሳብ ሕጂ መዝገብ የለን", actions: "ተግባራት", status: "ኩነታት", amount: "መጠን", date: "ዕለት", notes: "መዘኻኸሪ", total: "ድምር", due: "ግዜ ክፍሊት", quantity: "ብዝሒ", product: "ፍርያት", warehouse: "መኽዘን", supplier: "ኣቕራቢ", employee: "ሰራሕተኛ", reference: "መወከሲ", description: "መግለጺ", addLine: "መስመር ወስኽ", remove: "ኣውጽእ", readOnly: "ተራኻ ነዚ መስርሕ ንምንባብ ጥራይ ይፈቅድ።", configurableNotice: "መጠን ደሞዝ ክዋቀር ይኽእል። ንሕጋዊ ሪፖርት ቅድሚ ምጥቃም ሞያዊ ግምገማ ይግበሩ።",
  },
} as const;

const translatedValues: Record<Language, Record<string, string>> = {
  en: {},
  am: { draft: "ረቂቅ", submitted: "ተልኳል", approved: "ጸድቋል", rejected: "ውድቅ", converted: "ተቀይሯል", received: "ተቀብሏል", billed: "ሂሳብ ተይዟል", posted: "ተመዝግቧል", paid: "ተከፍሏል", partially_paid: "በከፊል ተከፍሏል", completed: "ተጠናቋል", in_progress: "በሂደት ላይ", active: "ንቁ", on_leave: "በፈቃድ", present: "ተገኝቷል", absent: "ቀርቷል", late: "ዘግይቷል", annual: "ዓመታዊ", sick: "የህመም", increase: "ጭማሪ", decrease: "ቅናሽ" },
  ti: { draft: "ንድፊ", submitted: "ተላኢኹ", approved: "ጸዲቑ", rejected: "ተነጺጉ", converted: "ተቐይሩ", received: "ተቐቢሉ", billed: "ሕሳብ ተመዝጊቡ", posted: "ተመዝጊቡ", paid: "ተኸፊሉ", partially_paid: "ብኸፊል ተኸፊሉ", completed: "ተዛዚሙ", in_progress: "ኣብ መስርሕ", active: "ንጡፍ", on_leave: "ኣብ ፍቓድ", present: "ተረኺቡ", absent: "ቀሪዩ", late: "ደንጉዩ", annual: "ዓመታዊ", sick: "ሕማም", increase: "ወሰኽ", decrease: "ንክያት" },
};

export function operationValue(value: string, language: Language) {
  return translatedValues[language][value] || value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}