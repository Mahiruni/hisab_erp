"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { Icon } from "./ui/icon";

type MfaFactor = {
  id: string;
  friendly_name?: string | null;
  status: string;
  factor_type: string;
};

type Enrollment = {
  id: string;
  qr: string;
  secret: string;
};

type Props = {
  organizationId: string;
  required: boolean;
  initialAal: "aal1" | "aal2";
  continueHref?: string;
};

function readableError(reason: unknown, fallback: string) {
  const message = reason instanceof Error ? reason.message : fallback;
  const normalized = message.toLowerCase();
  if (normalized.includes("expired")) return "That code expired. Wait for the next code in your authenticator and try again.";
  if (normalized.includes("invalid") || normalized.includes("not accepted")) return "The code was not accepted. Confirm your phone time is automatic and enter the newest code.";
  if (normalized.includes("already exists")) return "An unfinished authenticator setup already exists. Refresh the page and try again.";
  return message || fallback;
}

function factorName(factor: MfaFactor, index: number) {
  return factor.friendly_name?.trim() || `Authenticator ${index + 1}`;
}

export function MfaSecurityPanel({ organizationId, required, initialAal, continueHref }: Props) {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [aal, setAal] = useState(initialAal);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [removeFactorId, setRemoveFactorId] = useState<string | null>(null);

  const verified = useMemo(() => factors.filter((factor) => factor.status === "verified"), [factors]);
  const pending = useMemo(() => factors.filter((factor) => factor.status !== "verified"), [factors]);
  const activeFactor = verified[0];
  const protectedSession = aal === "aal2";

  async function refreshStatus() {
    const supabase = createClient();
    const [factorResult, assuranceResult] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if (factorResult.error) throw factorResult.error;
    if (assuranceResult.error) throw assuranceResult.error;
    setFactors([...(factorResult.data.totp || []), ...(factorResult.data.phone || [])] as MfaFactor[]);
    setAal(assuranceResult.data.currentLevel === "aal2" ? "aal2" : "aal1");
  }

  useEffect(() => {
    refreshStatus()
      .catch((reason) => setError(readableError(reason, "Unable to load authenticator status.")))
      .finally(() => setLoading(false));
  }, []);

  function resetNotices() {
    setError("");
    setMessage("");
    setCopied(false);
  }

  async function startEnrollment() {
    setBusy(true);
    resetNotices();
    try {
      const supabase = createClient();
      for (const factor of pending.filter((item) => item.factor_type === "totp")) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: verified.length ? `Hisab backup authenticator ${verified.length + 1}` : "Hisab primary authenticator",
      });
      if (enrollError) throw enrollError;
      setEnrollment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
      setCode("");
    } catch (reason) {
      setError(readableError(reason, "Unable to start authenticator enrollment."));
    } finally {
      setBusy(false);
    }
  }

  async function recordAudit(eventType: string, severity = "info") {
    const supabase = createClient();
    await supabase.rpc("record_auth_audit", {
      p_event_type: eventType,
      p_organization_id: organizationId,
      p_severity: severity,
      p_metadata: { factor_type: "totp" },
    });
  }

  async function verifyFactor(factorId: string, eventType: "auth.mfa.enrolled" | "auth.mfa.verified") {
    const normalizedCode = code.trim();
    if (!/^\d{6,8}$/.test(normalizedCode)) {
      setError("Enter the current 6-digit code from your authenticator app.");
      return;
    }

    setBusy(true);
    resetNotices();
    const supabase = createClient();
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const verification = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: normalizedCode,
      });
      if (verification.error) throw verification.error;
      await recordAudit(eventType);
      setEnrollment(null);
      setCode("");
      setMessage(eventType === "auth.mfa.enrolled" ? "Authenticator enabled. This browser now carries strong administrator assurance." : "Session verified. Protected actions are now available in this browser.");
      await refreshStatus();
      window.setTimeout(() => {
        if (continueHref && continueHref !== "/account") window.location.assign(continueHref);
        else window.location.reload();
      }, 850);
    } catch (reason) {
      await recordAudit("auth.mfa.challenge_failed", "critical");
      setError(readableError(reason, "The verification code was not accepted."));
    } finally {
      setBusy(false);
    }
  }

  async function cancelEnrollment() {
    if (!enrollment) return;
    setBusy(true);
    resetNotices();
    try {
      const supabase = createClient();
      const result = await supabase.auth.mfa.unenroll({ factorId: enrollment.id });
      if (result.error) throw result.error;
      setEnrollment(null);
      setCode("");
      await refreshStatus();
    } catch (reason) {
      setError(readableError(reason, "Unable to cancel authenticator setup."));
    } finally {
      setBusy(false);
    }
  }

  async function copySecret() {
    if (!enrollment) return;
    try {
      await navigator.clipboard.writeText(enrollment.secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy was blocked by the browser. Select the manual key and copy it directly.");
    }
  }

  async function removeFactor(factor: MfaFactor) {
    if (required && verified.length <= 1 && factor.status === "verified") {
      setError("Add and verify a backup authenticator before removing the only factor required by your administrator role.");
      setRemoveFactorId(null);
      return;
    }

    setBusy(true);
    resetNotices();
    try {
      const supabase = createClient();
      const result = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (result.error) throw result.error;
      await recordAudit("auth.mfa.unenrolled");
      setRemoveFactorId(null);
      setMessage("Authenticator removed from this account.");
      await refreshStatus();
      window.setTimeout(() => window.location.reload(), 650);
    } catch (reason) {
      setError(readableError(reason, "Unable to remove this authenticator."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="security-mfa-panel biloo-mfa-manager" aria-labelledby="mfa-heading">
      <header className="biloo-mfa-header">
        <div className="biloo-mfa-title-row">
          <span className="biloo-mfa-title-icon"><Icon name="smartphone" size={21} /></span>
          <div><p>TIME-BASED ONE-TIME PASSWORD</p><h2 id="mfa-heading">Authenticator security</h2></div>
        </div>
        <span className={`biloo-mfa-state ${protectedSession ? "is-ready" : verified.length ? "needs-verification" : required ? "is-required" : "is-optional"}`}>
          <i aria-hidden="true" />
          {protectedSession ? "AAL2 active" : verified.length ? "Verify session" : required ? "Setup required" : "Recommended"}
        </span>
      </header>

      <p className="biloo-mfa-description">Use Google Authenticator, Microsoft Authenticator, 1Password, Authy, or another standards-compatible TOTP app. Codes stay on your device and change every few seconds.</p>

      <div className="biloo-mfa-metrics" aria-label="Authenticator status">
        <div><small>Verified factors</small><strong>{verified.length}</strong></div>
        <div><small>Current session</small><strong>{protectedSession ? "AAL2" : "AAL1"}</strong></div>
        <div><small>Role policy</small><strong>{required ? "Required" : "Optional"}</strong></div>
      </div>

      {error ? <p className="biloo-mfa-notice is-error" role="alert"><Icon name="alert-triangle" size={16} /> {error}</p> : null}
      {message ? <p className="biloo-mfa-notice is-success" role="status"><Icon name="check-circle" size={16} /> {message}</p> : null}

      {loading ? (
        <div className="biloo-mfa-loading" role="status"><span /><div><strong>Checking account protection</strong><small>Loading authenticators and current assurance…</small></div></div>
      ) : enrollment ? (
        <section className="biloo-mfa-enrollment" aria-labelledby="mfa-enrollment-heading">
          <div className="biloo-mfa-enrollment-head">
            <div><p>NEW AUTHENTICATOR</p><h3 id="mfa-enrollment-heading">Connect your authenticator app</h3></div>
            <span>About 1 minute</span>
          </div>

          <div className="biloo-mfa-enrollment-grid">
            <div className="biloo-mfa-qr-column">
              <div className="biloo-mfa-qr-frame"><img src={enrollment.qr} alt="Authenticator enrollment QR code" /></div>
              <span><Icon name="lock" size={13} /> Scan only on a trusted device</span>
            </div>

            <div className="biloo-mfa-setup-column">
              <ol className="biloo-mfa-steps">
                <li><span>1</span><div><strong>Open your authenticator</strong><small>Choose Add account, then scan a QR code.</small></div></li>
                <li><span>2</span><div><strong>Scan this QR code</strong><small>The account will appear as a Hisab authenticator.</small></div></li>
                <li><span>3</span><div><strong>Verify the newest code</strong><small>Enter the code currently shown in the app.</small></div></li>
              </ol>

              <div className="biloo-mfa-manual-key">
                <div><small>CAN'T SCAN?</small><strong>Enter this setup key manually</strong></div>
                <code>{enrollment.secret}</code>
                <button type="button" onClick={copySecret}>{copied ? "Copied" : "Copy key"}</button>
              </div>

              <label className="biloo-mfa-code-field">
                <span>Authenticator code</span>
                <div><Icon name="lock" size={17} /><input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="000 000" aria-describedby="mfa-code-help" /></div>
                <small id="mfa-code-help">Use the newest code. Spaces are added visually by your authenticator, not required here.</small>
              </label>

              <div className="biloo-mfa-actions">
                <button type="button" className="is-primary" disabled={busy} onClick={() => verifyFactor(enrollment.id, "auth.mfa.enrolled")}><Icon name="shield-check" size={16} /> {busy ? "Verifying…" : "Enable authenticator"}</button>
                <button type="button" className="is-secondary" disabled={busy} onClick={cancelEnrollment}>Cancel setup</button>
              </div>
            </div>
          </div>
        </section>
      ) : !verified.length ? (
        <section className="biloo-mfa-empty-state">
          <div className="biloo-mfa-empty-visual" aria-hidden="true"><span><Icon name="smartphone" size={27} /></span><i /><i /><i /></div>
          <div className="biloo-mfa-empty-copy">
            <p>{required ? "REQUIRED FOR YOUR ROLE" : "RECOMMENDED SECURITY"}</p>
            <h3>Protect this account with an authenticator.</h3>
            <span>Even if someone knows your password or gains access to your email provider, protected Hisab actions still require a code generated on your device.</span>
            <div className="biloo-mfa-app-list"><small>Google Authenticator</small><small>Microsoft Authenticator</small><small>1Password</small><small>Authy</small></div>
            <button type="button" className="is-primary" disabled={busy} onClick={startEnrollment}><Icon name="plus" size={16} /> {busy ? "Preparing…" : "Set up authenticator"}</button>
          </div>
        </section>
      ) : !protectedSession && activeFactor ? (
        <section className="biloo-mfa-challenge">
          <div className="biloo-mfa-challenge-copy">
            <span><Icon name="lock" size={21} /></span>
            <div><p>SESSION VERIFICATION</p><h3>Confirm it is really you.</h3><small>Your authenticator is enrolled. Enter a current code to unlock protected administrator actions in this browser.</small></div>
          </div>
          <label className="biloo-mfa-code-field is-inline">
            <span>Current code</span>
            <div><Icon name="smartphone" size={17} /><input autoFocus inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="000 000" /></div>
          </label>
          <button type="button" className="is-primary biloo-mfa-verify-button" disabled={busy} onClick={() => verifyFactor(activeFactor.id, "auth.mfa.verified")}><Icon name="shield-check" size={16} /> {busy ? "Verifying…" : "Verify this session"}</button>
        </section>
      ) : (
        <section className="biloo-mfa-ready-state">
          <span className="biloo-mfa-ready-icon"><Icon name="shield-check" size={25} /></span>
          <div><p>STRONG ASSURANCE ACTIVE</p><h3>This browser session is protected.</h3><small>Hisab can now complete privileged actions permitted by your organization role.</small></div>
          {continueHref ? <a href={continueHref}>Continue <Icon name="arrow-right" size={15} /></a> : null}
        </section>
      )}

      {verified.length ? (
        <section className="biloo-mfa-factor-section" aria-labelledby="verified-authenticators-heading">
          <header>
            <div><p>VERIFIED DEVICES</p><h3 id="verified-authenticators-heading">Enrolled authenticators</h3></div>
            {protectedSession && !enrollment ? <button type="button" disabled={busy} onClick={startEnrollment}><Icon name="plus" size={14} /> Add backup</button> : null}
          </header>
          <div className="biloo-mfa-factor-list">
            {verified.map((factor, index) => (
              <article key={factor.id}>
                <span className="biloo-mfa-factor-icon"><Icon name="smartphone" size={18} /></span>
                <div><strong>{factorName(factor, index)}</strong><small>TOTP authenticator · Verified</small></div>
                <span className="biloo-mfa-factor-status"><i aria-hidden="true" /> Active</span>
                {removeFactorId === factor.id ? (
                  <div className="biloo-mfa-remove-confirm">
                    <span>Remove this authenticator?</span>
                    <button type="button" disabled={busy} onClick={() => removeFactor(factor)}>Remove</button>
                    <button type="button" disabled={busy} onClick={() => setRemoveFactorId(null)}>Keep</button>
                  </div>
                ) : (
                  <button type="button" className="biloo-mfa-remove-button" disabled={busy || (required && verified.length <= 1)} onClick={() => setRemoveFactorId(factor.id)} title={required && verified.length <= 1 ? "Add a backup authenticator before removing the required factor" : "Remove authenticator"}>Remove</button>
                )}
              </article>
            ))}
          </div>
          {required && verified.length === 1 ? <p className="biloo-mfa-factor-tip"><Icon name="lightbulb" size={15} /> Add a backup authenticator before replacing your current device. Hisab will not remove the only factor required by your role.</p> : null}
        </section>
      ) : null}

      <footer className="biloo-mfa-footer-note"><Icon name="lock" size={15} /><span>Authenticator secrets are handled through Supabase MFA. Hisab stores verification state and audit events, not reusable one-time codes.</span></footer>
    </section>
  );
}
