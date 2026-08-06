#!/usr/bin/env python3
\"\"\"
Automated HisabERP homepage hero repair.

Run from the root of MahirG/HisabERP:
    python fix_hisab_homepage_hero.py

The script:
1. Adds the missing `.is-visible` reveal class.
2. Stops the broad executive marketing stylesheet from loading on `/`.
3. Adds a CSS visibility and spacing fallback.
4. Bumps the cache version for the final stability stylesheet.
\"\"\"

from pathlib import Path
import sys

CONTROLLER = Path("components/marketing-experience-controller.tsx")
STABILITY_CSS = Path("public/biloo-css-stability-fix.css")

REVEAL_OLD = '''    const revealImmediately = (element: HTMLElement) => {
      element.dataset.marketingRevealed = "true";
    };'''

REVEAL_NEW = '''    const revealImmediately = (element: HTMLElement) => {
      element.dataset.marketingRevealed = "true";
      element.classList.add("is-visible");
    };'''

EXECUTIVE_OLD = '''      <link rel="stylesheet" href="/biloo-executive-marketing.css?v=20260806-1" />'''

EXECUTIVE_NEW = '''      {pathname !== "/" ? (
        <link rel="stylesheet" href="/biloo-executive-marketing.css?v=20260806-1" />
      ) : null}'''

STABILITY_LINK_OLD = '''      <link rel="stylesheet" href="/biloo-css-stability-fix.css?v=20260806-2" />'''
STABILITY_LINK_NEW = '''      <link rel="stylesheet" href="/biloo-css-stability-fix.css?v=20260806-3" />'''

CSS_MARKER = "/* Homepage hero visibility fail-safe — 2026-08-06 */"
CSS_FIX = r'''

/* Homepage hero visibility fail-safe — 2026-08-06 */
.marketing-home-unified [data-reveal],
.marketing-home-unified [data-marketing-reveal="true"] {
  opacity: 1 !important;
  visibility: visible !important;
  filter: none !important;
  transform: none !important;
}

.marketing-home-unified #public-main-content,
.marketing-home-unified #public-main-content > :first-child {
  padding-top: 0 !important;
}

.marketing-home-unified #public-main-content {
  padding-bottom: 0 !important;
}

/*
 * The homepage has its own component-specific visual system.
 * Keep broad public-page card selectors from flattening the hero and dashboard
 * if an older cached document still references the executive stylesheet.
 */
.marketing-home-unified .wp-hero :is(
  .wp-app-window,
  .wp-app-chart-card,
  .wp-app-attention,
  .wp-float-card
) {
  min-height: initial;
}

.marketing-home-unified .wp-hero-copy,
.marketing-home-unified .wp-hero-visual {
  display: block;
  opacity: 1 !important;
  visibility: visible !important;
}
'''

def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count == 0:
        if new in text:
            print(f"✓ {label} already applied")
            return text
        raise RuntimeError(f"Could not find expected {label} source block.")
    if count > 1:
        raise RuntimeError(f"Found {count} copies of {label}; refusing an ambiguous edit.")
    print(f"✓ Applied {label}")
    return text.replace(old, new, 1)

def main() -> int:
    if not CONTROLLER.exists() or not STABILITY_CSS.exists():
        print(
            "Error: run this script from the root of the HisabERP repository.\n"
            f"Missing: {[str(p) for p in (CONTROLLER, STABILITY_CSS) if not p.exists()]}",
            file=sys.stderr,
        )
        return 1

    controller = CONTROLLER.read_text(encoding="utf-8")
    controller = replace_once(
        controller, REVEAL_OLD, REVEAL_NEW, "reveal class repair"
    )
    controller = replace_once(
        controller, EXECUTIVE_OLD, EXECUTIVE_NEW, "homepage stylesheet isolation"
    )
    controller = replace_once(
        controller, STABILITY_LINK_OLD, STABILITY_LINK_NEW, "CSS cache-version bump"
    )

    css = STABILITY_CSS.read_text(encoding="utf-8")
    if CSS_MARKER not in css:
        css = css.rstrip() + CSS_FIX + "\n"
        print("✓ Added homepage visibility and spacing fail-safe")
    else:
        print("✓ Homepage CSS fail-safe already applied")

    CONTROLLER.write_text(controller, encoding="utf-8")
    STABILITY_CSS.write_text(css, encoding="utf-8")

    print(
        "\nRepair complete.\n"
        "Review the changes, then commit and push:\n"
        "  git diff\n"
        "  git add components/marketing-experience-controller.tsx "
        "public/biloo-css-stability-fix.css\n"
        '  git commit -m "fix: restore marketing homepage hero"\n'
        "  git push origin main"
    )
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
