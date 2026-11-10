import { db } from '../database';
import type { Payment } from '../types';
import { isValidStoredDate } from '../../utils/validation';

export type CreatePaymentInput = {
    invoice_id: number;
    amount_minor: number;
    payment_method: string;
    payment_date: string;
    reference?: string | null;
    notes?: string | null;
};

function mapPayment(row: any): Payment {
    return {
        id: Number(row.id),
        invoice_id: Number(row.invoice_id),
        amount_minor: Number(row.amount_minor),
        payment_method: String(row.payment_method),
        payment_date: String(row.payment_date),
        reference:
            row.reference === null
                ? null
                : String(row.reference),
        notes:
            row.notes === null
                ? null
                : String(row.notes),
        created_at: String(row.created_at),
    };
}

export async function getPaymentsByInvoiceId(
    invoiceId: number,
): Promise<Payment[]> {
    const result = await db.execute(
        `
      SELECT
        id,
        invoice_id,
        amount_minor,
        payment_method,
        payment_date,
        reference,
        notes,
        created_at
      FROM payments
      WHERE invoice_id = ?
      ORDER BY payment_date DESC, id DESC
    `,
        [invoiceId],
    );

    return result.rows.map(mapPayment);
}

export async function createPayment(
    input: CreatePaymentInput,
): Promise<Payment> {
    if (!Number.isInteger(input.invoice_id)) {
        throw new Error('Invalid invoice.');
    }

    if (
        !Number.isInteger(input.amount_minor) ||
        input.amount_minor <= 0
    ) {
        throw new Error(
            'Payment amount must be greater than zero.',
        );
    }

    const paymentMethod =
        input.payment_method.trim();

    if (!paymentMethod) {
        throw new Error(
            'Payment method is required.',
        );
    }

    const paymentDate =
        input.payment_date.trim();

    if (!paymentDate) {
        throw new Error(
            'Payment date is required.',
        );
    }

    if (!isValidStoredDate(input.payment_date)) {
        throw new Error(
            'Enter a valid payment date.',
        );
    }

    db.executeSync('BEGIN TRANSACTION');

    try {
        const invoiceResult = db.executeSync(
            `
        SELECT
          id,
          status,
          total_minor,
          paid_minor
        FROM invoices
        WHERE id = ?
        LIMIT 1
      `,
            [input.invoice_id],
        );

        if (invoiceResult.rows.length === 0) {
            throw new Error('Invoice not found.');
        }

        const invoice = invoiceResult.rows[0];

        if (invoice.status !== 'issued') {
            throw new Error(
                'Payments can only be recorded for issued invoices.',
            );
        }

        const totalMinor = Number(
            invoice.total_minor,
        );
        const paidMinor = Number(
            invoice.paid_minor,
        );

        const remainingMinor = Math.max(
            0,
            totalMinor - paidMinor,
        );

        if (remainingMinor <= 0) {
            throw new Error(
                'This invoice has already been fully paid.',
            );
        }

        if (
            input.amount_minor > remainingMinor
        ) {
            throw new Error(
                `Payment cannot exceed the remaining balance of ${remainingMinor} minor units.`,
            );
        }

        const reference =
            input.reference?.trim() || null;
        const notes =
            input.notes?.trim() || null;


        const paymentResult = db.executeSync(
            `
    INSERT INTO payments (
      invoice_id,
      amount_minor,
      payment_method,
      payment_date,
      reference,
      notes,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `,
            [
                input.invoice_id,
                input.amount_minor,
                paymentMethod,
                paymentDate,
                reference,
                notes,
            ],
        );

        db.executeSync(
            `
        UPDATE invoices
        SET
          paid_minor = paid_minor + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
            [
                input.amount_minor,
                input.invoice_id,
            ],
        );

        const paymentId = Number(
            paymentResult.insertId,
        );

        const createdPayment =
            db.executeSync(
                `
          SELECT
            id,
            invoice_id,
            amount_minor,
            payment_method,
            payment_date,
            reference,
            notes,
            created_at
          FROM payments
          WHERE id = ?
          LIMIT 1
        `,
                [paymentId],
            );

        if (createdPayment.rows.length === 0) {
            throw new Error(
                'Payment was created but could not be loaded.',
            );
        }

        db.executeSync('COMMIT');

        return mapPayment(
            createdPayment.rows[0],
        );
    } catch (error) {
        try {
            db.executeSync('ROLLBACK');
        } catch (rollbackError) {
            console.error(
                'Failed to rollback payment transaction:',
                rollbackError,
            );
        }

        throw error;
    }
}