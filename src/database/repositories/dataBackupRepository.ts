import { db } from '../database';
import { isValidStoredDate } from '../../utils/validation';
import type {
    BusinessSettings,
    Customer,
    Invoice,
    InvoiceItem,
    Payment,
    Product,
    Sale,
    SaleItem,
} from '../types';

export const BACKUP_VERSION = 1;

export type BusinessManagerBackup = {
    version: number;
    exported_at: string;
    business_settings: BusinessSettings[];
    customers: Customer[];
    products: Product[];
    sales: Sale[];
    sale_items: SaleItem[];
    invoices: Invoice[];
    invoice_items: InvoiceItem[];
    payments: Payment[];
};

function getRows<T>(query: string): T[] {
    const result = db.executeSync(query);
    return (result.rows ?? []) as T[];
}

export function createBackup(): BusinessManagerBackup {
    return {
        version: BACKUP_VERSION,
        exported_at: new Date().toISOString(),

        business_settings: getRows<BusinessSettings>(
            `SELECT * FROM business_settings ORDER BY id`,
        ),

        customers: getRows<Customer>(
            `SELECT * FROM customers ORDER BY id`,
        ),

        products: getRows<Product>(
            `SELECT * FROM products ORDER BY id`,
        ),

        sales: getRows<Sale>(
            `SELECT * FROM sales ORDER BY id`,
        ),

        sale_items: getRows<SaleItem>(
            `SELECT * FROM sale_items ORDER BY id`,
        ),

        invoices: getRows<Invoice>(
            `SELECT * FROM invoices ORDER BY id`,
        ),

        invoice_items: getRows<InvoiceItem>(
            `SELECT * FROM invoice_items ORDER BY id`,
        ),

        payments: getRows<Payment>(
            `SELECT * FROM payments ORDER BY id`,
        ),

    };
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type BackupRecord = Record<string, unknown>;
type NumberRule = { integer?: boolean; min?: number; max?: number; nullable?: boolean };

function invalidBackup(message: string): never {
    throw new Error(`Invalid backup: ${message}`);
}

function requireString(record: BackupRecord, field: string, nullable = false): void {
    const value = record[field];
    if (nullable && value === null) return;
    if (typeof value !== 'string') invalidBackup(`"${field}" must be a string${nullable ? ' or null' : ''}.`);
}

function requireNumber(record: BackupRecord, field: string, rule: NumberRule = {}): void {
    const value = record[field];
    if (rule.nullable && value === null) return;
    if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        (rule.integer && !Number.isInteger(value)) ||
        (rule.min !== undefined && value < rule.min) ||
        (rule.max !== undefined && value > rule.max)
    ) invalidBackup(`"${field}" has an invalid value.`);
}

function validateRows(
    backup: Record<string, unknown>,
    key: string,
    requiredStrings: string[],
    nullableStrings: string[],
    numbers: Record<string, NumberRule>,
): BackupRecord[] {
    const values = backup[key];
    if (!Array.isArray(values)) invalidBackup(`"${key}" must be an array.`);

    const ids = new Set<number>();
    for (const [index, value] of values.entries()) {
        if (!isObject(value)) invalidBackup(`"${key}" record ${index + 1} must be an object.`);
        for (const field of requiredStrings) requireString(value, field);
        for (const field of nullableStrings) requireString(value, field, true);
        for (const [field, rule] of Object.entries(numbers)) requireNumber(value, field, rule);

        if (key !== 'business_settings') {
            requireNumber(value, 'id', { integer: true, min: 1 });
            const id = value.id as number;
            if (ids.has(id)) invalidBackup(`"${key}" contains duplicate IDs.`);
            ids.add(id);
        }
    }
    return values as BackupRecord[];
}

function validateDate(record: BackupRecord, field: string, nullable = false): void {
    const value = record[field];
    if (nullable && value === null) return;
    if (typeof value !== 'string' || !isValidStoredDate(value)) {
        invalidBackup(`"${field}" must contain a valid date.`);
    }
}

function getIds(rows: BackupRecord[]): Set<number> {
    return new Set(rows.map(row => row.id as number));
}

