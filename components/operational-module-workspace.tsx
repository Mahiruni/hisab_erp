"use client";

import Link from "next/link";
import { useState } from "react";
import { createOperationalRecord, updateOperationalRecordStatus } from "../lib/actions/operational";
import type { OperationalSnapshot } from "../lib/data/operational-types";
import {
  getOperationalCopy,
  humanizeOperationalValue,
  operationalModuleDefinitions,
  type OperationalModuleSlug,
} from "../lib/operational-modules";
import { DemoNotice } from "./demo-notice";
import { useLanguage } from "./language-provider";
import { PendingActionButton } from "./pending-action-button";

type WorkspaceTab = "overview" | "records" | "create" | "controls";

function money(value: number) {
  return new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 2 }).format(value || 0);
}

function shortDate(value: string | null, language: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language === "am" ? "am-ET" : language === "ti" ? "ti-ET" : "en-ET", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function EmptyState({ children }: { children: string }) {
  return <div className="ops-empty">{children}</div>;
}

export function OperationalModuleWorkspace({
  snapshot,
  initialTab,
  canManage,
}: {
  snapshot: OperationalSnapshot;
  initialTab?: string;
  canManage: boolean;
}) {
  const { language, dictionary } = useLanguage();
  const definition = operationalModuleDefinitions[snapshot.moduleSlug];
  const copy = getOperationalCopy(language);
  const moduleCopy = dictionary.moduleItems[snapshot.moduleSlug];
  const validTabs: WorkspaceTab[] = ["overview", "records", "create", "controls"];
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(validTabs.includes(initialTab as WorkspaceTab) ? initialTab as WorkspaceTab : "overview");
  const writesDisabled = snapshot.mode === "demo" || !canManage;
  const today = new Date().toISOString().slice(0, 10);
  const defaultDue = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const priorityName = definition.phase === 1 ? dictionary.priorityLabels["Must have"] : definition.phase === 2 ? dictionary.priorityLabels["Should have"] : dictionary.priorityLabels.Growth;

  return (
    <main className="ops-page">
      <header className="ops-hero">
        <div>
          <p className="eyebrow">{copy.phase} {definition.phase} · {priorityName}</p>
          <h1>{moduleCopy.title}</h1>
          <p>{moduleCopy.description}</p>
          <div className="ops-hero-actions">
            <button type="button" className="ops-primary-link" onClick={() => setActiveTab("create")}>{copy.newRecord}</button>
            {definition.companionHref && <Link href={definition.companionHref}>{definition.companionLabel || copy.openCompanion} →</Link>}
          </div>
        </div>
        <div className="ops-workspace-state">
          <span className="ops-live-dot" aria-hidden="true" />
          <div><small>{snapshot.mode === "live" ? copy.live : copy.demo}</small><strong>{snapshot.organizationName}</strong></div>
        </div>
      </header>

      <DemoNotice mode={snapshot.mode} />
      {!canManage && snapshot.mode === "live" && <div className="form-alert warning ops-access-notice">{copy.readOnly}</div>}

      <nav className="ops-tabs" aria-label={`${moduleCopy.title} sections`}>
        {([
          ["overview", copy.overview],
          ["records", copy.records],
          ["create", copy.create],
          ["controls", copy.controls],
        ] as const).map(([key, label]) => (
          <button type="button" key={key} className={activeTab === key ? "active" : ""} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <div className="ops-view">
          <section className="ops-kpis">
            <article><span>{copy.total}</span><strong>{snapshot.metrics.total}</strong><small>{copy.records}</small></article>
            <article><span>{copy.active}</span><strong>{snapshot.metrics.active}</strong><small>{copy.operational}</small></article>
            <article className={snapshot.metrics.atRisk > 0 ? "attention" : "positive"}><span>{copy.atRisk}</span><strong>{snapshot.metrics.atRisk}</strong><small>{copy.dueDate}</small></article>
            <article><span>{copy.value}</span><strong>{money(snapshot.metrics.value)}</strong><small>ETB</small></article>
          </section>

          <section className="ops-overview-grid">
            <article className="ops-panel ops-progress-panel">
              <div className="ops-panel-head"><div><p className="eyebrow">{copy.operational}</p><h2>{moduleCopy.shortTitle}</h2></div><span>{snapshot.metrics.completed}/{snapshot.metrics.total}</span></div>
              <div className="ops-progress-ring" style={{ "--progress": `${snapshot.metrics.total ? Math.round((snapshot.metrics.completed / snapshot.metrics.total) * 100) : 0}%` } as React.CSSProperties}>
                <div><strong>{snapshot.metrics.total ? Math.round((snapshot.metrics.completed / snapshot.metrics.total) * 100) : 0}%</strong><span>{copy.completed}</span></div>
              </div>
              <p>{moduleCopy.features.slice(0, 3).join(" · ")}</p>
            </article>

            <article className="ops-panel ops-activity-panel">
              <div className="ops-panel-head"><div><p className="eyebrow">{copy.recentActivity}</p><h2>{copy.latestRecords}</h2></div><button type="button" onClick={() => setActiveTab("records")}>{copy.records} →</button></div>
              {snapshot.activity.length ? <div className="ops-activity-list">{snapshot.activity.slice(0, 6).map((item) => (
                <div key={item.id} className="ops-activity-item"><span className="ops-activity-mark">✓</span><div><strong>{item.recordNumber}</strong><p>{item.message || humanizeOperationalValue(item.eventType, language)}</p><time>{shortDate(item.createdAt, language)}</time></div></div>
              ))}</div> : <EmptyState>{copy.noActivity}</EmptyState>}
            </article>
          </section>

          <section className="ops-panel">
            <div className="ops-panel-head"><div><p className="eyebrow">{copy.latestRecords}</p><h2>{moduleCopy.title}</h2></div><button type="button" onClick={() => setActiveTab("create")}>+ {copy.create}</button></div>
            <RecordsTable snapshot={snapshot} language={language} copy={copy} canManage={!writesDisabled} />
          </section>
        </div>
      )}

      {activeTab === "records" && (
        <div className="ops-view">
          <section className="ops-panel">
            <div className="ops-panel-head"><div><p className="eyebrow">{copy.records}</p><h2>{copy.latestRecords}</h2></div><span>{snapshot.records.length}</span></div>
            <RecordsTable snapshot={snapshot} language={language} copy={copy} canManage={!writesDisabled} showActions />
          </section>
        </div>
      )}

      {activeTab === "create" && (
        <div className="ops-view ops-two-column">
          <section className="ops-panel">
            <div className="ops-panel-head"><div><p className="eyebrow">{copy.create}</p><h2>{copy.newRecord}</h2></div><span>{moduleCopy.shortTitle}</span></div>
            <form action={createOperationalRecord} className="ops-form">
              <input type="hidden" name="moduleSlug" value={snapshot.moduleSlug} />
              <input type="hidden" name="entryLanguage" value={language} />
              <label>{copy.type}<select name="recordType" defaultValue={definition.recordTypes[0]} disabled={writesDisabled}>{definition.recordTypes.map((type) => <option value={type} key={type}>{humanizeOperationalValue(type, language)}</option>)}</select></label>
              <label>{copy.status}<select name="status" defaultValue={definition.statuses[0]} disabled={writesDisabled}>{definition.statuses.map((status) => <option value={status} key={status}>{humanizeOperationalValue(status, language)}</option>)}</select></label>
              <label className="full">{copy.title}<input name="title" maxLength={180} placeholder={moduleCopy.features[0]} required disabled={writesDisabled} /></label>
              <label>{copy.counterparty}<input name="counterparty" maxLength={180} disabled={writesDisabled} /></label>
              <label>{copy.owner}<input name="ownerName" maxLength={160} disabled={writesDisabled} /></label>
              <label>{copy.priority}<select name="priority" defaultValue="normal" disabled={writesDisabled}><option value="low">{copy.low}</option><option value="normal">{copy.normal}</option><option value="high">{copy.high}</option><option value="critical">{copy.critical}</option></select></label>
              <label>{copy.amount}<input name="amount" type="number" min="0" step="0.01" defaultValue="0" disabled={writesDisabled} /></label>
              <label>{copy.dueDate}<input name="dueDate" type="date" min={today} defaultValue={defaultDue} disabled={writesDisabled} /></label>
              <label className="full">{copy.description}<textarea name="description" rows={5} maxLength={1000} disabled={writesDisabled} /></label>
              <PendingActionButton className="primary full" pendingLabel={`${copy.save}…`} disabled={writesDisabled}>{copy.save}</PendingActionButton>
            </form>
          </section>

          <section className="ops-panel ops-guidance-panel">
            <div className="ops-panel-head"><div><p className="eyebrow">{copy.features}</p><h2>{moduleCopy.title}</h2></div><span>{copy.phase} {definition.phase}</span></div>
            <ul>{moduleCopy.features.map((feature) => <li key={feature}><span>✓</span><div><strong>{feature}</strong><p>{moduleCopy.description}</p></div></li>)}</ul>
          </section>
        </div>
      )}

      {activeTab === "controls" && (
        <div className="ops-view ops-controls-grid">
          <section className="ops-panel">
            <div className="ops-panel-head"><div><p className="eyebrow">{copy.features}</p><h2>{copy.operational}</h2></div><span>{moduleCopy.features.length}</span></div>
            <div className="ops-capability-grid">{moduleCopy.features.map((feature, index) => <article key={feature}><span>{String(index + 1).padStart(2, "0")}</span><strong>{feature}</strong><p>{moduleCopy.description}</p></article>)}</div>
          </section>
          <section className="ops-panel">
            <div className="ops-panel-head"><div><p className="eyebrow">{copy.governance}</p><h2>{copy.controls}</h2></div><span>{moduleCopy.controls.length}</span></div>
            <div className="ops-control-list">{moduleCopy.controls.map((control) => <div key={control}><span aria-hidden="true">◆</span><strong>{control}</strong></div>)}</div>
          </section>
        </div>
      )}
    </main>
  );
}

function RecordsTable({
  snapshot,
  language,
  copy,
  canManage,
  showActions = false,
}: {
  snapshot: OperationalSnapshot;
  language: "en" | "am" | "ti";
  copy: ReturnType<typeof getOperationalCopy>;
  canManage: boolean;
  showActions?: boolean;
}) {
  const definition = operationalModuleDefinitions[snapshot.moduleSlug as OperationalModuleSlug];
  if (!snapshot.records.length) return <EmptyState>{copy.noRecords}</EmptyState>;

  return (
    <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>{copy.records}</th><th>{copy.type}</th><th>{copy.counterparty}</th><th>{copy.dueDate}</th><th>{copy.amount}</th><th>{copy.status}</th>{showActions && <th>{copy.update}</th>}</tr></thead><tbody>
      {snapshot.records.map((record) => <tr key={record.id}>
        <td><strong>{record.number}</strong><small>{record.title}</small><em className={`ops-priority ${record.priority}`}>{humanizeOperationalValue(record.priority, language)}</em></td>
        <td>{humanizeOperationalValue(record.type, language)}<small>{record.owner || "—"}</small></td>
        <td>{record.counterparty || "—"}</td>
        <td className={record.dueDate && record.dueDate < new Date().toISOString().slice(0, 10) ? "ops-overdue" : ""}>{shortDate(record.dueDate, language)}</td>
        <td><strong>{record.amount ? money(record.amount) : "—"}</strong></td>
        <td><span className={`ops-status ${record.status.replaceAll("_", "-")}`}>{humanizeOperationalValue(record.status, language)}</span></td>
        {showActions && <td>{canManage ? <form action={updateOperationalRecordStatus} className="ops-inline-update">
          <input type="hidden" name="moduleSlug" value={snapshot.moduleSlug} />
          <input type="hidden" name="recordId" value={record.id} />
          <select name="status" defaultValue={record.status}>{definition.statuses.map((status) => <option value={status} key={status}>{humanizeOperationalValue(status, language)}</option>)}</select>
          <input name="updateNote" maxLength={500} placeholder={copy.updateNote} />
          <PendingActionButton className="ops-update-button" pendingLabel="…">{copy.update}</PendingActionButton>
        </form> : <span className="ops-readonly">—</span>}</td>}
      </tr>)}
    </tbody></table></div>
  );
}
