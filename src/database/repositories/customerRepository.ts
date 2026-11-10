import { db } from '../database';
import type { Customer } from '../types';

export interface CreateCustomerInput {
    name: string;
    email?: string | null;
    phone?: string | null;
    company_name?: string | null;
    tax_number?: string | null;
    address?: string | null;
    notes?: string | null;
}

function mapCustomer(row: Record<string, unknown>): Customer {
    return {
        id: Number(row.id),
        name: String(row.name),
        email: row.email === null ? null : String(row.email),
        phone: row.phone === null ? null : String(row.phone),
        company_name:
            row.company_name === null ? null : String(row.company_name),
        tax_number:
            row.tax_number === null ? null : String(row.tax_number),
        address: row.address === null ? null : String(row.address),
        notes: row.notes === null ? null : String(row.notes),
        is_archived: Number(row.is_archived),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
    };
}

export async function getCustomers(): Promise<Customer[]> {
    const result = await db.execute(`
    SELECT *
    FROM customers
    WHERE is_archived = 0
    ORDER BY name COLLATE NOCASE ASC
  `);

    return result.rows.map(row => mapCustomer(row));
}

export async function getCustomerById(
    id: number,
): Promise<Customer | null> {
    const result = await db.execute(
        `
      SELECT *
      FROM customers
      WHERE id = ?
      LIMIT 1
    `,
        [id],
    );

    if (result.rows.length === 0) {
        return null;
    }

    return mapCustomer(result.rows[0]);
}

export async function createCustomer(
    input: CreateCustomerInput,
): Promise<number> {
    const now = new Date().toISOString();

    const result = await db.execute(
        `
      INSERT INTO customers (
        name,
        email,
        phone,
        company_name,
        tax_number,
        address,
        notes,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
            input.name.trim(),
            input.email ?? null,
            input.phone ?? null,
            input.company_name ?? null,
            input.tax_number ?? null,
            input.address ?? null,
            input.notes ?? null,
            now,
            now,
        ],
    );

    if (result.insertId === undefined) {
        throw new Error('Failed to retrieve the new customer ID.');
    }

    return result.insertId;
}


export async function updateCustomer(
    id: number,
    input: CreateCustomerInput,
): Promise<void> {
    const now = new Date().toISOString();

    await db.execute(
        `
      UPDATE customers
      SET
        name = ?,
        email = ?,
        phone = ?,
        company_name = ?,
        tax_number = ?,
        address = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?
    `,
        [
            input.name.trim(),
            input.email ?? null,
            input.phone ?? null,
            input.company_name ?? null,
            input.tax_number ?? null,
            input.address ?? null,
            input.notes ?? null,
            now,
            id,
        ],
    );
}
export async function archiveCustomer(id: number): Promise<void> {
    await db.execute(
        `
      UPDATE customers
      SET
        is_archived = 1,
        updated_at = ?
      WHERE id = ?
    `,
        [new Date().toISOString(), id],
    );
}