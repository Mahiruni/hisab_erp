const MAX_IMPORT_BYTES = 2_000_000;
const MAX_IMPORT_ROWS = 1000;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; continue; }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length)) rows.push(row);
      row = []; cell = ""; continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some((value) => value.length)) rows.push(row);
  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  return rows;
}

export async function rowsFromCsvUpload(value: FormDataEntryValue | null, requiredHeaders: string[]) {
  if (!(value instanceof File) || value.size === 0) throw new Error("Choose a CSV file to import.");
  if (value.size > MAX_IMPORT_BYTES) throw new Error("CSV imports are limited to 2 MB.");
  const rows = parseCsv((await value.text()).replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("The CSV must include a header and at least one data row.");
  if (rows.length - 1 > MAX_IMPORT_ROWS) throw new Error(`CSV imports are limited to ${MAX_IMPORT_ROWS} rows.`);
  const headers = rows[0].map(normalizeHeader);
  for (const required of requiredHeaders) if (!headers.includes(required)) throw new Error(`Missing required CSV column: ${required}`);
  return rows.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, (cells[index] || "").trim()])));
}
