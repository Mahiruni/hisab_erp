"use client";

import { useEffect } from "react";

const replacements: Array<[RegExp, string]> = [
  [/Hisab Technologies/g, "AetherERP"],
  [/HisabTech/g, "AetherERP"],
  [/Hisab ERP/g, "AetherERP"],
  [/\bHisab\b/g, "AetherERP"],
  [/\bhisab\b/g, "AetherERP"],
];

function migrateText(value: string) {
  return replacements.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), value);
}

function migrateNode(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    const parent = root.parentElement;
    if (!parent || parent.closest("script,style,code,pre,textarea,[data-brand-migration-ignore]")) return;
    const current = root.nodeValue || "";
    const next = migrateText(current);
    if (next !== current) root.nodeValue = next;
    return;
  }

  if (!(root instanceof Element)) return;

  for (const attribute of ["aria-label", "title", "alt"]) {
    const current = root.getAttribute(attribute);
    if (!current) continue;
    const next = migrateText(current);
    if (next !== current) root.setAttribute(attribute, next);
  }

  if (root instanceof HTMLImageElement && /hisab-logo\.svg(?:\?|$)/i.test(root.getAttribute("src") || "")) {
    root.src = "/aether-logo.svg";
    root.classList.remove("hisab-logo");
    root.classList.add("aether-logo");
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    migrateNode(node);
    node = walker.nextNode();
  }

  root.querySelectorAll<HTMLElement>("[aria-label],[title],[alt],img").forEach((element) => {
    if (element !== root) migrateNode(element);
  });
}

/**
 * Transitional guard for a large in-place enterprise rebrand.
 *
 * Accounting/database/storage identifiers intentionally retain historical
 * names for migration safety, while this guard prevents retired customer-
 * facing product names and logos from leaking through less frequently used
 * routes that still contain legacy literal copy. Central surfaces are also
 * migrated in source and this component can be removed once the repository-
 * wide text migration is complete.
 */
export function AetherBrandMigrationGuard() {
  useEffect(() => {
    migrateNode(document.body);

    let scheduled = 0;
    const observer = new MutationObserver((mutations) => {
      if (scheduled) return;
      scheduled = window.requestAnimationFrame(() => {
        scheduled = 0;
        for (const mutation of mutations) {
          if (mutation.type === "characterData") migrateNode(mutation.target);
          mutation.addedNodes.forEach(migrateNode);
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      if (scheduled) window.cancelAnimationFrame(scheduled);
      observer.disconnect();
    };
  }, []);

  return null;
}
