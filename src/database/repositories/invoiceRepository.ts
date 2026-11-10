import { db } from '../database';
import { isValidStoredDate } from '../../utils/validation';
import { calculateTransactionTotals } from '../../utils/transactionTotals';
import { InsufficientStockError } from '../../errors/InsufficientStockError';
import type {
    Invoice,
    InvoiceItem,
    InvoiceStatus,
} from '../types';
import type { Scalar } from '@op-engineering/op-sqlite';

export interface InvoiceWithItems {
    invoice: Invoice;
    items: InvoiceItem[];
}

export interface CreateInvoiceItemInput {
    product_id: number | null;
    name: string;
    quantity: number;
    unit_price_minor: number;
    tax_rate: number;
    discount_minor: number;
}

export interface CreateInvoiceInput {
    customer_id: number | null;
    items: CreateInvoiceItemInput[];
    discount_minor?: number;
    due_date?: string | null;
    issue_date?: string;
    notes?: string | null;
}

export interface UpdateInvoiceInput {
    customer_id: number | null;
    items: CreateInvoiceItemInput[];
    discount_minor?: number;
    due_date?: string | null;
    notes?: string | null;
}

export interface GetInvoicesOptions {
    search?: string;
    status?: InvoiceStatus;
    sortBy?: 'date' | 'invoice_number' | 'total';
    sortDirection?: 'asc' | 'desc';
}

function mapInvoice(
    row: Record<string, unknown>,
): Invoice {
    return {
        id: Number(row.id),
        invoice_number: String(row.invoice_number),
        customer_id:
            row.customer_id === null
                ? null
                : Number(row.customer_id),
        sale_id:
            row.sale_id === null
                ? null
                : Number(row.sale_id),
        subtotal_minor: Number(row.subtotal_minor),
        discount_minor: Number(row.discount_minor),
        tax_minor: Number(row.tax_minor),
        total_minor: Number(row.total_minor),
        paid_minor: Number(row.paid_minor),
        status: String(row.status) as InvoiceStatus,
        issue_date: String(row.issue_date),
        due_date:
            row.due_date === null
                ? null
                : String(row.due_date),
        notes:
            row.notes === null
                ? null
                : String(row.notes),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
    };
}

function mapInvoiceItem(
    row: Record<string, unknown>,
): InvoiceItem {
    return {
        id: Number(row.id),
        invoice_id: Number(row.invoice_id),
        product_id:
            row.product_id === null
                ? null
                : Number(row.product_id),
        name: String(row.name),
        quantity: Number(row.quantity),
        unit_price_minor: Number(row.unit_price_minor),
        tax_rate: Number(row.tax_rate),
        discount_minor: Number(row.discount_minor),
        total_minor: Number(row.total_minor),
        stock_deducted_quantity: Number(row.stock_deducted_quantity),

    };
}

function validateInvoiceItems(
    items: CreateInvoiceItemInput[],
): void {
    if (items.length === 0) {
        throw new Error(
            'An invoice must contain at least one item.',
        );
    }

    for (const item of items) {
        if (
            item.product_id !== null &&
            (!Number.isInteger(item.product_id) ||
                item.product_id <= 0)
        ) {
            throw new Error(
                'Invoice contains an invalid product.',
            );
        }

        if (!item.name.trim()) {
            throw new Error(
                'Invoice contains an item with no name.',
            );
        }

        if (
            !Number.isFinite(item.quantity) ||
            item.quantity <= 0
        ) {
            throw new Error(
                'Invoice contains an invalid item quantity.',
            );
        }

        if (
            !Number.isFinite(item.unit_price_minor) ||
            item.unit_price_minor < 0
        ) {
            throw new Error(
                'Invoice contains an invalid item price.',
            );
        }

        if (
            !Number.isFinite(item.tax_rate) ||
            item.tax_rate < 0 ||
            item.tax_rate > 100
        ) {
            throw new Error(
                'Invoice contains an invalid item tax rate.',
            );
        }

        if (
            !Number.isFinite(item.discount_minor) ||
            item.discount_minor < 0
        ) {
            throw new Error(
                'Invoice contains an invalid item discount.',
            );
        }
    }
}

