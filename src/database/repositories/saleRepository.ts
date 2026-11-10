import { db } from '../database';
import { calculateTransactionTotals } from '../../utils/transactionTotals';
import type { Sale, SaleItem, SaleStatus } from '../types';

export interface CreateSaleItemInput {
    product_id: number | null;
    name: string;
    quantity: number;
    unit_price_minor: number;
    tax_rate: number;
    discount_minor: number;
}

export interface CreateSaleInput {
    customer_id?: number | null;
    items: CreateSaleItemInput[];
    discount_minor?: number;
    notes?: string | null;
    status?: SaleStatus;
    sale_date?: string;
}

export interface SaleWithItems {
    sale: Sale;
    items: SaleItem[];
}

function mapSale(row: Record<string, unknown>): Sale {
    return {
        id: Number(row.id),
        customer_id:
            row.customer_id === null
                ? null
                : Number(row.customer_id),
        subtotal_minor: Number(row.subtotal_minor),
        discount_minor: Number(row.discount_minor),
        tax_minor: Number(row.tax_minor),
        total_minor: Number(row.total_minor),
        notes: row.notes === null ? null : String(row.notes),
        status: String(row.status) as SaleStatus,
        sale_date: String(row.sale_date),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
    };
}

function mapSaleItem(
    row: Record<string, unknown>,
): SaleItem {
    return {
        id: Number(row.id),
        sale_id: Number(row.sale_id),
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
    };
}

export async function getSales(): Promise<Sale[]> {
    const result = await db.execute(`
    SELECT *
    FROM sales
    ORDER BY sale_date DESC, id DESC
  `);

    return result.rows.map(row => mapSale(row));
}

export async function getSaleById(
    id: number,
): Promise<SaleWithItems | null> {
    const saleResult = await db.execute(
        `
      SELECT *
      FROM sales
      WHERE id = ?
      LIMIT 1
    `,
        [id],
    );

    if (saleResult.rows.length === 0) {
        return null;
    }

    const itemsResult = await db.execute(
        `
      SELECT *
      FROM sale_items
      WHERE sale_id = ?
      ORDER BY id ASC
    `,
        [id],
    );

    return {
        sale: mapSale(saleResult.rows[0]),
        items: itemsResult.rows.map(row => mapSaleItem(row)),
    };
}

