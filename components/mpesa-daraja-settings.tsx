import { saveMpesaDarajaCredentials, validateMpesaDarajaCredentials } from "../lib/actions/mpesa-daraja";
import { Icon } from "./ui/icon";

type DarajaStatus = {
  configured: boolean;
  environment: "sandbox" | "production";
  keySuffix: string | null;
  callbackTokenPresent: boolean;
  lastCheck: null | {
    success: boolean;
    httpStatus: number | null;
    responseCode: string | null;
    message: string | null;
    checkedAt: string;
  };
};

function checkedAt(value: string) {
  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date(value));
}

export function MpesaDarajaSettings({ status, canManage }: { status: DarajaStatus; canManage: boolean }) {
  return (
    <section className="recon-page" id="mpesa-daraja" aria-labelledby="mpesa-daraja-heading">
      <section className="recon-panel">
        <div className="recon-panel-head">
          <div>
            <p className="eyebrow icon-action"><Icon name="lock" size={16} />Encrypted provider credentials</p>
            <h2 id="mpesa-daraja-heading">Safaricom M-Pesa Daraja connection</h2>
          </div>
          <span className={`recon-status ${status.configured ? "matched" : "unmatched"}`}>
            {status.configured ? "Credentials stored" : "Not configured"}
          </span>
        </div>
        <p className="recon-panel-intro">
          Consumer credentials are encrypted in Supabase Vault for this organization. They are never returned to the browser, written to GitHub, or reused as the callback token.
        </p>

        <div className="recon-transaction-grid" aria-label="Daraja connection status">
          <span>Environment<strong>{status.environment}</strong></span>
          <span>Consumer key<strong>{status.keySuffix ? `•••• ${status.keySuffix}` : "Not stored"}</strong></span>
          <span>Callback protection<strong>{status.callbackTokenPresent ? "Separate token ready" : "Pending"}</strong></span>
          <span>OAuth status<strong>{status.lastCheck ? (status.lastCheck.success ? "Verified" : "Failed") : "Not tested"}</strong></span>
        </div>

        {status.lastCheck && (
          <div className={status.lastCheck.success ? "recon-notice" : "form-alert error"} role="status">
            <strong className="icon-action">
              <Icon name={status.lastCheck.success ? "check-circle" : "alert-triangle"} size={18} />
              {status.lastCheck.success ? "Daraja OAuth verified" : "Daraja OAuth verification failed"}
            </strong>
            <p>
              {status.lastCheck.message || status.lastCheck.responseCode || "No provider message supplied"}
              {status.lastCheck.httpStatus ? ` · HTTP ${status.lastCheck.httpStatus}` : ""}
              {` · ${checkedAt(status.lastCheck.checkedAt)}`}
            </p>
          </div>
        )}

        <form action={saveMpesaDarajaCredentials} className="recon-form" autoComplete="off">
          <label>
            Daraja environment
            <select name="environment" defaultValue={status.environment} disabled={!canManage}>
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </label>
          <label>
            Consumer Key
            <input name="consumerKey" type="password" minLength={20} maxLength={300} required autoComplete="off" placeholder="Paste the complete Consumer Key" disabled={!canManage} />
          </label>
          <label className="full">
            Consumer Secret
            <input name="consumerSecret" type="password" minLength={20} maxLength={300} required autoComplete="new-password" placeholder="Paste the complete Consumer Secret" disabled={!canManage} />
          </label>
          <div className="recon-formula full">
            <strong>Credential policy</strong>
            <span>Saving replaces the encrypted key pair and preserves a separate callback token.</span>
          </div>
          <button className="primary full" disabled={!canManage}>
            <Icon name="save" size={18} /><span>Encrypt and save Daraja credentials</span>
          </button>
        </form>

        <form action={validateMpesaDarajaCredentials} className="recon-source-actions">
          <button className="secondary" disabled={!canManage || !status.configured}>
            <Icon name="refresh-cw" size={17} /><span>Validate OAuth connection</span>
          </button>
          <small>Validation requests an access token only. It does not initiate, reverse, or query a payment.</small>
        </form>

        {!canManage && <small className="recon-readonly">Only an MFA-verified owner or administrator can manage Daraja credentials.</small>}
      </section>
    </section>
  );
}