function calculateInvoiceTotals(
    items: CreateInvoiceItemInput[],
    discountMinor: number,
): {
    subtotalMinor: number;
    taxMinor: number;
    totalMinor: number;
    itemTotals: number[];
} {
    const totals = calculateTransactionTotals(items, discountMinor);
    const itemTotals = items.map(item => {
        const lineSubtotal =
            Math.round(item.quantity * Math.round(item.unit_price_minor)) -
            Math.round(item.discount_minor);
        return lineSubtotal + Math.round(lineSubtotal * (item.tax_rate / 100));
    });

    return {
        subtotalMinor: totals.subtotalMinor,
        taxMinor: totals.taxMinor,
        totalMinor: totals.totalMinor,
        itemTotals,
    };
}

/**
 * Loads an invoice together with its historical line-item snapshots.
 */
export async function getInvoiceById(
    id: number,
): Promise<InvoiceWithItems | null> {
    const invoiceResult = await db.execute(
        `
            SELECT *
            FROM invoices
            WHERE id = ?
            LIMIT 1
        `,
        [id],
    );

    if (invoiceResult.rows.length === 0) {
        return null;
    }

    const itemsResult = await db.execute(
        `
            SELECT *
            FROM invoice_items
            WHERE invoice_id = ?
            ORDER BY id ASC
        `,
        [id],
    );

    return {
        invoice: mapInvoice(invoiceResult.rows[0]),
        items: itemsResult.rows.map(row =>
            mapInvoiceItem(row),
        ),
    };
}

/**
 * Loads invoices for the invoice list.
 */
export async function getInvoices(
    options: GetInvoicesOptions = {},
): Promise<Invoice[]> {
    const conditions: string[] = [];
    const params: Scalar[] = [];

    if (options.status) {
        conditions.push('i.status = ?');
        params.push(options.status);
    }

    if (options.search?.trim()) {
        const search = `%${options.search.trim()}%`;

        conditions.push(`
            (
                i.invoice_number LIKE ?
                OR COALESCE(c.name, '') LIKE ?
                OR COALESCE(c.phone, '') LIKE ?
                OR COALESCE(c.email, '') LIKE ?
            )
        `);

        params.push(
            search,
            search,
            search,
            search,
        );
    }

    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

    const sortColumn =
        options.sortBy === 'invoice_number'
            ? 'i.invoice_number'
            : options.sortBy === 'total'
                ? 'i.total_minor'
                : 'i.issue_date';

    const sortDirection =
        options.sortDirection === 'asc'
            ? 'ASC'
            : 'DESC';

    const result = await db.execute(
        `
            SELECT i.*
            FROM invoices i
            LEFT JOIN customers c
                ON c.id = i.customer_id
            ${whereClause}
            ORDER BY ${sortColumn} ${sortDirection}, i.id DESC
        `,
        params,
    );

    return result.rows.map(mapInvoice);
}

/**
 * Creates a new draft invoice.
 *
 * No stock is changed while an invoice is in draft state.
 */
