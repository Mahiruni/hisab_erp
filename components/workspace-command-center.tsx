"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { UserContext } from "../lib/data/types";
import { HelpCenterPanel } from "./help-center-panel";
import { useLanguage } from "./language-provider";
import { Icon, type IconName } from "./ui/icon";

export type WorkspaceCommandItem = {
  label: string;
  href: string;
  icon: IconName;
  group: string;
  description?: string;
};

type Surface = "search" | "help" | "advice" | "ai" | null;
type SearchResult = WorkspaceCommandItem & { action?: Exclude<Surface, "search" | null> };
type AssistantMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  href?: string;
  actionLabel?: string;
};

type Props = {
  items: WorkspaceCommandItem[];
  activeLabel: string;
  pathname: string;
  user: UserContext;
};

const shortcutItems: WorkspaceCommandItem[] = [
  {
    label: "Create sales invoice",
    href: "/sales/invoices/new",
    icon: "plus",
    group: "Quick actions",
    description: "Start a protected customer invoice workflow.",
  },
  {
    label: "Open account security",
    href: "/account",
    icon: "shield-check",
    group: "Quick actions",
    description: "Review MFA, identity, and session assurance.",
  },
  {
    label: "Review production controls",
    href: "/security",
    icon: "activity",
    group: "Quick actions",
    description: "Inspect alerts, backups, audit evidence, and database health.",
  },
  {
    label: "Open financial reports",
    href: "/reports",
    icon: "chart",
    group: "Quick actions",
    description: "Review performance and export the reporting package.",
  },
];

function roleName(role: UserContext["role"]) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function adviceFor(pathname: string, role: UserContext["role"]) {
  if (pathname.startsWith("/finance")) {
    return [
      {
        title: "Confirm the accounting period",
        copy: "Check that the posting date belongs to an open period before creating or approving entries.",
        href: "/finance",
        icon: "landmark" as IconName,
      },
      {
        title: "Validate journal balance",
        copy: "Review debit and credit totals, references, and supporting evidence before posting.",
        href: "/finance/journals",
        icon: "file-check" as IconName,
      },
      {
        title: "Review financial output",
        copy: "Use reports after posting to confirm the operating result and account movement.",
        href: "/reports",
        icon: "chart" as IconName,
      },
    ];
  }

  if (pathname.startsWith("/inventory") || role === "inventory") {
    return [
      {
        title: "Review stock exceptions",
        copy: "Prioritize low-stock products, reorder levels, and any unexpected warehouse movements.",
        href: "/inventory",
        icon: "boxes" as IconName,
      },
      {
        title: "Check purchasing pressure",
        copy: "Compare replenishment requirements with open purchasing activity before ordering.",
        href: "/purchasing",
        icon: "receipt" as IconName,
      },
      {
        title: "Protect inventory controls",
        copy: "Confirm negative-stock prevention, valuation, and audit controls remain active.",
        href: "/modules/inventory-warehouse",
        icon: "shield-check" as IconName,
      },
    ];
  }

  if (pathname.startsWith("/sales") || pathname.startsWith("/customers") || role === "sales") {
    return [
      {
        title: "Confirm customer terms",
        copy: "Review the customer, credit limit, contact details, and outstanding exposure before invoicing.",
        href: "/customers",
        icon: "users" as IconName,
      },
      {
        title: "Create a complete invoice",
        copy: "Verify product availability, quantity, price, VAT, and notes before posting.",
        href: "/sales/invoices/new",
        icon: "file-check" as IconName,
      },
      {
        title: "Follow collection signals",
        copy: "Review receivables and overdue balances after new sales are posted.",
        href: "/reports",
        icon: "trending-up" as IconName,
      },
    ];
  }

  if (pathname.startsWith("/security") || pathname.startsWith("/account")) {
    return [
      {
        title: "Complete administrator MFA",
        copy: "Privileged users should verify authenticator MFA before changing sensitive records.",
        href: "/account",
        icon: "shield-check" as IconName,
      },
      {
        title: "Review backup evidence",
        copy: "Confirm the latest backup and restore-test evidence before relying on production data.",
        href: "/security",
        icon: "rotate-ccw" as IconName,
      },
      {
        title: "Inspect security alerts",
        copy: "Resolve critical login, financial, and database warnings before normal operations continue.",
        href: "/security",
        icon: "alert-triangle" as IconName,
      },
    ];
  }

  return [
    {
      title: "Review business health",
      copy: "Check cash, revenue, expenses, and receivables before choosing the next operational action.",
      href: "/",
      icon: "activity" as IconName,
    },
    {
      title: "Complete critical setup",
      copy: "Resolve security, backup, MFA, and company-setup warnings before production use.",
      href: "/onboarding",
      icon: "building" as IconName,
    },
    {
      title: "Continue the operating workflow",
      copy: "Use search to open the correct module, then complete and review the transaction before posting.",
      href: "/modules",
      icon: "workflow" as IconName,
    },
  ];
}

