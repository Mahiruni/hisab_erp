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

function migrateTextNode(node: Node) {
  if (node.nodeType !== Node.TEXT_NODE) return;
  const parent = node.parentElement;
  if (!parent || parent.closest("script,style,code,pre,textarea,[data-brand-migration-ignore]")) return;
  const current = node.nodeValue || "";
  const next = migrateText(current);
  if (next !== current) node.nodeValue = next;
}

function migrateElement(element: Element) {
  for (const attribute of ["aria-label", "title", "alt"]) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const next = migrateText(current);
    if (next !== current) element.setAttribute(attribute, next);
  }

  if (element instanceof HTMLImageElement && /hisab-logo\.svg(?:\?|$)/i.test(element.getAttribute("src") || "")) {
    element.src = "/aether-logo.svg";
    element.classList.remove("hisab-logo");
    element.classList.add("aether-logo");
  }
}

function migrateSubtree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    migrateTextNode(root);
    return;
  }
  if (!(root instanceof Element)) return;

  migrateElement(root);

  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode = textWalker.nextNode();
  while (textNode) {
    migrateTextNode(textNode);
    textNode = textWalker.nextNode();
  }

  root.querySelectorAll("[aria-label],[title],[alt],img").forEach(migrateElement);
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
    migrateSubtree(document.body);

    let scheduled = 0;
    const pending = new Set<Node>();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") pending.add(mutation.target);
        mutation.addedNodes.forEach((node) => pending.add(node));
      }
      if (scheduled) return;
      scheduled = window.requestAnimationFrame(() => {
        scheduled = 0;
        pending.forEach(migrateSubtree);
        pending.clear();
      });
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      if (scheduled) window.cancelAnimationFrame(scheduled);
      pending.clear();
      observer.disconnect();
    };
  }, []);

  return null;
}
