import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export type WorkspaceTone = "neutral" | "success" | "warning" | "danger" | "info";

export function WorkspacePageHeader({
  breadcrumb,
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  breadcrumb?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="workspace-page-header">
      <div className="workspace-page-header-copy">
        {breadcrumb ? <nav className="workspace-breadcrumb" aria-label="Breadcrumb">{breadcrumb}</nav> : null}
        {eyebrow ? <div className="workspace-eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <p className="workspace-page-description">{description}</p> : null}
        {meta ? <div className="workspace-page-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="workspace-page-actions">{actions}</div> : null}
    </header>
  );
}

export function MetricTile({
  label,
  value,
  detail,
  icon,
  tone = "neutral",
}: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  icon: IconName;
  tone?: WorkspaceTone;
}) {
  return (
    <article className={`workspace-metric-tile tone-${tone}`}>
      <div className="workspace-metric-heading">
        <span className="workspace-metric-icon" aria-hidden="true"><Icon name={icon} size={16} /></span>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export function StatusBadge({ label, tone = "neutral" }: { label: ReactNode; tone?: WorkspaceTone }) {
  return <span className={`workspace-status-badge tone-${tone}`}>{label}</span>;
}

export function ActionAlert({
  title,
  description,
  href,
  actionLabel,
  icon,
  tone = "neutral",
  value,
}: {
  title: ReactNode;
  description: ReactNode;
  href: string;
  actionLabel: ReactNode;
  icon: IconName;
  tone?: WorkspaceTone;
  value?: ReactNode;
}) {
  return (
    <article className={`workspace-action-alert tone-${tone}`}>
      <span className="workspace-action-alert-icon" aria-hidden="true"><Icon name={icon} size={17} /></span>
      <div className="workspace-action-alert-copy">
        <div>
          <strong>{title}</strong>
          {value ? <b>{value}</b> : null}
        </div>
        <p>{description}</p>
      </div>
      <Link href={href} className="workspace-inline-action">
        <span>{actionLabel}</span>
        <Icon name="arrow-right" size={14} />
      </Link>
    </article>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="workspace-empty-state">
      <span aria-hidden="true"><Icon name={icon} size={20} /></span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