function assistantReply(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("invoice") || normalized.includes("sale")) {
    return {
      text: "Open invoice creation to choose a customer, product, quantity, VAT rate, and notes. Review stock availability and totals before posting.",
      href: "/sales/invoices/new",
      actionLabel: "Open invoice creation",
    };
  }
  if (normalized.includes("security") || normalized.includes("mfa") || normalized.includes("backup")) {
    return {
      text: "Review Account Security for MFA and session assurance, then open Production Controls for alerts, backups, restore evidence, and database health.",
      href: "/security",
      actionLabel: "Review production controls",
    };
  }
  if (normalized.includes("inventory") || normalized.includes("stock") || normalized.includes("warehouse")) {
    return {
      text: "Open Inventory to review products, stock positions, reorder levels, and warehouse movements. Investigate exceptions before creating purchasing activity.",
      href: "/inventory",
      actionLabel: "Open inventory",
    };
  }
  if (normalized.includes("report") || normalized.includes("profit") || normalized.includes("performance")) {
    return {
      text: "Open Reports to review sales, expenses, operating result, and the current export package. Confirm that recent transactions are posted first.",
      href: "/reports",
      actionLabel: "Open reports",
    };
  }
  if (normalized.includes("customer") || normalized.includes("credit")) {
    return {
      text: "Open Customers to review contact details, credit limits, and exposure before creating the next sales document.",
      href: "/customers",
      actionLabel: "Open customers",
    };
  }

  return {
    text: "Use global search to open any module, or ask about invoices, finance, inventory, reports, customers, security, or production controls.",
    href: "/modules",
    actionLabel: "Browse ERP modules",
  };
}

