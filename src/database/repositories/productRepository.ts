import { db } from '../database';
import type { Product, ProductType } from '../types';

export interface CreateProductInput {
    name: string;
    type: ProductType;
    sku?: string | null;
    description?: string | null;
    price_minor: number;
    cost_minor: number;
    tax_rate: number;
    track_stock: number;
    stock_quantity: number;
}

function mapProduct(row: Record<string, unknown>): Product {
    return {
        id: Number(row.id),
        name: String(row.name),
        type: String(row.type) as ProductType,
        sku: row.sku === null ? null : String(row.sku),
        description:
            row.description === null ? null : String(row.description),
        price_minor: Number(row.price_minor),
        cost_minor: Number(row.cost_minor),
        tax_rate: Number(row.tax_rate),
        track_stock: Number(row.track_stock),
        stock_quantity: Number(row.stock_quantity),
        is_active: Number(row.is_active),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
    };
}

export async function getProducts(): Promise<Product[]> {
    const result = await db.execute(`
    SELECT *
    FROM products
    WHERE is_active = 1
    ORDER BY name COLLATE NOCASE ASC
  `);

    return result.rows.map(row => mapProduct(row));
}

export async function getProductById(
    id: number,
): Promise<Product | null> {
    const result = await db.execute(
        `
      SELECT *
      FROM products
      WHERE id = ?
      LIMIT 1
    `,
        [id],
    );

    if (result.rows.length === 0) {
        return null;
    }

    return mapProduct(result.rows[0]);
}

export async function createProduct(
    input: CreateProductInput,
): Promise<number> {
    const now = new Date().toISOString();

    const result = await db.execute(
        `
      INSERT INTO products (
        name,
        type,
        sku,
        description,
        price_minor,
        cost_minor,
        tax_rate,
        track_stock,
        stock_quantity,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
            input.name.trim(),
            input.type,
            input.sku?.trim() || null,
            input.description?.trim() || null,
            input.price_minor,
            input.cost_minor,
            input.tax_rate,
            input.track_stock,
            input.stock_quantity,
            now,
            now,
        ],
    );

    if (result.insertId === undefined) {
        throw new Error('Failed to retrieve the new product ID.');
    }

    return result.insertId;
}

export async function updateProduct(
    id: number,
    input: CreateProductInput,
): Promise<void> {
    const now = new Date().toISOString();

    await db.execute(
        `
      UPDATE products
      SET
        name = ?,
        type = ?,
        sku = ?,
        description = ?,
        price_minor = ?,
        cost_minor = ?,
        tax_rate = ?,
        track_stock = ?,
        stock_quantity = ?,
        updated_at = ?
      WHERE id = ?
    `,
        [
            input.name.trim(),
            input.type,
            input.sku?.trim() || null,
            input.description?.trim() || null,
            input.price_minor,
            input.cost_minor,
            input.tax_rate,
            input.track_stock,
            input.stock_quantity,
            now,
            id,
        ],
    );
}

export async function deactivateProduct(id: number): Promise<void> {
    await db.execute(
        `
      UPDATE products
      SET
        is_active = 0,
        updated_at = ?
      WHERE id = ?
    `,
        [new Date().toISOString(), id],
    );
}