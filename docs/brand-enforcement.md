# Hisab brand enforcement

The application uses one visual identity across the public website, authentication and authenticated ERP workspace.

- Primary: `#DA7757`
- Charcoal: `#171717`
- Supporting values are lighter or darker shades of the same terracotta hue.
- Neutral surfaces may use white, cream, charcoal and grayscale values.
- The official SVG logo is transparent and must not be placed inside a white tile.
- Semantic states use labels and icons for meaning while remaining inside the Hisab terracotta family.

`app/strict-brand.css` is intentionally imported last in `app/layout.tsx` so legacy module styles cannot reintroduce unrelated accent colors.
