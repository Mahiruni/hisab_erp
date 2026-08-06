# Professional Translation Review

Hisab supports English, Amharic and Tigrinya across the ERP interface. Automated coverage and quality checks are mandatory, but they do not constitute professional linguistic certification.

## Automated release gates

The CI pipeline verifies:

- Every detected visible interface string has Amharic and Tigrinya coverage.
- Source and translated interpolation placeholders match.
- Required translation fields are not empty.
- Translation catalogs are valid JSON.
- Potential encoding, duplicate, identical-source and spacing issues are reported for review.
- TypeScript, tests and the production build pass after localization changes.

## Required human review

Before a language is described as professionally reviewed, assign a qualified native-language reviewer for that language. For financial, tax, payroll or legal terminology, include a reviewer with relevant subject-matter experience.

The reviewer should assess the application in context, not only the catalog files:

1. Navigation, dashboard and role-specific workspaces
2. Company setup and production controls
3. Finance, journals, tax, invoicing and reports
4. Sales, purchasing, inventory and customer records
5. Payroll, employee data and security messages
6. Dates, numbers, ETB formatting and pluralization
7. Button labels, placeholders, tooltips and accessibility labels
8. Mobile truncation, wrapping and visual hierarchy
9. Consistent terminology, tone and formality
10. User-entered data that must remain untranslated

## Sign-off record

Record one sign-off per language and release:

- Language
- Reviewer name
- Reviewer qualification or relationship to the language and domain
- Review date
- Application version and Git commit SHA
- Screens and workflows reviewed
- Approved glossary or terminology decisions
- Known exceptions and their rationale
- Corrections completed after review
- Final status: approved, approved with exceptions, or changes required

## Status language

Use these descriptions accurately:

- **Translation coverage complete**: all detected source strings have catalog entries.
- **Automated quality checks passed**: machine-verifiable catalog rules passed.
- **Professional review pending**: a qualified human has not signed off.
- **Professionally reviewed**: named reviewers completed and recorded the process above.

Never describe generated or automated translations as professionally certified without documented human approval.
