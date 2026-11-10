# Basic Usage Guide

Business Manager is a local-first template. Core records are stored in the app's local SQLite database. The current source does not provide hosted accounts or automatic cloud synchronization, so data is not shared automatically between devices.

## 1. First launch

1. Install and launch the app using [Installation](INSTALLATION.md).
2. Startup initializes the database and seeds sample records when the database meets the demo seeder's empty-install conditions.
3. Open the Dashboard to explore the overview and sample records.
4. Open the business profile/settings area and replace sample business details before generating customer-facing documents.

Before adapting the template for production, review `src/database/seed/demoData.ts` and the startup path in `App.tsx` so demo records are handled as intended.

## 2. Customers

1. Open **Customers** from the main navigation.
2. Create a customer and enter the contact/business details requested by the form.
3. Open the customer record to review its details and related activity.
4. Use the screen's available actions to edit or delete records.

## 3. Products and services

1. Open the Products area and add a product or service.
2. Enter the name, price, and other fields presented in the form.
3. If stock tracking is enabled for a product, keep its quantity accurate and verify the stock rules against your business process.
4. Configure services and non-stock-tracked items accordingly.

## 4. Sales

1. Open **Sales** and start a sale.
2. Select a customer when applicable and add products/services and quantities.
3. Review discounts and calculated totals before saving.
4. Open the saved sale to inspect its details.

Follow validation messages shown in the app.

## 5. Invoices

1. Open the invoice list and create or select an invoice.
2. Select a customer when applicable and add line items.
3. Review quantities, discounts, taxes, and totals before saving.
4. Open the saved invoice to inspect its details before recording payment or sharing the PDF.

## 6. Payments and PDF invoices

1. Open the invoice list and select an invoice.
2. Use the available payment action to record the amount and requested payment details.
3. Check the updated outstanding amount and payment status.
4. Use the invoice PDF/export/share action provided by the app to create or share the document.

Before using PDFs for actual customers, customize the business profile, currency, tax, and invoice settings, then inspect a generated document.

## 7. Reports

Use Reports to inspect the supported ranges, including Today, This week, and This month. Reports summarize locally stored records; they do not fetch information from an external accounting service.

## 8. Appearance and settings

Use the appearance setting to choose **Light**, **Dark**, or **System** mode. Update the business profile and invoice settings before creating customer-facing documents. The editable profile is stored locally on the device.

## 9. Backup, import, and reset

Use the data-management actions in the app to export/import a JSON backup or reset local data.

- **Export:** creates a versioned JSON backup containing the business profile/settings, customers, products, sales and sale items, invoices and invoice items, and payments. Save the exported file somewhere safe outside the device. Keep in mind that the backup is a copy of these records, not a cloud-sync service.
- **Import:** accepts a Business Manager backup JSON file with a supported backup version. Before changing the database, the app validates the backup structure and required fields, record IDs, dates, totals, and relationships between customers, products, sales, invoices, and payments. A valid import **replaces the existing business data and settings** with the contents of the backup. Export a fresh backup first if you need to preserve the current state. If validation or the database restore fails, the restore transaction is rolled back.
- **Reset:** deletes payment, invoice, sale, product, and customer records and resets the existing business profile to defaults, including the business name, INR currency, invoice numbering, tax rate, primary color, and payment methods. It does not delete the database or reset the schema version. Confirm carefully before proceeding.

The current backup format is version 1. Backups are manual, and import requires a supported format; do not assume a backup made by a different app version will always be compatible. Uninstalling the app, losing the device, or clearing app data can result in loss of locally stored records if you have no separate backup.

## 10. Important limitations

- No built-in login, hosted backend, or automatic cloud sync.
- One business profile per installation; this is not a multi-business or multi-tenant service.
- Review demo seeding and defaults before adapting the template for real business use.
- Test calculations, stock behavior, invoice PDFs, backup/restore, and the business workflows you intend to rely on before distributing a customized app.
