export type ProductType = 'product' | 'service';

export type SaleStatus = 'draft' | 'completed' | 'cancelled';

export type InvoiceStatus =
    | 'draft'
    | 'issued'
    | 'cancelled';

export interface BusinessSettings {
    id: 1;
    business_name: string;
    logo_uri: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    tax_number: string | null;
    currency_code: string;
    currency_symbol: string;
    currency_decimal_places: number;
    invoice_prefix: string;
    next_invoice_number: number;
    default_tax_rate: number;
    primary_color: string;
    payment_methods: string;
    created_at: string;
    updated_at: string;
}

export interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    tax_number: string | null;
    address: string | null;
    notes: string | null;
    is_archived: number;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: number;
    name: string;
    type: ProductType;
    sku: string | null;
    description: string | null;
    price_minor: number;
    cost_minor: number;
    tax_rate: number;
    track_stock: number;
    stock_quantity: number;
    is_active: number;
    created_at: string;
    updated_at: string;
}

export interface Sale {
    id: number;
    customer_id: number | null;
    subtotal_minor: number;
    discount_minor: number;
    tax_minor: number;
    total_minor: number;
    notes: string | null;
    status: SaleStatus;
    sale_date: string;
    created_at: string;
    updated_at: string;
}

export interface SaleItem {
    id: number;
    sale_id: number;
    product_id: number | null;
    name: string;
    quantity: number;
    unit_price_minor: number;
    tax_rate: number;
    discount_minor: number;
    total_minor: number;
}

export interface Invoice {
    id: number;
    invoice_number: string;
    customer_id: number | null;
    sale_id: number | null;
    subtotal_minor: number;
    discount_minor: number;
    tax_minor: number;
    total_minor: number;
    paid_minor: number;
    status: InvoiceStatus;
    issue_date: string;
    due_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    product_id: number | null;
    name: string;
    quantity: number;
    unit_price_minor: number;
    tax_rate: number;
    discount_minor: number;
    total_minor: number;
    stock_deducted_quantity: number;
}

export interface Payment {
    id: number;
    invoice_id: number;
    amount_minor: number;
    payment_method: string;
    payment_date: string;
    reference: string | null;
    notes: string | null;
    created_at: string;
}
