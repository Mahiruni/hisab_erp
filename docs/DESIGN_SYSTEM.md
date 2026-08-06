# Hisab ERP Design System

Hisab uses the `hisab-v1` design system for every authenticated ERP screen, setup flow and future module.

## Source of truth

- Semantic tokens live in `app/design-system.css`.
- Page and module styles must consume semantic tokens rather than introduce unrelated colors, spacing scales, radii or shadows.
- The root layout sets `data-design-system="hisab-v1"` on the document body.
- Existing compatibility aliases such as `--blue`, `--border` and `--muted` resolve to the semantic system.

## Foundations

### Color

Use tokens by purpose:

- Brand: `--ds-color-brand-*`
- Accent and interactive emphasis: `--ds-color-accent-*`
- Surfaces: `--ds-color-surface-*`
- Text: `--ds-color-text-*`
- Borders: `--ds-color-border`
- Status: `--ds-color-success-*`, `--ds-color-warning-*`, `--ds-color-danger-*`, `--ds-color-info-*`

Do not use status colors as decoration. A success, warning, danger or information color must communicate that state consistently.

### Spacing and sizing

Use the shared spacing scale `--ds-space-1` through `--ds-space-10`. New screens should not create a second arbitrary spacing system.

### Shape and elevation

Use `--ds-radius-*` and `--ds-shadow-*`. The visual hierarchy should normally be:

1. Canvas
2. Panel or card
3. Raised command or dialog surface

Avoid stacking multiple large shadows or decorative glass effects that reduce legibility.

### Typography

Use the application font stack and `--ds-font-size-*`. Keep financial values visually stronger than labels, and keep helper text readable in Amharic and Tigrinya.

## Reusable states

- `.ds-card` for a standard contained surface.
- `.ds-badge.success`, `.ds-badge.review`, `.ds-badge.info` for status labels.
- `:focus-visible` uses the shared focus ring and must never be removed without an accessible replacement.
- Disabled controls must remain distinguishable and explain why an action is unavailable when necessary.

## Release checklist

Every UI change must be reviewed for:

- Consistent semantic tokens and component states
- Desktop, tablet and mobile layouts
- English, Amharic and Tigrinya expansion
- Light and dark appearance where supported
- Keyboard navigation and visible focus
- Minimum contrast and clear status meaning
- Reduced-motion behavior
- Loading, empty, error, permission-denied and success states
- No accidental translation of user-entered business data

The CI localization and test gates protect part of this standard. Visual and accessibility review remains required for material interface changes.