export function WorkspaceCommandCenter({ items, activeLabel, pathname, user }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [surface, setSurface] = useState<Surface>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [assistantInput, setAssistantInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const assistantInputRef = useRef<HTMLInputElement>(null);

  const utilityResults = useMemo<SearchResult[]>(() => [
    {
      label: t("Open Help Center"),
      href: "#help",
      icon: "circle-help",
      group: t("Workspace tools"),
      description: t("Open guides, setup documentation, and keyboard shortcuts."),
      action: "help",
    },
    {
      label: t("Open Advice Center"),
      href: "#advice",
      icon: "lightbulb",
      group: t("Workspace tools"),
      description: t("See context-aware recommendations for the current workspace."),
      action: "advice",
    },
    {
      label: t("Open Hisab AI"),
      href: "#ai",
      icon: "sparkles",
      group: t("Workspace tools"),
      description: t("Ask for read-only workflow guidance and navigation help."),
      action: "ai",
    },
  ], [t]);

  const searchableItems = useMemo<SearchResult[]>(
    () => [...items, ...shortcutItems, ...utilityResults],
    [items, utilityResults],
  );

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchableItems.slice(0, 12);
    return searchableItems.filter((item) =>
      `${item.label} ${item.group} ${item.description ?? ""} ${item.href}`.toLowerCase().includes(normalized),
    ).slice(0, 18);
  }, [query, searchableItems]);

  const recommendations = useMemo(() => adviceFor(pathname, user.role), [pathname, user.role]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSurface("search");
      }
      if (event.key === "Escape") setSurface(null);
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!surface) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      if (surface === "search") searchInputRef.current?.focus();
      if (surface === "ai") assistantInputRef.current?.focus();
    }, 40);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [surface]);

  useEffect(() => setActiveIndex(0), [query]);

  function closeSurface() {
    setSurface(null);
    setQuery("");
  }

  function executeResult(item: SearchResult) {
    if (item.action) {
      setSurface(item.action);
      setQuery("");
      return;
    }
    closeSurface();
    router.push(item.href);
  }

  function handleSearchKeys(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(filteredItems.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && filteredItems[activeIndex]) {
      event.preventDefault();
      executeResult(filteredItems[activeIndex]);
    }
  }

  function askAssistant(prompt: string) {
    const value = prompt.trim();
    if (!value) return;
    const response = assistantReply(value);
    const timestamp = Date.now();
    setMessages((current) => [
      ...current,
      { id: `user-${timestamp}`, role: "user", text: value },
      { id: `assistant-${timestamp}`, role: "assistant", ...response },
    ]);
    setAssistantInput("");
  }

  function submitAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    askAssistant(assistantInput);
  }

  const initialAssistantMessage = t("Ask me how to navigate this workspace, complete a workflow, or review a control.");

  return (
    <>
      <header className="workspace-command-header" aria-label={t("Workspace command header")}>
        <button className="workspace-search-trigger" type="button" onClick={() => setSurface("search")} aria-label={t("Open global search")}>
          <Icon name="search" size={17} />
          <span>{t("Search or jump to…")}</span>
          <kbd><span>Ctrl</span><b>K</b></kbd>
        </button>
        <nav className="workspace-header-actions" aria-label={t("Workspace assistance")}>
          <button type="button" onClick={() => setSurface("help")} title={t("Help Center")}>
            <Icon name="circle-help" size={18} />
            <span>{t("Help")}</span>
          </button>
          <button type="button" onClick={() => setSurface("advice")} title={t("Advice Center")}>
            <Icon name="lightbulb" size={18} />
            <span>{t("Advice")}</span>
          </button>
          <button className="workspace-ai-trigger" type="button" onClick={() => setSurface("ai")} title={t("Hisab AI")}>
            <Icon name="sparkles" size={18} />
            <span>{t("AI Assistant")}</span>
          </button>
        </nav>
      </header>

      <button className="mobile-command-trigger" type="button" onClick={() => setSurface("search")} aria-label={t("Open global search")}>
        <Icon name="search" size={19} />
      </button>

      {surface && <button className="workspace-surface-backdrop" type="button" aria-label={t("Close active panel")} onClick={closeSurface} />}

      {surface === "search" && (
        <section className="workspace-command-dialog" role="dialog" aria-modal="true" aria-labelledby="workspace-search-title">
          <div className="command-dialog-heading">
            <div>
              <strong id="workspace-search-title">{t("Search HisabTech")}</strong>
              <span>{t("Find pages, modules, reports, and actions.")}</span>
            </div>
            <button type="button" onClick={closeSurface} aria-label={t("Close active panel")}><Icon name="x" size={18} /></button>
          </div>
          <label className="command-search-field">
            <Icon name="search" size={19} />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeys}
              placeholder={t("Type a page or action…")}
              aria-controls="workspace-command-results"
            />
            <kbd>ESC</kbd>
          </label>
          <div className="command-results" id="workspace-command-results" role="listbox">
            {filteredItems.length ? filteredItems.map((item, index) => (
              <button
                type="button"
                key={`${item.href}-${item.label}`}
                className={index === activeIndex ? "active" : undefined}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => executeResult(item)}
                role="option"
                aria-selected={index === activeIndex}
              >
                <span className="command-result-icon"><Icon name={item.icon} size={18} /></span>
                <span className="command-result-copy"><strong>{item.label}</strong><small>{item.description ?? item.group}</small></span>
                <span className="command-result-group">{item.group}</span>
                <Icon name="arrow-right" size={15} />
              </button>
            )) : (
              <div className="command-empty"><Icon name="search" size={22} /><strong>{t("No matching pages or actions.")}</strong></div>
            )}
          </div>
          <footer className="command-dialog-footer">
            <span><kbd>↑</kbd><kbd>↓</kbd>{t("Navigate")}</span>
            <span><kbd>↵</kbd>{t("Select")}</span>
            <span><kbd>ESC</kbd>{t("Close")}</span>
          </footer>
        </section>
      )}

      {surface && surface !== "search" && (
        <aside className={`workspace-assistance-panel workspace-assistance-${surface}`} role="dialog" aria-modal="true" aria-labelledby={`workspace-${surface}-title`}>
          <header>
            <div className="assistance-title-icon"><Icon name={surface === "help" ? "circle-help" : surface === "advice" ? "lightbulb" : "sparkles"} size={20} /></div>
            <div>
              <strong id={`workspace-${surface}-title`}>
                {surface === "help" ? t("Help Center") : surface === "advice" ? t("Advice Center") : t("Hisab AI")}
              </strong>
              <span>
                {surface === "help"
                  ? t("Guides and shortcuts for using HisabTech safely.")
                  : surface === "advice"
                    ? t("Recommended next steps for this workspace.")
                    : t("Context-aware guidance for {0}.", [activeLabel])}
              </span>
            </div>
            <button type="button" onClick={closeSurface} aria-label={t("Close active panel")}><Icon name="x" size={19} /></button>
          </header>

          {surface === "help" && <HelpCenterPanel activeLabel={activeLabel} onNavigate={closeSurface} />}

          {surface === "advice" && (
            <div className="assistance-panel-body">
              <div className="advice-context"><Icon name="activity" size={17} /><span>{t("Based on {0} and the {1} role.", [activeLabel, roleName(user.role)])}</span></div>
              <div className="advice-list">
                {recommendations.map((recommendation, index) => (
                  <Link href={recommendation.href} onClick={closeSurface} key={recommendation.title}>
                    <span className="advice-step">0{index + 1}</span>
                    <span className="advice-icon"><Icon name={recommendation.icon} size={19} /></span>
                    <span><strong>{t(recommendation.title)}</strong><small>{t(recommendation.copy)}</small></span>
                    <Icon name="chevron-right" size={17} />
                  </Link>
                ))}
              </div>
              <small className="assistance-disclaimer">{t("Advice is read-only and does not change business records.")}</small>
            </div>
          )}

          {surface === "ai" && (
            <div className="assistance-panel-body ai-assistance-body">
              <div className="ai-safety-note"><Icon name="shield-check" size={17} /><span><strong>{t("Read-only guidance")}</strong><small>{t("The assistant can explain workflows and take you to the right page. It never posts or edits records.")}</small></span></div>
              <div className="assistant-messages" aria-live="polite">
                <article className="assistant-message assistant"><span><Icon name="sparkles" size={15} /></span><p>{initialAssistantMessage}</p></article>
                {messages.map((message) => (
                  <article className={`assistant-message ${message.role}`} key={message.id}>
                    <span>{message.role === "assistant" ? <Icon name="sparkles" size={15} /> : user.fullName.charAt(0).toUpperCase()}</span>
                    <div>
                      <p>{message.role === "assistant" ? t(message.text) : message.text}</p>
                      {message.href && message.actionLabel && <Link href={message.href} onClick={closeSurface}>{t(message.actionLabel)}<Icon name="arrow-right" size={15} /></Link>}
                    </div>
                  </article>
                ))}
              </div>
              {!messages.length && (
                <div className="assistant-suggestions">
                  <p>{t("Suggested questions")}</p>
                  {["How do I create an invoice?", "Where do I review security controls?", "How do I check inventory?", "Show me financial reports."].map((prompt) => (
                    <button type="button" key={prompt} onClick={() => askAssistant(prompt)}>{t(prompt)}</button>
                  ))}
                </div>
              )}
              <form className="assistant-composer" onSubmit={submitAssistant}>
                <input ref={assistantInputRef} value={assistantInput} onChange={(event) => setAssistantInput(event.target.value)} placeholder={t("Ask about this workspace…")} />
                <button type="submit" disabled={!assistantInput.trim()} aria-label={t("Send question")}><Icon name="arrow-right" size={18} /></button>
              </form>
            </div>
          )}
        </aside>
      )}
    </>
  );
}
