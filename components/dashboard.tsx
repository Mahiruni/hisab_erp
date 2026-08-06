"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { erpModules } from "../lib/erp-modules";
import type { DashboardSnapshot, UserContext } from "../lib/data/types";
import { dashboardRoleProfiles } from "./dashboard-role-profiles";
import { getDashboardInterfaceCopy } from "./dashboard-interface-copy";
import { DemoNotice } from "./demo-notice";
import { LanguageSelector, useLanguage } from "./language-provider";
import { LocalGreeting } from "./local-greeting";
import { Icon, type IconName } from "./ui/icon";
import {
  ActionAlert,
  EmptyState,
  MetricTile,
  StatusBadge,
  WorkspacePageHeader,
  type WorkspaceTone,
} from "./ui/workspace-primitives";

function money(value: number, language: string) {
  return new Intl.NumberFormat(language === "am" ? "am-ET" : "en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(value);
}

function routeIcon(href: string): IconName {
  if (href.includes("security")) return "shield-check";
  if (href.includes("invoice") || href.includes("journal")) return "file-check";
  if (href.includes("inventory")) return "boxes";
  if (href.includes("customer")) return "users";
  if (href.includes("report")) return "chart";
  if (href.includes("onboarding")) return "building";
  if (href.includes("purchasing")) return "receipt";
  if (href.includes("finance")) return "landmark";
  if (href.includes("sales")) return "shopping-cart";
  return "grid";
}

function healthTone(status: "strong" | "good" | "attention"): WorkspaceTone {
  if (status === "strong") return "success";
  if (status === "good") return "info";
  return "warning";
}

function RevenueTrendChart({ values, labels, label }: { values: number[]; labels: readonly string[]; label: string }) {
  const normalized = values.length ? values : [0];
  const width = 840;
  const height = 260;
  const horizontalPadding = 28;
  const verticalPadding = 24;
  const max = Math.max(...normalized, 1);
  const min = Math.min(...normalized, 0);
  const range = Math.max(max - min, 1);
  const usableWidth = width - horizontalPadding * 2;
  const usableHeight = height - verticalPadding * 2;
  const points = normalized.map((value, index) => {
    const x = horizontalPadding + (normalized.length === 1 ? usableWidth / 2 : (index / (normalized.length - 1)) * usableWidth);
    const y = verticalPadding + usableHeight - ((value - min) / range) * usableHeight;
    return { x, y, value };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `M ${points[0].x} ${height - verticalPadding} L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points[points.length - 1].x} ${height - verticalPadding} Z`;

  return (
    <div className="revenue-line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} preserveAspectRatio="none">
        <defs>
          <linearGradient id="hisab-revenue-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id="hisab-revenue-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {[0.25, 0.5, 0.75].map((position) => <line className="revenue-grid-line" key={position} x1={horizontalPadding} x2={width - horizontalPadding} y1={verticalPadding + usableHeight * position} y2={verticalPadding + usableHeight * position} />)}
        <path className="revenue-area" d={area} fill="url(#hisab-revenue-area)" />
        <polyline className="revenue-line" points={line} fill="none" filter="url(#hisab-revenue-glow)" />
        {points.map((point, index) => <circle className="revenue-point" key={`${point.x}-${point.value}`} cx={point.x} cy={point.y} r={index === points.length - 1 ? 5.5 : 3.5} />)}
      </svg>
      <div className="revenue-axis" aria-hidden="true">
        {normalized.map((value, index) => <span key={`${index}-${value}`}>{labels[index] ?? index + 1}</span>)}
      </div>
    </div>
  );
}

export function Dashboard({ snapshot, user }: { snapshot: DashboardSnapshot; user: UserContext }) {
  const { dictionary, language } = useLanguage();
  const d = dictionary.dashboard;
  const ui = getDashboardInterfaceCopy(language);
  const metrics = snapshot.metrics;
  const profile = dashboardRoleProfiles[user.role];
  const operatingResult = metrics.sales - metrics.expenses;
  const resultTone: WorkspaceTone = operatingResult >= 0 ? "success" : "danger";
  const receivableTone: WorkspaceTone = metrics.debt > metrics.cash ? "warning" : "neutral";
  const scoreTone: WorkspaceTone = snapshot.health.score >= 80 ? "success" : snapshot.health.score >= 60 ? "warning" : "danger";
  const roleModules = profile.moduleSlugs
    .map((slug) => erpModules.find((module) => module.slug === slug))
    .filter((module): module is NonNullable<typeof module> => Boolean(module));
  const healthLabel = (status: "strong" | "good" | "attention") => status === "strong" ? d.strong : status === "good" ? d.good : d.needsAttention;
  const annualRevenue = snapshot.monthlyRevenue.reduce((sum, value) => sum + value, 0);
  const healthStyle = { "--health-progress": `${Math.max(0, Math.min(100, snapshot.health.score)) * 3.6}deg` } as CSSProperties;

  return (
    <main className="dashboard-content financial-dashboard apple-grade-dashboard" data-dashboard-role={user.role}>
      <WorkspacePageHeader
        breadcrumb={<><Link href="/">{ui.home}</Link><Icon name="chevron-right" size={12} /><span>{ui.dashboard}</span></>}
        eyebrow={<><Icon name="activity" size={14} /><LocalGreeting language={language} firstName={snapshot.userName} /></>}
        title={ui.overview}
        description={profile.summary}
        meta={<><StatusBadge label={profile.title} tone="info" /><span>{ui.roleContext}</span></>}
        actions={<><span className="workspace-status"><i />{ui.liveWorkspace}</span><LanguageSelector /><Link className="secondary action-link" href="/api/reports/dashboard"><Icon name="download" size={16} /><span>{d.exportReport}</span></Link><Link className="primary action-link" href={profile.quickAction.href}><Icon name="plus" size={16} /><span>{profile.quickAction.label}</span></Link></>}
      />

      <DemoNotice mode={snapshot.mode} />

      <section className="workspace-section financial-snapshot-section dashboard-snapshot-card" aria-labelledby="financial-snapshot-title">
        <div className="workspace-section-heading">
          <div><p className="workspace-eyebrow"><Icon name="circle-dollar" size={14} />{ui.financialSnapshot}</p><h2 id="financial-snapshot-title">{ui.financialSnapshot}</h2><p>{ui.financialSnapshotDescription}</p></div>
          <Link className="workspace-inline-action" href="/finance"><span>{ui.reviewFinance}</span><Icon name="arrow-right" size={14} /></Link>
        </div>
        <div className="financial-metric-grid">
          <MetricTile label={ui.sales} value={money(metrics.sales, language)} detail={d.metricItems.sales.change} icon="chart" tone="success" />
          <MetricTile label={ui.expenses} value={money(metrics.expenses, language)} detail={d.metricItems.expenses.change} icon="receipt" tone="warning" />
          <MetricTile label={ui.cash} value={money(metrics.cash, language)} detail={d.metricItems.cash.change} icon="wallet" tone="info" />
          <MetricTile label={ui.receivables} value={money(metrics.debt, language)} detail={d.metricItems.debt.change} icon="file-check" tone={receivableTone} />
          <MetricTile label={ui.operatingResult} value={money(operatingResult, language)} detail={operatingResult >= 0 ? ui.positiveResult : ui.negativeResult} icon={operatingResult >= 0 ? "trending-up" : "trending-down"} tone={resultTone} />
        </div>
      </section>

      <section className="financial-analysis-grid dashboard-insight-grid">
        <article className="workspace-section performance-panel dashboard-performance-panel">
          <div className="workspace-section-heading"><div><p className="workspace-eyebrow"><Icon name="chart" size={14} />{ui.performance}</p><h2>{d.revenueOverview}</h2></div><StatusBadge label={d.last12Months} /></div>
          <div className="revenue-summary"><div><small>{d.revenueOverview}</small><strong>{money(annualRevenue, language)}</strong></div><span><Icon name="trending-up" size={14} />+18.2% {d.fromLastYear}</span></div>
          <RevenueTrendChart values={snapshot.monthlyRevenue} labels={d.months} label={d.revenueChart} />
        </article>

        <article className="workspace-section health-panel dashboard-health-panel">
          <div className="workspace-section-heading"><div><p className="workspace-eyebrow"><Icon name="activity" size={14} />{ui.businessHealth}</p><h2>{d.excellentCondition}</h2></div><StatusBadge label={`${snapshot.health.score}/100`} tone={scoreTone} /></div>
          <div className="dashboard-health-score">
            <div className="dashboard-health-ring" style={healthStyle}><span><strong>{snapshot.health.score}</strong><small>/100</small></span></div>
            <p>{ui.businessHealthDescription}</p>
          </div>
          <ul className="health-status-list"><li><span>{d.cashFlow}</span><StatusBadge label={healthLabel(snapshot.health.cashFlow)} tone={healthTone(snapshot.health.cashFlow)} /></li><li><span>{d.expenseControl}</span><StatusBadge label={healthLabel(snapshot.health.expenseControl)} tone={healthTone(snapshot.health.expenseControl)} /></li><li><span>{d.debtCollection}</span><StatusBadge label={healthLabel(snapshot.health.debtCollection)} tone={healthTone(snapshot.health.debtCollection)} /></li></ul>
        </article>
      </section>

      <section className="dashboard-operating-grid">
        <article className="workspace-section attention-section dashboard-attention-panel" aria-labelledby="attention-title">
          <div className="workspace-section-heading"><div><p className="workspace-eyebrow"><Icon name="alert-triangle" size={14} />{ui.attention}</p><h2 id="attention-title">{ui.attention}</h2><p>{ui.attentionDescription}</p></div></div>
          <div className="workspace-action-alert-list">
            <ActionAlert title={ui.collectReceivables} description={ui.collectReceivablesDescription} value={money(metrics.debt, language)} href="/customers" actionLabel={ui.reviewCustomers} icon="users" tone={receivableTone} />
            <ActionAlert title={ui.operatingMargin} description={ui.operatingMarginDescription} value={money(operatingResult, language)} href="/finance" actionLabel={ui.reviewFinance} icon={operatingResult >= 0 ? "trending-up" : "trending-down"} tone={resultTone} />
            <ActionAlert title={ui.reconciliation} description={ui.reconciliationDescription} href="/reconciliation" actionLabel={ui.reconcile} icon="refresh-cw" tone="info" />
            <ActionAlert title={ui.businessHealth} description={ui.businessHealthDescription} value={`${snapshot.health.score}/100`} href="/reports" actionLabel={ui.openReports} icon="activity" tone={scoreTone} />
          </div>
        </article>

        <article className="workspace-section dashboard-workspaces-panel" aria-labelledby="recommended-workspaces-title">
          <div className="workspace-section-heading"><div><p className="workspace-eyebrow"><Icon name="grid" size={14} />{profile.heading}</p><h2 id="recommended-workspaces-title">{ui.recommendedWorkspaces}</h2><p>{ui.recommendedWorkspacesDescription}</p></div></div>
          <div className="role-priority-grid financial-priority-grid">
            {profile.workspace.map((item) => <Link href={item.href} key={item.label}><span className="workspace-link-icon"><Icon name={routeIcon(item.href)} size={17} /></span><div><strong>{item.label}</strong><p>{item.description}</p></div><Icon className="dashboard-arrow" name="arrow-right" size={15} /></Link>)}
          </div>
        </article>
      </section>

      <section className="workspace-section dashboard-module-launchpad" aria-labelledby="priority-modules-title">
        <div className="workspace-section-heading"><div><p className="workspace-eyebrow"><Icon name="grid" size={14} />ERP</p><h2 id="priority-modules-title">{ui.priorityModules}</h2></div><Link className="workspace-inline-action" href="/modules"><span>{d.viewAllModules}</span><Icon name="arrow-right" size={14} /></Link></div>
        <div className="module-preview-grid financial-module-grid">
          {roleModules.map((module) => { const copy = dictionary.moduleItems[module.slug]; return <Link href={`/modules/${module.slug}`} key={module.slug}><span className="workspace-link-icon"><Icon name={routeIcon(`/modules/${module.slug}`)} size={17} /></span><small>{d.phase} {module.phase}</small><strong>{copy.shortTitle}</strong><p>{copy.description}</p><b>{ui.exploreModule}<Icon name="arrow-right" size={14} /></b></Link>; })}
        </div>
      </section>

      <section className="workspace-section transactions-panel dashboard-transactions-panel" aria-labelledby="recent-transactions-title">
        <div className="workspace-section-heading"><div><p className="workspace-eyebrow"><Icon name="activity" size={14} />{ui.recentActivity}</p><h2 id="recent-transactions-title">{d.recentTransactions}</h2><p>{ui.recentActivityDescription}</p></div><Link className="workspace-inline-action" href="/finance/journals"><span>{ui.viewAll}</span><Icon name="arrow-right" size={14} /></Link></div>
        {snapshot.recentTransactions.length ? <div className="workspace-table-frame"><table className="workspace-data-table"><thead><tr><th>{ui.transaction}</th><th>{ui.category}</th><th>{ui.date}</th><th className="numeric-cell">{ui.amount}</th></tr></thead><tbody>{snapshot.recentTransactions.map((transaction) => <tr key={transaction.id}><td><div className="transaction-identity"><span className={`transaction-mark ${transaction.type}`}><Icon name={transaction.type === "income" ? "trending-up" : "trending-down"} size={15} /></span><div><strong>{transaction.description}</strong><small>{transaction.id}</small></div></div></td><td>{transaction.category}</td><td><time>{new Intl.DateTimeFormat(language === "am" ? "am-ET" : "en-ET", { dateStyle: "medium" }).format(new Date(transaction.date))}</time></td><td className={`numeric-cell amount-${transaction.type}`}>{transaction.type === "income" ? "+" : "−"} {money(transaction.amount, language)}</td></tr>)}</tbody></table></div> : <EmptyState icon="receipt" title={ui.noTransactions} description={ui.noTransactionsDescription} action={<Link className="secondary action-link" href="/finance/journals">{ui.viewAll}</Link>} />}
      </section>
    </main>
  );
}