export async function createInvoice(
    input: CreateInvoiceInput,
): Promise<number> {
    validateInvoiceItems(input.items);

    const discountMinor =
        input.discount_minor ?? 0;

    const totals = calculateInvoiceTotals(
        input.items,
        discountMinor,
    );

    let invoiceId: number | undefined;

    await db.transaction(async tx => {
        if (input.customer_id !== null) {
            if (
                !Number.isInteger(
                    input.customer_id,
                ) ||
                input.customer_id <= 0
            ) {
                throw new Error(
                    'Invalid customer.',
                );
            }

            const customerResult =
                await tx.execute(
                    `
                        SELECT id
                        FROM customers
                        WHERE id = ?
                        LIMIT 1
                    `,
                    [input.customer_id],
                );

            if (customerResult.rows.length === 0) {
                throw new Error(
                    'Customer could not be found.',
                );
            }
        }

        for (const item of input.items) {
            if (item.product_id === null) continue;
            const productResult = await tx.execute(
                `SELECT name, type, track_stock, stock_quantity FROM products WHERE id = ? AND is_active = 1 LIMIT 1`,
                [item.product_id],
            );
            if (productResult.rows.length === 0) {
                throw new Error(`Product ${item.name} is no longer available.`);
            }
            const product = productResult.rows[0];
            if (String(product.type) !== 'product' || Number(product.track_stock) !== 1) continue;
            const available = Number(product.stock_quantity);
            if (!Number.isFinite(available) || available < item.quantity) {
                throw new Error(`Insufficient stock for ${String(product.name)}. Available: ${available}; required: ${item.quantity}.`);
            }
        }

        const settingsResult =
            await tx.execute(
                `
                    SELECT
                        invoice_prefix,
                        next_invoice_number
                    FROM business_settings
                    WHERE id = 1
                    LIMIT 1
                `,
            );

        if (settingsResult.rows.length === 0) {
            throw new Error(
                'Business settings could not be found.',
            );
        }

        const settings =
            settingsResult.rows[0];

        const invoicePrefix = String(
            settings.invoice_prefix,
        );

        const nextInvoiceNumber = Number(
            settings.next_invoice_number,
        );

        if (
            !Number.isInteger(
                nextInvoiceNumber,
            ) ||
            nextInvoiceNumber <= 0
        ) {
            throw new Error(
                'Invoice numbering settings are invalid.',
            );
        }

        const invoiceNumber =
            `${invoicePrefix}${nextInvoiceNumber}`;

        const now = new Date().toISOString();
        const issueDate = input.issue_date ?? now;
        if (!isValidStoredDate(issueDate)) {
            throw new Error('Enter a valid invoice date before saving the invoice.');
        }

        const invoiceResult =
            await tx.execute(
                `
                    INSERT INTO invoices (
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    invoiceNumber,
                    input.customer_id,
                    null,
                    totals.subtotalMinor,
                    discountMinor,
                    totals.taxMinor,
                    totals.totalMinor,
                    0,
                    'draft',
                    issueDate,
                    input.due_date ?? null,
                    input.notes ?? null,
                    now,
                    now,
                ],
            );

        if (
            invoiceResult.insertId ===
            undefined
        ) {
            throw new Error(
                'Failed to retrieve the new invoice ID.',
            );
        }

        invoiceId = invoiceResult.insertId;

        for (
            let index = 0;
            index < input.items.length;
            index += 1
        ) {
            const item = input.items[index];

            await tx.execute(
                `
                    INSERT INTO invoice_items (
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    invoiceId,
                    item.product_id,
                    item.name.trim(),
                    item.quantity,
                    item.unit_price_minor,
                    item.tax_rate,
                    item.discount_minor,
                    totals.itemTotals[index],
                    0,
                ],
            );
        }

        const numberingResult =
            await tx.execute(
                `
                    UPDATE business_settings
                    SET
                        next_invoice_number =
                            next_invoice_number + 1,
                        updated_at = ?
                    WHERE id = 1
                      AND next_invoice_number = ?
                `,
                [now, nextInvoiceNumber],
            );

        if (numberingResult.rowsAffected !== 1) {
            throw new Error(
                'Invoice numbering could not be updated.',
            );
        }
    });

    if (invoiceId === undefined) {
        throw new Error(
            'Failed to create the invoice.',
        );
    }

    return invoiceId;
}

/**
 * Updates a draft invoice and replaces its item snapshots.
 *
 * Stock is not changed while the invoice remains a draft.
 */
