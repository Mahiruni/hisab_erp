import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

export async function GET() {
  const filePath = path.join(process.cwd(), "hisab-erp-enterprise-v9-9-9-2.html");
  try {
    const source = await readFile(filePath, "utf8");
    const warning = `<div class="legacy-warning" role="alert"><span><strong>Legacy demonstration:</strong> do not enter real company, employee, tax, banking or accounting data. Information on this screen is stored in this browser and is not the production database.</span><a href="/">Open secure Next.js app →</a></div>`;
    const html = source.includes("</body>") ? source.replace("</body>", `${warning}</body>`) : `${warning}${source}`;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate", "X-Robots-Tag": "noindex, nofollow, noarchive" } });
  } catch {
    return new Response("Hisab ERP legacy source file was not found.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