function validateReferences(
    rows: BackupRecord[],
    field: string,
    validIds: Set<number>,
    nullable = false,
): void {
    for (const row of rows) {
        const value = row[field];
        if (nullable && value === null) continue;
        if (typeof value !== 'number' || !Number.isInteger(value) || !validIds.has(value)) {
            invalidBackup(`"${field}" refers to a missing record.`);
        }
    }
}

export function validateBackup(value: unknown): BusinessManagerBackup {
    if (!isObject(value)) throw new Error('Invalid backup file.');
    if (value.version !== BACKUP_VERSION) {
        throw new Error(`Unsupported backup version: ${String(value.version)}.`);
    }
    if (typeof value.exported_at !== 'string' || Number.isNaN(Date.parse(value.exported_at))) {
        invalidBackup('missing or invalid export date.');
    }

    const settings = validateRows(value, 'business_settings',
        ['business_name', 'currency_code', 'currency_symbol', 'invoice_prefix', 'primary_color', 'payment_methods', 'created_at', 'updated_at'],
        ['logo_uri', 'email', 'phone', 'website', 'address', 'tax_number'],
        {
            id: { integer: true, min: 1, max: 1 },
            currency_decimal_places: { integer: true, min: 0, max: 6 },
            next_invoice_number: { integer: true, min: 1 },
            default_tax_rate: { min: 0, max: 100 },
        },
    );
    if (settings.length !== 1 || settings[0].id !== 1) {
        invalidBackup('exactly one business settings record with ID 1 is required.');
    }

    const customers = validateRows(value, 'customers',
        ['name', 'created_at', 'updated_at'],
        ['email', 'phone', 'company_name', 'tax_number', 'address', 'notes'],
        { is_archived: { integer: true, min: 0, max: 1 } },
    );
    const products = validateRows(value, 'products',
        ['name', 'type', 'created_at', 'updated_at'],
        ['sku', 'description'],
        {
            price_minor: { integer: true, min: 0 }, cost_minor: { integer: true, min: 0 },
            tax_rate: { min: 0, max: 100 }, track_stock: { integer: true, min: 0, max: 1 },
            stock_quantity: { min: 0 },
            is_active: { integer: true, min: 0, max: 1 },
        },
    );
    const sales = validateRows(value, 'sales',
        ['status', 'sale_date', 'created_at', 'updated_at'], ['notes'],
        {
            customer_id: { nullable: true, integer: true, min: 1 },
            subtotal_minor: { integer: true, min: 0 }, discount_minor: { integer: true, min: 0 },
            tax_minor: { integer: true, min: 0 }, total_minor: { integer: true, min: 0 },
        },
    );
    const saleItems = validateRows(value, 'sale_items', ['name'], [], {
        sale_id: { integer: true, min: 1 }, product_id: { nullable: true, integer: true, min: 1 },
        quantity: { min: Number.MIN_VALUE }, unit_price_minor: { integer: true, min: 0 },
        tax_rate: { min: 0, max: 100 }, discount_minor: { integer: true, min: 0 },
        total_minor: { integer: true, min: 0 },
    });
    const invoices = validateRows(value, 'invoices',
        ['invoice_number', 'status', 'issue_date', 'created_at', 'updated_at'], ['due_date', 'notes'],
        {
            customer_id: { nullable: true, integer: true, min: 1 },
            sale_id: { nullable: true, integer: true, min: 1 },
            subtotal_minor: { integer: true, min: 0 }, discount_minor: { integer: true, min: 0 },
            tax_minor: { integer: true, min: 0 }, total_minor: { integer: true, min: 0 },
            paid_minor: { integer: true, min: 0 },
        },
    );
    const invoiceItems = validateRows(value, 'invoice_items', ['name'], [], {
        invoice_id: { integer: true, min: 1 }, product_id: { nullable: true, integer: true, min: 1 },
        quantity: { min: Number.MIN_VALUE }, unit_price_minor: { integer: true, min: 0 },
        tax_rate: { min: 0, max: 100 }, discount_minor: { integer: true, min: 0 },
        total_minor: { integer: true, min: 0 }, stock_deducted_quantity: { min: 0 },
    });
    const payments = validateRows(value, 'payments',
        ['payment_method', 'payment_date', 'created_at'], ['reference', 'notes'],
        { invoice_id: { integer: true, min: 1 }, amount_minor: { integer: true, min: 1 } },
    );

    for (const product of products) {
        if (product.type !== 'product' && product.type !== 'service') invalidBackup('product type is invalid.');
    }
    for (const sale of sales) {
        if (!['draft', 'completed', 'cancelled'].includes(String(sale.status))) invalidBackup('sale status is invalid.');
        validateDate(sale, 'sale_date');
        if ((sale.discount_minor as number) > (sale.subtotal_minor as number)) invalidBackup('sale discount exceeds its subtotal.');
        if ((sale.subtotal_minor as number) - (sale.discount_minor as number) + (sale.tax_minor as number) !== sale.total_minor) invalidBackup('sale totals are inconsistent.');
    }
    for (const invoice of invoices) {
        if (!['draft', 'issued', 'cancelled'].includes(String(invoice.status))) invalidBackup('invoice status is invalid.');
        validateDate(invoice, 'issue_date');
        validateDate(invoice, 'due_date', true);
        if ((invoice.discount_minor as number) > (invoice.subtotal_minor as number)) invalidBackup('invoice discount exceeds its subtotal.');
        if ((invoice.subtotal_minor as number) - (invoice.discount_minor as number) + (invoice.tax_minor as number) !== invoice.total_minor) invalidBackup('invoice totals are inconsistent.');
        if ((invoice.paid_minor as number) > (invoice.total_minor as number)) invalidBackup('invoice paid amount exceeds its total.');
    }
    for (const payment of payments) validateDate(payment, 'payment_date');

    const customerIds = getIds(customers);
    const productIds = getIds(products);
    const saleIds = getIds(sales);
    const invoiceIds = getIds(invoices);
    validateReferences(sales, 'customer_id', customerIds, true);
    validateReferences(saleItems, 'sale_id', saleIds);
    validateReferences(saleItems, 'product_id', productIds, true);
    validateReferences(invoices, 'customer_id', customerIds, true);
    validateReferences(invoices, 'sale_id', saleIds, true);
    validateReferences(invoiceItems, 'invoice_id', invoiceIds);
    validateReferences(invoiceItems, 'product_id', productIds, true);
    validateReferences(payments, 'invoice_id', invoiceIds);

    return value as unknown as BusinessManagerBackup;
}

