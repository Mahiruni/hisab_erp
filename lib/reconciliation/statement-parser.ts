const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;

type NormalizedStatementRow = {
  transactionDate: string;
  transactionTime?: string;
  valueDate?: string;
  direction: "credit" | "debit";
  cashAmount: number;
  feeAmount: number;
  withholdingAmount: number;
  currency: string;
  providerTransactionId?: string;
  providerOrderId?: string;
  statementReference?: string;
  counterpartyName?: string;
  counterpartyPhone?: string;
  counterpartyAccountMasked?: string;
  narrative?: string;
  idempotencyKey?: string;
  raw: Record<string, string>;
};

const aliases = {
  transactionDate: ["transactiondate", "date", "postingdate", "bookingdate", "trxdate"],
  transactionTime: ["transactiontime", "time", "timestamp", "datetime"],
  valueDate: ["valuedate", "settlementdate"],
  direction: ["direction", "type", "transactiontype", "creditdebit", "drcr"],
  amount: ["amount", "transactionamount"],
  credit: ["credit", "deposit", "moneyin", "paidin"],
  debit: ["debit", "withdrawal", "moneyout", "paidout"],
  fee: ["fee", "fees", "charge", "charges", "commission"],
  withholding: ["withholding", "withholdingtax", "taxwithheld", "wht"],
  currency: ["currency", "ccy"],
  providerTransactionId: ["providertransactionid", "transactionid", "trxid", "receiptno", "receipt", "referenceid"],
  providerOrderId: ["providerorderid", "orderid", "merchantrequestid", "checkoutrequestid"],
  statementReference: ["statementreference", "reference", "ref", "paymentreference"],
  counterpartyName: ["counterpartyname", "name", "payer", "payee", "customer", "beneficiary"],
  counterpartyPhone: ["counterpartyphone", "phone", "msisdn", "mobilenumber"],
  counterpartyAccountMasked: ["counterpartyaccountmasked", "account", "accountnumber", "beneficiaryaccount"],
  narrative: ["narrative", "description", "details", "memo", "remark", "remarks"],
  idempotencyKey: ["idempotencykey", "uniquekey"],
} as const;

