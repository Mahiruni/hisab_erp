export const AETHER_BRAND = {
  name: "AetherERP",
  shortName: "Aether",
  tagline: "One operating system for the entire company.",
  promise:
    "Finance, inventory, HR, CRM, manufacturing, procurement and analytics — one ledger, one truth, one command center.",
  essence: "Quiet power. Industrial elegance. Absolute clarity.",
  location: "Addis Ababa, Ethiopia",
  supportDomain: "hisabtech.com",
  colors: {
    void: "#07090C",
    ink: "#0C1117",
    raised: "#121821",
    paper: "#E8EEF4",
    mute: "#8B9BB0",
    accent: "#3EE0C4",
    gold: "#D4B483",
    danger: "#E26D6D",
    success: "#3DDC97",
  },
} as const;

/**
 * Internal legacy identifiers (database names, storage keys, migrations and
 * compatibility CSS selectors) are intentionally not renamed here. They are
 * implementation contracts, not customer-facing brand surfaces. Removing or
 * renaming them during a visual rebrand would introduce avoidable migration
 * and regression risk.
 */
export const LEGACY_COMPATIBILITY = {
  themeStorageKey: "hisab-theme",
  languageStorageKey: "hisab-erp-language",
  themeCookie: "hisab_theme",
  languageCookie: "hisab_locale",
} as const;
