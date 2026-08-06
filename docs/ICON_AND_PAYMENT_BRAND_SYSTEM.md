# HisabTech icon and payment-brand system

## Product icon rules

HisabTech uses one curated Lucide-style outline component in `components/ui/icon.tsx`.

- Navigation icons: 20px.
- Dashboard and prominent status icons: 20–24px.
- Buttons, inputs, filters and compact actions: 16–20px.
- One 24px SVG grid, round line caps and joins, and a 1.8 stroke weight.
- Product icons use `currentColor` so light and dark modes remain consistent.
- Decorative icons are hidden from assistive technology. Meaningful standalone icons must receive a `label`.
- Icons supplement visible text; they do not replace critical labels.
- Payment trademarks must never be added to the product icon map.

The curated paths follow the Lucide visual language and are used under the ISC license. Keeping the small internal set avoids package and lockfile churn while preserving a single, auditable system.

## Payment brand rules

Payment trademarks are isolated in `components/payment-brand.tsx`.

### Telebirr

- The displayed image is the official PNG published by Ethio telecom.
- Telebirr is highlighted as the primary local payment rail.
- The logo is not recolored, cropped, redrawn or converted into a custom SVG.
- The CSP permits only the exact Ethio telecom image origin required by this asset.

Official source: `https://www.ethiotelecom.et/wp-content/uploads/2025/10/telebirr-logo-01.png`

### Safaricom M-PESA

- Safaricom publishes an official M-PESA brand-asset page, but its download endpoint blocks automated retrieval.
- HisabTech deliberately displays an `Official logo upload required` state rather than using a third-party or reconstructed logo.
- Replace that state only with the exact official file supplied by Safaricom or the approved merchant account owner.

Official source page: `https://www.safaricom.co.ke/brand-assets?id=2021`

### Visa, Mastercard, Apple Pay and Google Pay

These methods are not currently exposed as supported HisabTech checkout rails. Their marks must not be displayed as decoration or imply payment capability. When a card or wallet integration is approved:

1. Obtain the exact acceptance mark from the official brand owner.
2. Store or serve it according to that owner's current guidelines.
3. Preserve aspect ratio, minimum size, clear space and contrast.
4. Add the method only where the corresponding payment flow is operational.
5. Never label a Visa payment as `Safari` or use a telecommunications brand in place of a card network.

## Interaction standard

- Brand methods are presented in a clean horizontal row on wide screens and a single column on small screens.
- Every method receives a visible text label.
- Hover and keyboard-focus states are subtle and consistent.
- Loading uses the shared rotating outline icon rather than a new spinner style.
- Dark mode changes the container surface, not the trademark artwork.

## Review checklist

- No emoji or Unicode glyph is used as a functional UI icon.
- No brand mark exists inside `components/ui/icon.tsx`.
- No unsupported payment method is advertised.
- Icon-only controls have an accessible name.
- Navigation and button icons remain within the documented size range.
- Official brand artwork remains unmodified.
