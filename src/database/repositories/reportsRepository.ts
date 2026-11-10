import { db } from '../database';

export type ReportPeriod = {
    startDate: string;
    endDate: string;
};

export type SalesSummary = {
    total_minor: number;
    transaction_count: number;
    average_minor: number;
};

export type InvoiceSummary = {
    invoiced_minor: number;
    paid_minor: number;
    outstanding_minor: number;
    invoice_count: number;
    paid_count: number;
    partial_count: number;
    unpaid_count: number;
};

export type PaymentSummary = {
    total_minor: number;
    payment_count: number;
};

export type TopProduct = {
    name: string;
    quantity: number;
    total_minor: number;
};

export type ReportsSummary = {
    sales: SalesSummary;
    invoices: InvoiceSummary;
    payments: PaymentSummary;
    top_products: TopProduct[];
};

export async function getSalesSummary(
    period: ReportPeriod,
): Promise<SalesSummary> {
    const result = await db.execute(
        `
        SELECT
            COALESCE(SUM(total_minor), 0) AS total_minor,
            COUNT(*) AS transaction_count
        FROM sales
        WHERE CASE WHEN length(sale_date) = 10 THEN sale_date ELSE date(sale_date, 'localtime') END >= ?
          AND CASE WHEN length(sale_date) = 10 THEN sale_date ELSE date(sale_date, 'localtime') END <= ?
          AND status = 'completed'
        `,
        [period.startDate, period.endDate],
    );

    const row = result.rows[0];

    const totalMinor = Number(row?.total_minor ?? 0);
    const transactionCount = Number(
        row?.transaction_count ?? 0,
    );

    return {
        total_minor: totalMinor,
        transaction_count: transactionCount,
        average_minor:
            transactionCount > 0
                ? Math.round(
                    totalMinor / transactionCount,
                )
                : 0,
    };
}

export async function getInvoiceSummary(
    period: ReportPeriod,
): Promise<InvoiceSummary> {
    const result = await db.execute(
        `
        SELECT
            COALESCE(SUM(total_minor), 0) AS invoiced_minor,
            COALESCE(SUM(paid_minor), 0) AS paid_minor,
            COUNT(*) AS invoice_count,
            SUM(
                CASE
                    WHEN paid_minor >= total_minor
                    THEN 1
                    ELSE 0
                END
            ) AS paid_count,
            SUM(
                CASE
                    WHEN paid_minor > 0
                         AND paid_minor < total_minor
                    THEN 1
                    ELSE 0
                END
            ) AS partial_count,
            SUM(
                CASE
                    WHEN paid_minor = 0
                         AND total_minor > 0
                    THEN 1
                    ELSE 0
                END
            ) AS unpaid_count
        FROM invoices
        WHERE CASE WHEN length(issue_date) = 10 THEN issue_date ELSE date(issue_date, 'localtime') END >= ?
          AND CASE WHEN length(issue_date) = 10 THEN issue_date ELSE date(issue_date, 'localtime') END <= ?
          AND status = 'issued'
        `,
        [period.startDate, period.endDate],
    );

    const row = result.rows[0];

    const invoicedMinor = Number(
        row?.invoiced_minor ?? 0,
    );
    const paidMinor = Number(
        row?.paid_minor ?? 0,
    );

    return {
        invoiced_minor: invoicedMinor,
        paid_minor: paidMinor,
        outstanding_minor: Math.max(
            0,
            invoicedMinor - paidMinor,
        ),
        invoice_count: Number(
            row?.invoice_count ?? 0,
        ),
        paid_count: Number(
            row?.paid_count ?? 0,
        ),
        partial_count: Number(
            row?.partial_count ?? 0,
        ),
        unpaid_count: Number(
            row?.unpaid_count ?? 0,
        ),
    };
}

export async function getPaymentSummary(
    period: ReportPeriod,
): Promise<PaymentSummary> {
    const result = await db.execute(
        `
        SELECT
            COALESCE(SUM(amount_minor), 0) AS total_minor,
            COUNT(*) AS payment_count
        FROM payments
        WHERE CASE WHEN length(payment_date) = 10 THEN payment_date ELSE date(payment_date, 'localtime') END >= ?
          AND CASE WHEN length(payment_date) = 10 THEN payment_date ELSE date(payment_date, 'localtime') END <= ?
        `,
        [period.startDate, period.endDate],
    );

    const row = result.rows[0];

    return {
        total_minor: Number(
            row?.total_minor ?? 0,
        ),
        payment_count: Number(
            row?.payment_count ?? 0,
        ),
    };
}

export async function getTopProducts(
    period: ReportPeriod,
    limit = 5,
): Promise<TopProduct[]> {
    const safeLimit = Math.max(
        1,
        Math.min(20, Math.floor(limit)),
    );

    const result = await db.execute(
        `
        SELECT
            si.name AS name,
            COALESCE(SUM(si.quantity), 0) AS quantity,
            COALESCE(SUM(si.total_minor), 0) AS total_minor
        FROM sale_items si
        INNER JOIN sales s
            ON s.id = si.sale_id
        WHERE CASE WHEN length(s.sale_date) = 10 THEN s.sale_date ELSE date(s.sale_date, 'localtime') END >= ?
          AND CASE WHEN length(s.sale_date) = 10 THEN s.sale_date ELSE date(s.sale_date, 'localtime') END <= ?
          AND s.status = 'completed'
        GROUP BY si.name
        ORDER BY total_minor DESC, quantity DESC, si.name ASC
        LIMIT ${safeLimit}
        `,
        [period.startDate, period.endDate],
    );

    return result.rows.map(row => ({
        name: String(row.name),
        quantity: Number(row.quantity),
        total_minor: Number(row.total_minor),
    }));
}

export async function getReportsSummary(
    period: ReportPeriod,
): Promise<ReportsSummary> {
    const [sales, invoices, payments, topProducts] =
        await Promise.all([
            getSalesSummary(period),
            getInvoiceSummary(period),
            getPaymentSummary(period),
            getTopProducts(period),
        ]);

    return {
        sales,
        invoices,
        payments,
        top_products: topProducts,
    };
}