function canonical(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function detectDelimiter(line: string) {
  const candidates = [",", "\t", ";"];
  return candidates.sort((a, b) => line.split(b).length - line.split(a).length)[0];
}

function parseCsvRows(text: string) {
  const clean = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(clean.split(/\r?\n/, 1)[0] || "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    const next = clean[index + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (quoted) throw new Error("Statement CSV contains an unclosed quoted field.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function findHeader(headers: string[], keys: readonly string[]) {
  const normalized = headers.map(canonical);
  return normalized.findIndex((header) => keys.includes(header));
}

function parseNumber(value: string | undefined) {
  if (!value?.trim()) return 0;
  const normalized = value.replace(/[\s,]/g, "").replace(/^\((.*)\)$/, "-$1");
  const number = Number(normalized);
  if (!Number.isFinite(number)) return Number.NaN;
  return Math.abs(number);
}

function parseDate(value: string | undefined, lineNumber: number) {
  const text = value?.trim();
  if (!text) throw new Error(`Statement row ${lineNumber} is missing a transaction date.`);
  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const local = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (local) return `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Statement row ${lineNumber} has an invalid date.`);
  return parsed.toISOString().slice(0, 10);
}

function optionalValue(row: string[], index: number) {
  return index >= 0 ? row[index]?.trim() || undefined : undefined;
}

function directionFrom(row: string[], directionIndex: number, creditIndex: number, debitIndex: number, amountIndex: number, lineNumber: number) {
  const credit = parseNumber(optionalValue(row, creditIndex));
  const debit = parseNumber(optionalValue(row, debitIndex));
  if (Number.isFinite(credit) && credit > 0 && (!Number.isFinite(debit) || debit === 0)) return { direction: "credit" as const, amount: credit };
  if (Number.isFinite(debit) && debit > 0 && (!Number.isFinite(credit) || credit === 0)) return { direction: "debit" as const, amount: debit };
  const directionText = optionalValue(row, directionIndex)?.toLowerCase() || "";
  const amount = parseNumber(optionalValue(row, amountIndex));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(`Statement row ${lineNumber} requires a positive credit or debit amount.`);
  if (/credit|deposit|money.?in|paid.?in|cr\b/.test(directionText)) return { direction: "credit" as const, amount };
  if (/debit|withdraw|money.?out|paid.?out|dr\b/.test(directionText)) return { direction: "debit" as const, amount };
  const rawAmount = optionalValue(row, amountIndex) || "";
  if (/^-|^\(/.test(rawAmount.trim())) return { direction: "debit" as const, amount };
  throw new Error(`Statement row ${lineNumber} requires a recognizable transaction direction.`);
}

export async function parseStatementFile(file: File, defaultCurrency: string) {
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a non-empty CSV statement file.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Statement files must be 5 MB or smaller.");
  const filename = file.name.toLowerCase();
  if (!filename.endsWith(".csv") && !filename.endsWith(".tsv") && !filename.endsWith(".txt")) throw new Error("Upload a CSV, TSV or text statement export.");

  const bytes = await file.arrayBuffer();
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const csv = parseCsvRows(text);
  if (csv.length < 2) throw new Error("The statement must contain a header and at least one transaction row.");
  if (csv.length - 1 > MAX_ROWS) throw new Error(`Statement imports are limited to ${MAX_ROWS} rows.`);

  const headers = csv[0];
  const indexes = Object.fromEntries(Object.entries(aliases).map(([key, keys]) => [key, findHeader(headers, keys)])) as Record<keyof typeof aliases, number>;
  if (indexes.transactionDate < 0) throw new Error("The statement needs a transaction date column.");
  if (indexes.amount < 0 && indexes.credit < 0 && indexes.debit < 0) throw new Error("The statement needs amount, credit or debit columns.");

  const rows: NormalizedStatementRow[] = csv.slice(1).map((values, position) => {
    const lineNumber = position + 2;
    const raw = Object.fromEntries(headers.map((header, index) => [header || `column_${index + 1}`, values[index] || ""]));
    const movement = directionFrom(values, indexes.direction, indexes.credit, indexes.debit, indexes.amount, lineNumber);
    const feeAmount = parseNumber(optionalValue(values, indexes.fee));
    const withholdingAmount = parseNumber(optionalValue(values, indexes.withholding));
    if (!Number.isFinite(feeAmount) || !Number.isFinite(withholdingAmount)) throw new Error(`Statement row ${lineNumber} has an invalid fee or withholding amount.`);
    const currency = (optionalValue(values, indexes.currency) || defaultCurrency || "ETB").toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error(`Statement row ${lineNumber} has an invalid currency code.`);
    return {
      transactionDate: parseDate(optionalValue(values, indexes.transactionDate), lineNumber),
      transactionTime: optionalValue(values, indexes.transactionTime),
      valueDate: optionalValue(values, indexes.valueDate) ? parseDate(optionalValue(values, indexes.valueDate), lineNumber) : undefined,
      direction: movement.direction,
      cashAmount: movement.amount,
      feeAmount,
      withholdingAmount,
      currency,
      providerTransactionId: optionalValue(values, indexes.providerTransactionId),
      providerOrderId: optionalValue(values, indexes.providerOrderId),
      statementReference: optionalValue(values, indexes.statementReference),
      counterpartyName: optionalValue(values, indexes.counterpartyName),
      counterpartyPhone: optionalValue(values, indexes.counterpartyPhone),
      counterpartyAccountMasked: optionalValue(values, indexes.counterpartyAccountMasked),
      narrative: optionalValue(values, indexes.narrative),
      idempotencyKey: optionalValue(values, indexes.idempotencyKey),
      raw,
    };
  });

  const fileHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return { filename: file.name.slice(0, 240), fileHash, rows };
}