export async function createSale(
    input: CreateSaleInput,
): Promise<number> {
    if (input.items.length === 0) {
        throw new Error('A sale must contain at least one item.');
    }

    const now = new Date().toISOString();
    const saleDate = input.sale_date ?? now;
    const rawDiscountMinor = input.discount_minor ?? 0;
    if (!Number.isFinite(rawDiscountMinor) || rawDiscountMinor < 0) {
        throw new Error('Sale discount must be zero or greater.');
    }
    const discountMinor = Math.round(rawDiscountMinor);


    const calculatedItems = input.items.map(item => {
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
            throw new Error(
                'Sale item quantity must be greater than zero.',
            );
        }

        if (
            !Number.isFinite(item.unit_price_minor) ||
            item.unit_price_minor < 0
        ) {
            throw new Error('Sale item price is invalid.');
        }

        if (
            !Number.isFinite(item.tax_rate) ||
            item.tax_rate < 0 ||
            item.tax_rate > 100
        ) {
            throw new Error('Sale item tax rate is invalid.');
        }

        const quantity = item.quantity;
        const unitPriceMinor = Math.round(item.unit_price_minor);
        if (
            !Number.isFinite(item.discount_minor) ||
            item.discount_minor < 0
        ) {
            throw new Error('Sale item discount must be zero or greater.');
        }

        const itemDiscountMinor = Math.round(item.discount_minor);

        const lineSubtotalMinor =
            Math.round(quantity * unitPriceMinor) -
            itemDiscountMinor;

        if (lineSubtotalMinor < 0) {
            throw new Error('Sale item discount is too high.');
        }

        const lineTaxMinor = Math.round(
            lineSubtotalMinor * (item.tax_rate / 100),
        );

        const lineTotalMinor =
            lineSubtotalMinor + lineTaxMinor;

        return {
            ...item,
            quantity,
            unit_price_minor: unitPriceMinor,
            discount_minor: itemDiscountMinor,
            total_minor: lineTotalMinor,
        };
    });

    const totals = calculateTransactionTotals(
        calculatedItems,
        discountMinor,
    );
    const {
        subtotalMinor,
        taxMinor,
        totalMinor,
    } = totals;

    let saleId: number | undefined;

    await db.transaction(async tx => {
        const result = await tx.execute(
            `
        INSERT INTO sales (
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                input.customer_id ?? null,
                subtotalMinor,
                discountMinor,
                taxMinor,
                totalMinor,
                input.notes?.trim() || null,
                input.status ?? 'completed',
                saleDate,
                now,
                now,
            ],
        );

        if (result.insertId === undefined) {
            throw new Error('Failed to retrieve the new sale ID.');
        }

        saleId = result.insertId;

        for (const item of calculatedItems) {
            if (item.product_id !== null) {
                const productResult = await tx.execute(
                    `
            SELECT
              id,
              name,
              type,
              track_stock,
              stock_quantity
            FROM products
            WHERE id = ?
              AND is_active = 1
            LIMIT 1
          `,
                    [item.product_id],
                );

                if (productResult.rows.length === 0) {
                    throw new Error(
                        `Product ${item.product_id} is no longer available.`,
                    );
                }

                const product = productResult.rows[0];

                if (String(product.type) === 'product') {
                    const trackStock =
                        Number(product.track_stock) === 1;

                    if (trackStock) {
                        const currentStock = Number(
                            product.stock_quantity,
                        );

                        if (currentStock < item.quantity) {
                            throw new Error(
                                `Not enough stock for ${String(
                                    product.name,
                                )}.`,
                            );
                        }

                        await tx.execute(
                            `
                UPDATE products
                SET
                  stock_quantity = stock_quantity - ?,
                  updated_at = ?
                WHERE id = ?
              `,
                            [
                                item.quantity,
                                now,
                                item.product_id,
                            ],
                        );
                    }
                }
            }

            await tx.execute(
                `
          INSERT INTO sale_items (
            sale_id,
            product_id,
            name,
            quantity,
            unit_price_minor,
            tax_rate,
            discount_minor,
            total_minor
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    saleId,
                    item.product_id,
                    item.name.trim(),
                    item.quantity,
                    item.unit_price_minor,
                    item.tax_rate,
                    item.discount_minor,
                    item.total_minor,
                ],
            );
        }
    });

    if (saleId === undefined) {
        throw new Error('Failed to create the sale.');
    }

    return saleId;
}
export async function updateSaleStatus(
  id: number,
  status: SaleStatus,
): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction(async tx => {
    const saleResult = await tx.execute(
      `
        SELECT
          id,
          status
        FROM sales
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    );

    if (saleResult.rows.length === 0) {
      throw new Error('Sale not found.');
    }

    const currentStatus = String(
      saleResult.rows[0].status,
    ) as SaleStatus;

    if (currentStatus === status) {
      return;
    }

    if (
      status === 'cancelled' &&
      currentStatus !== 'cancelled'
    ) {
      const itemsResult = await tx.execute(
        `
          SELECT
            product_id,
            quantity
          FROM sale_items
          WHERE sale_id = ?
        `,
        [id],
      );

      for (const item of itemsResult.rows) {
        if (item.product_id === null) {
          continue;
        }

        const productResult = await tx.execute(
          `
            SELECT
              type,
              track_stock
            FROM products
            WHERE id = ?
            LIMIT 1
          `,
          [item.product_id],
        );

        if (productResult.rows.length === 0) {
          continue;
        }

        const product = productResult.rows[0];

        const isTrackedProduct =
          String(product.type) === 'product' &&
          Number(product.track_stock) === 1;

        if (!isTrackedProduct) {
          continue;
        }

        await tx.execute(
          `
            UPDATE products
            SET
              stock_quantity = stock_quantity + ?,
              updated_at = ?
            WHERE id = ?
          `,
          [
            Number(item.quantity),
            now,
            item.product_id,
          ],
        );
      }
    }

    await tx.execute(
      `
        UPDATE sales
        SET
          status = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [status, now, id],
    );
  });
}