export async function updateInvoice(
    id: number,
    input: UpdateInvoiceInput,
): Promise<void> {
    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error('Invalid invoice.');
    }

    validateInvoiceItems(input.items);

    const discountMinor =
        input.discount_minor ?? 0;

    const totals = calculateInvoiceTotals(
        input.items,
        discountMinor,
    );

    await db.transaction(async tx => {
        const invoiceResult =
            await tx.execute(
                `
                    SELECT status
                    FROM invoices
                    WHERE id = ?
                    LIMIT 1
                `,
                [id],
            );

        if (invoiceResult.rows.length === 0) {
            throw new Error(
                'Invoice could not be found.',
            );
        }

        if (
            String(invoiceResult.rows[0].status) !==
            'draft'
        ) {
            throw new Error(
                'Only draft invoices can be edited.',
            );
        }

        if (input.customer_id !== null) {
            if (
                !Number.isInteger(
                    input.customer_id,
                ) ||
                input.customer_id <= 0
            ) {
                throw new Error(
                    'Invalid customer.',
                );
            }

            const customerResult =
                await tx.execute(
                    `
                        SELECT id
                        FROM customers
                        WHERE id = ?
                        LIMIT 1
                    `,
                    [input.customer_id],
                );

            if (customerResult.rows.length === 0) {
                throw new Error(
                    'Customer could not be found.',
                );
            }
        }

        const now = new Date().toISOString();

        const updateResult =
            await tx.execute(
                `
                    UPDATE invoices
                    SET
                        customer_id = ?,
                        subtotal_minor = ?,
                        discount_minor = ?,
                        tax_minor = ?,
                        total_minor = ?,
                        due_date = ?,
                        notes = ?,
                        updated_at = ?
                    WHERE id = ?
                      AND status = 'draft'
                `,
                [
                    input.customer_id,
                    totals.subtotalMinor,
                    discountMinor,
                    totals.taxMinor,
                    totals.totalMinor,
                    input.due_date ?? null,
                    input.notes ?? null,
                    now,
                    id,
                ],
            );

        if (updateResult.rowsAffected !== 1) {
            throw new Error(
                'Invoice could not be updated.',
            );
        }

        await tx.execute(
            `
                DELETE FROM invoice_items
                WHERE invoice_id = ?
            `,
            [id],
        );

        for (
            let index = 0;
            index < input.items.length;
            index += 1
        ) {
            const item = input.items[index];

            await tx.execute(
                `
                    INSERT INTO invoice_items (
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    id,
                    item.product_id,
                    item.name.trim(),
                    item.quantity,
                    item.unit_price_minor,
                    item.tax_rate,
                    item.discount_minor,
                    totals.itemTotals[index],
                    0,
                ],
            );
        }
    });
}

/**
 * Deletes a draft invoice.
 */
export async function deleteInvoice(
    id: number,
): Promise<void> {
    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error('Invalid invoice.');
    }

    await db.transaction(async tx => {
        const invoiceResult =
            await tx.execute(
                `
                    SELECT status
                    FROM invoices
                    WHERE id = ?
                    LIMIT 1
                `,
                [id],
            );

        if (invoiceResult.rows.length === 0) {
            throw new Error(
                'Invoice could not be found.',
            );
        }

        if (
            String(invoiceResult.rows[0].status) !==
            'draft'
        ) {
            throw new Error(
                'Only draft invoices can be deleted.',
            );
        }

        const deleteResult =
            await tx.execute(
                `
                    DELETE FROM invoices
                    WHERE id = ?
                      AND status = 'draft'
                `,
                [id],
            );

        if (deleteResult.rowsAffected !== 1) {
            throw new Error(
                'Invoice could not be deleted.',
            );
        }
    });
}

/**
 * Issues a draft invoice and deducts stock atomically.
 *
 * The product configuration is evaluated at issue time.
 * The quantity actually deducted is recorded on each invoice item
 * so cancellation can later restore the same quantity.
 */
export async function issueInvoice(
    id: number,
): Promise<void> {
    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error('Invalid invoice.');
    }

    await db.transaction(async tx => {
        const invoiceResult =
            await tx.execute(
                `
                    SELECT
                        status,
                        total_minor,
                        issue_date
                    FROM invoices
                    WHERE id = ?
                    LIMIT 1
                `,
                [id],
            );

        if (invoiceResult.rows.length === 0) {
            throw new Error(
                'Invoice could not be found.',
            );
        }

        if (
            String(invoiceResult.rows[0].status) !==
            'draft'
        ) {
            throw new Error(
                'Only draft invoices can be issued.',
            );
        }

        if (!isValidStoredDate(String(invoiceResult.rows[0].issue_date ?? ''))) {
            throw new Error('Enter a valid invoice date before issuing this invoice.');
        }

        const itemsResult =
            await tx.execute(
                `
                    SELECT
                        id,
                        product_id,
                        quantity,
                        stock_deducted_quantity
                    FROM invoice_items
                    WHERE invoice_id = ?
                    ORDER BY id ASC
                `,
                [id],
            );

        if (itemsResult.rows.length === 0) {
            throw new Error(
                'An invoice must contain at least one item.',
            );
        }

        for (const item of itemsResult.rows) {
            const itemId = Number(item.id);
            const productId =
                item.product_id === null
                    ? null
                    : Number(item.product_id);
            const quantity = Number(
                item.quantity,
            );

            if (
                !Number.isFinite(quantity) ||
                quantity <= 0
            ) {
                throw new Error(
                    'Invoice contains an invalid item quantity.',
                );
            }

            if (productId === null) {
                await tx.execute(
                    `
                        UPDATE invoice_items
                        SET stock_deducted_quantity = 0
                        WHERE id = ?
                    `,
                    [itemId],
                );

                continue;
            }

            const productResult =
                await tx.execute(
                    `
                        SELECT
                            name,
                            type,
                            track_stock,
                            stock_quantity
                        FROM products
                        WHERE id = ?
                        LIMIT 1
                    `,
                    [productId],
                );

            if (productResult.rows.length === 0) {
                throw new Error(
                    'A product on this invoice could not be found.',
                );
            }

            const product =
                productResult.rows[0];

            const isStockTrackedProduct =
                String(product.type) ===
                'product' &&
                Number(product.track_stock) === 1;

            if (!isStockTrackedProduct) {
                await tx.execute(
                    `
                        UPDATE invoice_items
                        SET stock_deducted_quantity = 0
                        WHERE id = ?
                    `,
                    [itemId],
                );

                continue;
            }

            const stockQuantity = Number(
                product.stock_quantity,
            );

            if (
                !Number.isFinite(
                    stockQuantity,
                ) ||
                stockQuantity < quantity
            ) {
                throw new Error(
                    `Insufficient stock for ${String(product.name)}. Available: ${stockQuantity}; required: ${quantity}.`,
                );
            }

            const stockUpdateResult =
                await tx.execute(
                    `
                        UPDATE products
                        SET
                            stock_quantity =
                                stock_quantity - ?
                        WHERE id = ?
                          AND stock_quantity >= ?
                    `,
                    [
                        quantity,
                        productId,
                        quantity,
                    ],
                );

            if (
                stockUpdateResult.rowsAffected !==
                1
            ) {
                throw new Error(
                    `Insufficient stock for ${String(product.name)}. Available: ${stockQuantity}; required: ${quantity}. Stock may have changed; refresh and try again.`,
                );
            }

            const itemUpdateResult =
                await tx.execute(
                    `
                        UPDATE invoice_items
                        SET
                            stock_deducted_quantity = ?
                        WHERE id = ?
                    `,
                    [quantity, itemId],
                );

            if (
                itemUpdateResult.rowsAffected !==
                1
            ) {
                throw new Error(
                    'Invoice item stock history could not be recorded.',
                );
            }
        }

        const now = new Date().toISOString();

        const updateResult =
            await tx.execute(
                `
                    UPDATE invoices
                    SET
                        status = 'issued',
                        updated_at = ?
                    WHERE id = ?
                      AND status = 'draft'
                `,
                [now, id],
            );

        if (updateResult.rowsAffected !== 1) {
            throw new Error(
                'Invoice could not be issued.',
            );
        }
    });
}

/**
 * Cancels an issued invoice and restores exactly the stock that was
 * deducted when the invoice was issued.
 */
export async function cancelInvoice(
    id: number,
): Promise<void> {
    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error('Invalid invoice.');
    }

    await db.transaction(async tx => {
        const invoiceResult =
            await tx.execute(
                `
                    SELECT status
                    FROM invoices
                    WHERE id = ?
                    LIMIT 1
                `,
                [id],
            );

        if (invoiceResult.rows.length === 0) {
            throw new Error(
                'Invoice could not be found.',
            );
        }

        if (
            String(invoiceResult.rows[0].status) !==
            'issued'
        ) {
            throw new Error(
                'Only issued invoices can be cancelled.',
            );
        }

        const itemsResult =
            await tx.execute(
                `
                    SELECT
                        product_id,
                        stock_deducted_quantity
                    FROM invoice_items
                    WHERE invoice_id = ?
                    ORDER BY id ASC
                `,
                [id],
            );

        for (const item of itemsResult.rows) {
            const productId =
                item.product_id === null
                    ? null
                    : Number(item.product_id);

            const deductedQuantity = Number(
                item.stock_deducted_quantity,
            );

            if (
                productId === null ||
                deductedQuantity <= 0
            ) {
                continue;
            }

            if (
                !Number.isFinite(
                    deductedQuantity,
                )
            ) {
                throw new Error(
                    'Invoice stock history is invalid.',
                );
            }

            const restoreResult =
                await tx.execute(
                    `
                        UPDATE products
                        SET
                            stock_quantity =
                                stock_quantity + ?
                        WHERE id = ?
                    `,
                    [
                        deductedQuantity,
                        productId,
                    ],
                );

            if (restoreResult.rowsAffected !== 1) {
                throw new Error(
                    'Product stock could not be restored.',
                );
            }
        }

        const now = new Date().toISOString();

        const updateResult =
            await tx.execute(
                `
                    UPDATE invoices
                    SET
                        status = 'cancelled',
                        updated_at = ?
                    WHERE id = ?
                      AND status = 'issued'
                `,
                [now, id],
            );

        if (updateResult.rowsAffected !== 1) {
            throw new Error(
                'Invoice could not be cancelled.',
            );
        }
    });
}
