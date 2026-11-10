import { db } from '../database';
import type { BusinessSettings } from '../types';

export type UpdateBusinessProfileInput = {
    business_name: string;
    logo_uri?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    tax_number?: string | null;
};

function mapBusinessSettings(
    row: Record<string, unknown>,
): BusinessSettings {
    return {
        id: 1,
        business_name: String(row.business_name ?? ''),
        logo_uri: row.logo_uri == null ? null : String(row.logo_uri),
        email: row.email == null ? null : String(row.email),
        phone: row.phone == null ? null : String(row.phone),
        website: row.website == null ? null : String(row.website),
        address: row.address == null ? null : String(row.address),
        tax_number: row.tax_number == null ? null : String(row.tax_number),
        currency_code: String(row.currency_code ?? 'INR'),
        currency_symbol: String(row.currency_symbol ?? '₹'),
        currency_decimal_places: Number(row.currency_decimal_places ?? 2),
        invoice_prefix: String(row.invoice_prefix ?? 'INV'),
        next_invoice_number: Number(row.next_invoice_number ?? 1),
        default_tax_rate: Number(row.default_tax_rate ?? 0),
        primary_color: String(row.primary_color ?? '#4F46E5'),
        payment_methods: String(row.payment_methods ?? ''),
        created_at: String(row.created_at ?? ''),
        updated_at: String(row.updated_at ?? ''),
    };
}

export function getBusinessSettings(): BusinessSettings {
    const result = db.executeSync(
        `
      SELECT *
      FROM business_settings
      WHERE id = 1
      LIMIT 1
    `,
    );

    const row = result.rows?.[0];

    if (!row) {
        throw new Error('Business settings not found.');
    }

    return mapBusinessSettings(row as Record<string, unknown>);
}

export function updateBusinessProfile(
    input: UpdateBusinessProfileInput,
): BusinessSettings {
    if (!input.business_name.trim()) {
        throw new Error('Business name is required.');
    }

    db.executeSync(
        `
      UPDATE business_settings
      SET
        business_name = ?,
        logo_uri = ?,
        email = ?,
        phone = ?,
        website = ?,
        address = ?,
        tax_number = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `,
        [
            input.business_name.trim(),
            input.logo_uri?.trim() || null,
            input.email?.trim() || null,
            input.phone?.trim() || null,
            input.website?.trim() || null,
            input.address?.trim() || null,
            input.tax_number?.trim() || null,
        ],
    );

    return getBusinessSettings();
}

export type UpdateInvoiceSettingsInput = {
    invoice_prefix: string;
    next_invoice_number: number;
    default_tax_rate: number;
    payment_methods: string;
};

export function updateInvoiceSettings(
    input: UpdateInvoiceSettingsInput,
): BusinessSettings {
    if (!input.invoice_prefix.trim()) {
        throw new Error('Invoice prefix is required.');
    }

    if (
        !Number.isInteger(input.next_invoice_number) ||
        input.next_invoice_number < 1
    ) {
        throw new Error('Next invoice number must be a positive whole number.');
    }

    if (
        !Number.isFinite(input.default_tax_rate) ||
        input.default_tax_rate < 0 ||
        input.default_tax_rate > 100
    ) {
        throw new Error('Default tax rate must be between 0 and 100.');
    }

    db.executeSync(
        `
      UPDATE business_settings
      SET
        invoice_prefix = ?,
        next_invoice_number = ?,
        default_tax_rate = ?,
        payment_methods = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `,
        [
            input.invoice_prefix.trim(),
            input.next_invoice_number,
            input.default_tax_rate,
            input.payment_methods.trim(),
        ],
    );

    return getBusinessSettings();
}