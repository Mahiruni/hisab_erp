# Hisab ERP localization

Hisab ERP supports English (`en`), Amharic (`am`) and Tigrinya (`ti`) across the complete application interface.

## Runtime behavior

- The language selector stores the selected locale in both `localStorage` and the `hisab_locale` cookie.
- `LanguageProvider` translates known visible text, page titles, placeholders, accessible labels, tooltips and image alternative text.
- A `MutationObserver` applies the same translation rules to dialogs, notices, table rows and other interface content inserted after the page first renders.
- Changing back to English restores the original source text.
- Server Components and Server Actions can use `getServerTranslator()` from `lib/server-translations.ts`.
- Client Components can use `t()` from `useLanguage()`.

## Adding or updating interface copy

1. Write the English source text in the page or component.
2. Add one `{ source, am, ti }` entry to the next `lib/locales/ui-catalog-*.json` catalog.
3. Run `npm run i18n:check`.
4. Commit only after the check reports zero missing strings.

The normal GitHub CI workflow runs the same check. A pull request cannot pass if a new visible English string has no Amharic and Tigrinya translation.

## Dynamic copy

Use the translator for values assembled at runtime:

```tsx
const { t } = useLanguage();
return <p>{t("{count} invoices posted", { count })}</p>;
```

```ts
const { t } = await getServerTranslator();
const message = t("{count} invoices posted", { count });
```

Catalog placeholders can be named (`{count}`) or numeric (`{0}`). Placeholder values are preserved in every language.

## Content that must not be translated

User-entered names, legal company names, product SKUs, account numbers, database identifiers, source code and imported business data should remain unchanged. Wrap exceptional interface regions with `data-i18n-skip`:

```tsx
<span data-i18n-skip>{customer.legalName}</span>
```

The automatic localizer already skips `code`, `pre`, `script`, `style`, `textarea` and editable content.

## Commands

- `npm run i18n:report` — generate the coverage report without failing.
- `npm run i18n:check` — generate the report and fail when coverage is incomplete.
- `npm run check` — localization, TypeScript, tests and production build.
