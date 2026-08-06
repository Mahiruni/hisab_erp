export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.info(JSON.stringify({ level: "info", event: "hisab-erp.started", timestamp: new Date().toISOString(), commit: process.env.VERCEL_GIT_COMMIT_SHA || "local" }));
  }
}