function clearData(): void {
    db.executeSync(`DELETE FROM payments`);
    db.executeSync(`DELETE FROM invoice_items`);
    db.executeSync(`DELETE FROM invoices`);
    db.executeSync(`DELETE FROM sale_items`);
    db.executeSync(`DELETE FROM sales`);
    db.executeSync(`DELETE FROM products`);
    db.executeSync(`DELETE FROM customers`);
}

export function restoreBackup(backup: BusinessManagerBackup): void {
    validateBackup(backup);

    db.executeSync('BEGIN TRANSACTION');

    try {
        clearData();

        db.executeSync(`DELETE FROM business_settings`);

        for (const business of backup.business_settings) {
            db.executeSync(
                `
          INSERT INTO business_settings (
            id,
            business_name,
            logo_uri,
            email,
            phone,
            website,
            address,
            tax_number,
            currency_code,
            currency_symbol,
            currency_decimal_places,
            invoice_prefix,
            next_invoice_number,
            default_tax_rate,
            primary_color,
            payment_methods,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    business.id,
                    business.business_name,
                    business.logo_uri,
                    business.email,
                    business.phone,
                    business.website,
                    business.address,
                    business.tax_number,
                    business.currency_code,
                    business.currency_symbol,
                    business.currency_decimal_places,
                    business.invoice_prefix,
                    business.next_invoice_number,
                    business.default_tax_rate,
                    business.primary_color,
                    business.payment_methods,
                    business.created_at,
                    business.updated_at,
                ],
            );
        }

        for (const customer of backup.customers) {
            db.executeSync(
                `
          INSERT INTO customers (
            id,
            name,
            email,
            phone,
            company_name,
            tax_number,
            address,
            notes,
            is_archived,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    customer.id,
                    customer.name,
                    customer.email,
                    customer.phone,
                    customer.company_name,
                    customer.tax_number,
                    customer.address,
                    customer.notes,
                    customer.is_archived,
                    customer.created_at,
                    customer.updated_at,
                ],
            );
        }

        for (const product of backup.products) {
            db.executeSync(
                `
          INSERT INTO products (
            id,
            name,
            type,
            sku,
            description,
            price_minor,
            cost_minor,
            tax_rate,
            track_stock,
            stock_quantity,
            is_active,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    product.id,
                    product.name,
                    product.type,
                    product.sku,
                    product.description,
                    product.price_minor,
                    product.cost_minor,
                    product.tax_rate,
                    product.track_stock,
                    product.stock_quantity,
                    product.is_active,
                    product.created_at,
                    product.updated_at,
                ],
            );
        }

        for (const sale of backup.sales) {
            db.executeSync(
                `
          INSERT INTO sales (
            id,
            customer_id,
            subtotal_minor,
            discount_minor,
            tax_minor,
            total_minor,
            notes,
            status,
            sale_date,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    sale.id,
                    sale.customer_id,
                    sale.subtotal_minor,
                    sale.discount_minor,
                    sale.tax_minor,
                    sale.total_minor,
                    sale.notes,
                    sale.status,
                    sale.sale_date,
                    sale.created_at,
                    sale.updated_at,
                ],
            );
        }

        for (const item of backup.sale_items) {
            db.executeSync(
                `
          INSERT INTO sale_items (
            id,
            sale_id,
            product_id,
            name,
            quantity,
            unit_price_minor,
            tax_rate,
            discount_minor,
            total_minor
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    item.id,
                    item.sale_id,
                    item.product_id,
                    item.name,
                    item.quantity,
                    item.unit_price_minor,
                    item.tax_rate,
                    item.discount_minor,
                    item.total_minor,
                ],
            );
        }

        for (const invoice of backup.invoices) {
            db.executeSync(
                `
          INSERT INTO invoices (
            id,
            invoice_number,
            customer_id,
            sale_id,
            subtotal_minor,
            discount_minor,
            tax_minor,
            total_minor,
            paid_minor,
            status,
            issue_date,
            due_date,
            notes,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    invoice.id,
                    invoice.invoice_number,
                    invoice.customer_id,
                    invoice.sale_id,
                    invoice.subtotal_minor,
                    invoice.discount_minor,
                    invoice.tax_minor,
                    invoice.total_minor,
                    invoice.paid_minor,
                    invoice.status,
                    invoice.issue_date,
                    invoice.due_date,
                    invoice.notes,
                    invoice.created_at,
                    invoice.updated_at,
                ],
            );
        }

        for (const item of backup.invoice_items) {
            db.executeSync(
                `
          INSERT INTO invoice_items (
            id,
            invoice_id,
            product_id,
            name,
            quantity,
            unit_price_minor,
            tax_rate,
            discount_minor,
            total_minor,
            stock_deducted_quantity
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    item.id,
                    item.invoice_id,
                    item.product_id,
                    item.name,
                    item.quantity,
                    item.unit_price_minor,
                    item.tax_rate,
                    item.discount_minor,
                    item.total_minor,
                    item.stock_deducted_quantity,
                ],
            );
        }

        for (const payment of backup.payments) {
            db.executeSync(
                `
          INSERT INTO payments (
            id,
            invoice_id,
            amount_minor,
            payment_method,
            payment_date,
            reference,
            notes,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    payment.id,
                    payment.invoice_id,
                    payment.amount_minor,
                    payment.payment_method,
                    payment.payment_date,
                    payment.reference,
                    payment.notes,
                    payment.created_at,
                ],
            );
        }

        db.executeSync('COMMIT');
    } catch (error) {
        db.executeSync('ROLLBACK');
        throw error;
    }
}

export function resetData(): void {
    db.executeSync('BEGIN TRANSACTION');

    try {
        clearData();

        db.executeSync(
            `
        UPDATE business_settings
        SET
          business_name = 'My Business',
          logo_uri = NULL,
          email = NULL,
          phone = NULL,
          website = NULL,
          address = NULL,
          tax_number = NULL,
          currency_code = 'INR',
          currency_symbol = '₹',
          currency_decimal_places = 2,
          invoice_prefix = 'INV',
          next_invoice_number = 1,
          default_tax_rate = 0,
          primary_color = '#4F46E5',
          payment_methods = 'Cash, Bank transfer, Card',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `,
        );

        db.executeSync('COMMIT');
    } catch (error) {
        db.executeSync('ROLLBACK');
        throw error;
    }
}