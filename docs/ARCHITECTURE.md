# Architecture

This guide describes the implemented source architecture and how the app's screens, data access, and local database fit together.

## Application startup

- `index.js` registers the root component named in `app.json`.
- `App.tsx` wraps the application in `SafeAreaProvider`, initializes SQLite through `runMigrations()`, calls `seedDemoData()`, and provides the theme and toast contexts.
- `src/navigation/AppNavigator.tsx` configures React Navigation and the app theme.
- `src/navigation/BottomTabNavigator.tsx` defines the main tab navigation. `SalesStackNavigator.tsx` and `MoreStackNavigator.tsx` register feature stacks.

## Data flow

The common design separates screens, hooks, repositories, and the database:

1. Screens under `src/screens/` render the feature UI.
2. Reusable hooks under `src/hooks/` coordinate loading and refresh state where used.
3. Repositories under `src/database/repositories/` contain SQLite queries and business data operations.
4. `src/database/database.ts` opens the local `business_manager.sqlite` database with `@op-engineering/op-sqlite`.
5. `src/database/migrations/index.ts` tracks schema version and applies migrations. The current migration sequence reaches schema version 8.

This is a summary of the dominant structure, not a claim that every screen uses an identical layer sequence.

## Technology choices and rationale

The stack is selected to support a customizable, local-first native app template. These are project-specific trade-offs, not claims that one library is universally better than every alternative.

### React Native Community CLI

The project uses the React Native Community CLI so Android and iOS native projects, build configuration, and release settings are part of the source package and can be customized directly. This is useful for a commercial template that buyers may need to rebrand, configure, sign, and extend for their own distribution workflow. The trade-off is that native toolchains such as Android Studio/Gradle and Xcode/CocoaPods must be configured when building for the respective platforms.

### OP-SQLite

The app uses `@op-engineering/op-sqlite` for on-device SQLite storage. A relational database fits business records such as customers, products, invoices, line items, and payments, where relationships and transactional updates matter. OP-SQLite provides a native React Native integration for Android and iOS and supports direct SQL-based data access.

The library was selected for its platform support and fit with the local SQLite data layer. Before upgrading, check the [OP-SQLite repository](https://github.com/OP-Engineering/op-sqlite), [installation documentation](https://op-engineering.github.io/op-sqlite/docs/installation/), and the project's compatibility notes. Because it contains native code, dependency changes may require a native rebuild and platform-specific verification.

### Local-first storage

Core business workflows use a database on the device instead of requiring a buyer to create and pay for a hosted backend before the app can run. This keeps the template self-contained and makes it easier to customize for different businesses. The trade-off is that data is not automatically synchronized across devices or backed up to the cloud; users must export and safely store backups separately.

### TypeScript

TypeScript adds explicit types to screens, navigation, data models, and repository interfaces. This helps developers understand how data moves through the app and makes changes to a template safer to maintain, although types do not replace runtime validation or business-rule testing.

### React Navigation

React Navigation provides the app's tab and stack navigation structure. This separates major app areas from the deeper screens within each workflow and gives buyers established navigation patterns they can extend.

### Centralized theme and configuration

Branding and presentation defaults are organized in configuration and theme files rather than being intentionally scattered across every screen. This gives buyers a more consistent starting point for changing colors, typography, and formatting. See the [Customization Guide](CUSTOMIZATION.md) for the concrete files and examples.

### PDF generation

Invoice PDFs are generated locally with `pdf-lib` and `@pdf-lib/fontkit`, using bundled font data and business/invoice information from the app. The key requirement was **creating and laying out new PDF documents**, rather than displaying PDFs that already exist. The React Native packages considered during the search served a different purpose: [`react-native-pdf`](https://www.npmjs.com/package/react-native-pdf) describes itself as a PDF viewing component, while [`react-native-pdf-renderer`](https://www.npmjs.com/package/react-native-pdf-renderer) focuses on native PDF rendering. Their viewer/rendering focus did not meet the invoice-generation requirement by itself.

`pdf-lib` was selected because it can create PDF documents, draw text and graphics, embed fonts, and has documented React Native support. [`@pdf-lib/fontkit`](https://www.npmjs.com/package/@pdf-lib/fontkit) enables custom font embedding, which is useful for invoice typography and character coverage. This decision is based on feature fit and the app's tested implementation, **not a claim that `pdf-lib` has the most active release cadence**. Check current compatibility and project activity before changing PDF dependencies. Buyers who customize invoice layouts or fonts should test long descriptions, totals, special characters, and output on their target devices.

## Local persistence and data model

The schema includes business settings, customers, products, sales and sale items, invoices and invoice items, payments, and app preferences. The schema defines one business settings row per installation. SQLite foreign-key enforcement is enabled in `src/database/database.ts`.

There is no hosted backend or cloud synchronization layer defined for the core workflows in the reviewed startup and database code. Data persists in the local app database across ordinary app restarts, but uninstalling the app or losing the device can remove access to that database; exported backups must be stored separately.

## Important relationships and document lifecycle

- A customer may be referenced by sales and invoices; customer references may be nullable where allowed by the schema.
- Sale items belong to a sale and can reference a product. Invoice items belong to an invoice and can reference a product.
- Payments reference invoices. Payment records contribute to the invoice's recorded paid amount/status through the payment workflow.
- Stock handling occurs in sale/invoice workflows; invoice stock is deducted when an invoice is issued, and cancellation restores the recorded deducted quantity. Verify these lifecycle rules in the current repositories before modifying them.

## Demo data

`App.tsx` calls `seedDemoData()` after migrations. The seeder exits when the business settings already contain a business name or when relevant business records already exist; otherwise it inserts the sample dataset and default settings. Review these conditions before changing first-run behavior.

## PDFs

`src/services/pdf/invoicePdfService.ts` loads invoice, customer, and business settings through repositories, uses `pdf-lib` with `@pdf-lib/fontkit`, and uses bundled Noto Sans font data. It writes the generated PDF through `react-native-file-access`; the invoice UI coordinates sharing/opening behavior. The [Technology choices and rationale](#technology-choices-and-rationale) section explains why a PDF-creation library is used instead of a viewer/renderer package. Exact behavior should be confirmed on target devices.

## Backup, restore, and reset

- `src/database/repositories/dataBackupRepository.ts` serializes the supported business tables to a versioned backup object, validates imports, restores records, and clears records during reset.
- `src/utils/backupFile.ts` handles JSON file export and import using the document picker and file-access library.
- `src/screens/Settings/DataManagementScreen.tsx` presents the UI and confirmation steps.

Backups are manual, versioned JSON files, not automatic cloud backups. The current backup version is `1`. Import validates the payload shape, supported version, dates, and record references before restoring it; malformed/unsupported files should be rejected. Import replaces existing business data. Reset removes business records and restores default business settings. Because restore/reset affect stored data, keep a separate exported backup before testing them.

## Reports

`src/hooks/useReports.ts` calculates date ranges for today, the current Monday-based week, or the current month and calls `getReportsSummary()` in `src/database/repositories/reportsRepository.ts`. 
