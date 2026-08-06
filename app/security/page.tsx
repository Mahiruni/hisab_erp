import Link from "next/link";
import { MfaSecurityPanel } from "../../components/mfa-security-panel";
import { acknowledgeSecurityAlertAction, recordBackupEvidenceAction, recordRestoreTestAction, runDatabaseHealthAction, updateProductionControlsAction } from "../../lib/actions/production-controls";
import { getCurrentUserContext } from "../../lib/data/context";
import { getProductionControlSnapshot } from "../../lib/data/setup";

export const metadata = { title: "Production Controls" };
export const dynamic = "force-dynamic";

function dateTimeLocalNow() {
  return new Date().toISOString().slice(0, 16);
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not recorded";
}

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const [context, query] = await Promise.all([getCurrentUserContext({ required: true }), searchParams]);
  if (!context) return null;
  if (!context.mfaRequired) {
    return <main className="controls-page"><section className="controls-empty"><h1>Administrator access required</h1><p>Production controls are available to organization owners and administrators.</p><Link href="/" className="primary action-link">Return to dashboard</Link></section></main>;
  }
  if (context.aal !== "aal2") {
    return <main className="controls-page"><header className="controls-hero"><div><p className="eyebrow">PRODUCTION CONTROL CENTER</p><h1>Verify your administrator session</h1><p>Strong authentication is required before security and continuity controls can be viewed or changed.</p></div></header><MfaSecurityPanel organizationId={context.organizationId} required initialAal={context.aal} /></main>;
  }

  const snapshot = await getProductionControlSnapshot();
  if (!snapshot) return null;
  const { settings, mfa, alerts, health } = snapshot;
  const backupFresh = Boolean(settings.last_backup_at && Date.now() - new Date(settings.last_backup_at).getTime() < 36 * 60 * 60 * 1000);
  const restoreFresh = Boolean(settings.last_restore_test_at && Date.now() - new Date(settings.last_restore_test_at).getTime() < 120 * 86_400_000 && settings.restore_test_status === "passed");
  const readyControls = [mfa.requiredAdmins > 0 && mfa.requiredAdmins === mfa.verifiedAdmins, true, snapshot.monitoringConfigured, backupFresh, settings.pitr_enabled, settings.login_alerts_enabled && settings.financial_alerts_enabled, settings.audit_export_enabled, health?.status === "healthy"].filter(Boolean).length;

  return (
    <main className="controls-page">
      <header className="controls-hero">
        <div><p className="eyebrow">PRODUCTION CONTROL CENTER</p><h1>Serious production controls</h1><p>Protect privileged access, detect risky activity, verify database integrity and keep evidence for backup and recovery operations.</p></div>
        <div className="controls-score"><strong>{readyControls}/8</strong><span>controls ready</span><small>{health?.status || "not checked"} database status</small></div>
      </header>

      {query.success ? <p className="setup-flash success">{query.success}</p> : null}
      {query.error ? <p className="setup-flash error">{query.error}</p> : null}

      <section className="controls-kpis">
        <article><span>Admin MFA</span><strong>{mfa.verifiedAdmins}/{mfa.requiredAdmins}</strong><small>verified administrators</small></article>
        <article><span>Open alerts</span><strong>{alerts.filter((alert) => alert.status === "open").length}</strong><small>require review</small></article>
        <article><span>Business audit</span><strong>{snapshot.auditCounts.business}</strong><small>immutable events</small></article>
        <article><span>Auth audit</span><strong>{snapshot.auditCounts.authentication}</strong><small>identity events</small></article>
      </section>

      <section className="controls-grid">
        <article className="control-card">
          <div className="control-card-head"><div><span>01</span><h2>Administrator MFA</h2></div><b className={mfa.requiredAdmins === mfa.verifiedAdmins ? "ready" : "critical"}>{mfa.requiredAdmins === mfa.verifiedAdmins ? "Enforced" : "Action needed"}</b></div>
          <p>Owner and administrator mutations require an AAL2 authenticator session in both Next.js and PostgreSQL.</p>
          <Link href="/account" className="secondary action-link">Manage authenticator</Link>
        </article>

        <article className="control-card">
          <div className="control-card-head"><div><span>02</span><h2>Leaked-password protection</h2></div><b className="ready">Active</b></div>
          <p>New and reset passwords are screened locally for predictable patterns and through a privacy-preserving breach-prefix lookup.</p>
          <small>Only the first five characters of a SHA-1 hash are sent to the breach lookup service; the password never leaves HisabTech.</small>
        </article>

        <article className="control-card">
          <div className="control-card-head"><div><span>03</span><h2>Error monitoring</h2></div><b className={snapshot.monitoringConfigured ? "ready" : "attention"}>{snapshot.monitoringConfigured ? "Connected" : "Webhook needed"}</b></div>
          <p>Server errors are structured, logged in Vercel and can be forwarded to an external monitoring endpoint.</p>
          <small>{snapshot.monitoringConfigured ? "MONITORING_WEBHOOK_URL is configured." : "Add MONITORING_WEBHOOK_URL in Vercel to receive external alerts."}</small>
        </article>

        <article className="control-card">
          <div className="control-card-head"><div><span>04</span><h2>Database backup</h2></div><b className={backupFresh ? "ready" : "critical"}>{backupFresh ? "Evidence current" : "Evidence overdue"}</b></div>
          <p>Encrypted logical backups are the active continuity method. The configured retention target is {settings.backup_retention_days} days.</p>
          <small>Last verified backup: {formatDate(settings.last_backup_at)}</small>
        </article>

        <article className="control-card">
          <div className="control-card-head"><div><span>05</span><h2>Point-in-time recovery</h2></div><b className={settings.pitr_enabled ? "ready" : "attention"}>{settings.pitr_enabled ? "Enabled" : "Plan upgrade"}</b></div>
          <p>The connected Supabase project is currently on the Free plan. PITR must be enabled after upgrading the project to a plan that supports it.</p>
          <small>This status is intentionally not marked ready until the platform confirms PITR.</small>
        </article>

        <article className="control-card">
          <div className="control-card-head"><div><span>06</span><h2>Activity alerts</h2></div><b className={settings.login_alerts_enabled && settings.financial_alerts_enabled ? "ready" : "attention"}>{settings.login_alerts_enabled && settings.financial_alerts_enabled ? "Active" : "Partially disabled"}</b></div>
          <p>Authentication and material financial actions generate organization-scoped security alerts and immutable audit events.</p>
        </article>

        <article className="control-card">
          <div className="control-card-head"><div><span>07</span><h2>Audit export</h2></div><b className={settings.audit_export_enabled ? "ready" : "attention"}>{settings.audit_export_enabled ? "Enabled" : "Disabled"}</b></div>
          <p>Export business, authentication and security-alert streams as a spreadsheet-safe CSV for auditors.</p>
          {settings.audit_export_enabled ? <a href="/api/audit/export?days=90" className="secondary action-link">Export last 90 days</a> : null}
        </article>

        <article className="control-card">
          <div className="control-card-head"><div><span>08</span><h2>Scheduled health checks</h2></div><b className={health?.status === "healthy" ? "ready" : health?.status === "critical" ? "critical" : "attention"}>{health?.status || "Pending"}</b></div>
          <p>PostgreSQL checks run daily at 02:15 UTC for negative stock, unbalanced posted journals, public tables without RLS, missing MFA and overdue continuity evidence.</p>
          <small>Last check: {formatDate(health?.created_at || null)}</small>
          <form action={runDatabaseHealthAction}><button className="secondary" type="submit">Run health check now</button></form>
        </article>
      </section>

      <section className="controls-workbench">
        <article className="controls-panel">
          <div className="controls-panel-head"><div><p className="eyebrow">POLICY</p><h2>Control settings</h2></div></div>
          <form action={updateProductionControlsAction} className="controls-form">
            <label className="toggle-row"><input type="checkbox" name="loginAlerts" defaultChecked={settings.login_alerts_enabled} /><span><strong>Login and identity alerts</strong><small>Track successful sign-ins, password changes and MFA events.</small></span></label>
            <label className="toggle-row"><input type="checkbox" name="financialAlerts" defaultChecked={settings.financial_alerts_enabled} /><span><strong>Financial-action alerts</strong><small>Track invoices, journals, payments, payroll, stock and period actions.</small></span></label>
            <label className="toggle-row"><input type="checkbox" name="auditExport" defaultChecked={settings.audit_export_enabled} /><span><strong>Audit export</strong><small>Allow MFA-verified administrators to export CSV evidence.</small></span></label>
            <label>Backup method<select name="backupMode" defaultValue={settings.backup_mode}><option value="logical_daily">Daily encrypted logical backup</option><option value="managed_daily">Managed daily backup</option><option value="pitr">Point-in-time recovery</option></select></label>
            <label>Retention days<input type="number" min="7" max="3650" name="retentionDays" defaultValue={settings.backup_retention_days} /></label>
            <button className="primary" type="submit">Save production policy</button>
          </form>
        </article>

        <article className="controls-panel">
          <div className="controls-panel-head"><div><p className="eyebrow">CONTINUITY EVIDENCE</p><h2>Backup and restore records</h2></div><span className={restoreFresh ? "ready-pill" : "attention-pill"}>{restoreFresh ? "Restore tested" : "Restore test due"}</span></div>
          <form action={recordBackupEvidenceAction} className="controls-form compact">
            <h3>Record completed backup</h3>
            <label>Completion time<input type="datetime-local" name="completedAt" defaultValue={dateTimeLocalNow()} required /></label>
            <label>SHA-256 checksum<input name="checksum" minLength={16} maxLength={160} required placeholder="Backup checksum" /></label>
            <label>Encrypted storage reference<input name="reference" maxLength={500} required placeholder="Vault/object key, never a database password" /></label>
            <button className="secondary" type="submit">Record backup evidence</button>
          </form>
          <form action={recordRestoreTestAction} className="controls-form compact">
            <h3>Record isolated restore test</h3>
            <label>Completion time<input type="datetime-local" name="completedAt" defaultValue={dateTimeLocalNow()} required /></label>
            <label>Result<select name="status" defaultValue="passed"><option value="passed">Passed</option><option value="failed">Failed</option></select></label>
            <label className="full">Evidence and validation notes<textarea name="notes" rows={3} required placeholder="Restored destination, row checks, journal balance result and reviewer" /></label>
            <button className="secondary" type="submit">Record restore test</button>
          </form>
        </article>
      </section>

      <section className="controls-panel alerts-panel">
        <div className="controls-panel-head"><div><p className="eyebrow">SECURITY INBOX</p><h2>Recent alerts</h2></div><span>{alerts.length} events</span></div>
        <div className="controls-alert-list">
          {alerts.length ? alerts.map((alert) => (
            <article className={`control-alert ${alert.severity}`} key={alert.id}>
              <div><span>{alert.severity}</span><strong>{alert.title}</strong><p>{alert.description || alert.category.replaceAll("_", " ")}</p><small>{formatDate(alert.created_at)}</small></div>
              {alert.status === "open" ? <form action={acknowledgeSecurityAlertAction}><input type="hidden" name="alertId" value={alert.id} /><button type="submit">Acknowledge</button></form> : <b>Acknowledged</b>}
            </article>
          )) : <p className="controls-empty-row">No security alerts have been recorded.</p>}
        </div>
      </section>
    </main>
  );
}
