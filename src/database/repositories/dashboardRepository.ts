
import { db } from '../database';

export type DashboardStats = {
    todaySalesMinor: number;
    outstandingInvoicesMinor: number;
    customerCount: number;
};

export type RecentSale = {
    id: number;
    customerName: string | null;
    totalMinor: number;
    saleDate: string;
};

export type DashboardData = {
    stats: DashboardStats;
    recentSales: RecentSale[];
};

function getToday(): string {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(
        2,
        '0',
    );
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function getDashboardStats(): DashboardStats {
    const today = getToday();

    const salesResult = db.executeSync(
        `
        SELECT COALESCE(SUM(total_minor), 0) AS total
        FROM sales
        WHERE status = 'completed'
          AND CASE
            WHEN length(sale_date) = 10 THEN sale_date
            ELSE date(sale_date, 'localtime')
          END = ?
        `,
        [today],
    );

    const outstandingResult = db.executeSync(
        `
        SELECT COALESCE(
            SUM(total_minor - paid_minor),
            0
        ) AS total
        FROM invoices
        WHERE status = 'issued'
          AND total_minor > paid_minor
        `,
    );

    const customersResult = db.executeSync(
        `
        SELECT COUNT(*) AS count
        FROM customers
        WHERE is_archived = 0
        `,
    );

    return {
        todaySalesMinor: Number(
            salesResult.rows?.[0]?.total ?? 0,
        ),
        outstandingInvoicesMinor: Number(
            outstandingResult.rows?.[0]?.total ?? 0,
        ),
        customerCount: Number(
            customersResult.rows?.[0]?.count ?? 0,
        ),
    };
}

export function getRecentSales(
    limit = 5,
): RecentSale[] {
    const result = db.executeSync(
        `
        SELECT
            s.id,
            c.name AS customer_name,
            s.total_minor,
            s.sale_date
        FROM sales s
        LEFT JOIN customers c
            ON c.id = s.customer_id
        WHERE s.status = 'completed'
        ORDER BY s.sale_date DESC, s.id DESC
        LIMIT ?
        `,
        [limit],
    );

    return (result.rows ?? []).map(row => ({
        id: Number(row.id),
        customerName:
            row.customer_name == null
                ? null
                : String(row.customer_name),
        totalMinor: Number(row.total_minor),
        saleDate: String(row.sale_date),
    }));
}

export function getDashboardData(): DashboardData {
    return {
        stats: getDashboardStats(),
        recentSales: getRecentSales(),
    };
}
