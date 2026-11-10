import { db } from '../database';

function getNow(): string {
    return new Date().toISOString();
}

function daysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function daysFromNow(days: number): string {
    return daysAgo(-days);
}

export function seedDemoData(): void {
    const businessResult = db.executeSync(`
    SELECT business_name
    FROM business_settings
    WHERE id = 1
    LIMIT 1
  `);

    const businessSettings = businessResult.rows[0] as
        | { business_name?: string }
        | undefined;

    const businessName = String(
        businessSettings?.business_name ?? '',
    ).trim();

    if (businessName !== '') {
        return;
    }

    const countResult = db.executeSync(`
    SELECT
      (SELECT COUNT(*) FROM customers) +
      (SELECT COUNT(*) FROM products) +
      (SELECT COUNT(*) FROM sales) +
      (SELECT COUNT(*) FROM invoices) AS total
  `);

    const totalRecords = Number(
        (countResult.rows[0] as { total?: number } | undefined)?.total ?? 0,
    );

    if (totalRecords > 0) {
        return;
    }

    db.executeSync('BEGIN TRANSACTION');

    try {
        const now = getNow();

        // ---------------------------------------------------------
        // Business settings
        // ---------------------------------------------------------

        db.executeSync(
            `
        UPDATE business_settings
        SET
          business_name = ?,
          logo_uri = NULL,
          email = ?,
          phone = ?,
          website = ?,
          address = ?,
          tax_number = ?,
          currency_code = 'INR',
          currency_symbol = '₹',
          currency_decimal_places = 2,
          invoice_prefix = 'INV-',
          next_invoice_number = ?,
          default_tax_rate = 18,
          primary_color = '#4F46E5',
          payment_methods = ?,
          updated_at = ?
        WHERE id = 1
      `,
            [
                'Northstar Studio',
                'hello@northstarstudio.com',
                '+91 98765 43210',
                'www.northstarstudio.com',
                'Bengaluru, Karnataka, India',
                'GSTIN29DEMO1234F1Z5',
                1006,
                'Cash, Bank transfer, UPI, Card',
                now,
            ],
        );

        // ---------------------------------------------------------
        // Customers
        // ---------------------------------------------------------

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
                1,
                'Arjun Menon',
                'arjun.menon@example.com',
                '+91 98470 11223',
                null,
                null,
                'Bengaluru, Karnataka, India',
                'Regular customer',
                0,
                daysAgo(40),
                daysAgo(2),
            ],
        );

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
                2,
                'Emily Carter',
                'emily.carter@example.com',
                '+44 20 7946 0182',
                'Green Leaf Cafe',
                null,
                'Manchester, United Kingdom',
                'Cafe equipment and design services',
                0,
                daysAgo(35),
                daysAgo(5),
            ],
        );

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
                3,
                'Daniel Wong',
                'daniel.wong@example.com',
                '+65 6123 7788',
                'BluePeak Traders',
                null,
                'Singapore',
                'Wholesale customer',
                0,
                daysAgo(28),
                daysAgo(8),
            ],
        );

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
                4,
                'Sofia Martinez',
                'sofia.martinez@example.com',
                '+34 91 123 4567',
                'Brightline Interiors',
                null,
                'Madrid, Spain',
                'Interior design client',
                0,
                daysAgo(22),
                daysAgo(3),
            ],
        );

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
                5,
                'Marcus Reed',
                'marcus.reed@example.com',
                '+1 416 555 0187',
                'Reed Consulting',
                null,
                'Toronto, Canada',
                'Archived sample customer',
                1,
                daysAgo(120),
                daysAgo(90),
            ],
        );

        // ---------------------------------------------------------
        // Products & services
        // ---------------------------------------------------------

        const products = [
            [
                1,
                'Wireless Keyboard',
                'product',
                'KB-100',
                'Compact wireless keyboard',
                249900,
                160000,
                18,
                1,
                23,
                5,
                1,
                daysAgo(60),
                now,
            ],
            [
                2,
                'Laptop Stand',
                'product',
                'LS-200',
                'Adjustable aluminium laptop stand',
                189900,
                110000,
                18,
                1,
                12,
                4,
                1,
                daysAgo(55),
                now,
            ],
            [
                3,
                'Office Chair',
                'product',
                'OC-300',
                'Ergonomic office chair',
                849900,
                580000,
                18,
                1,
                6,
                2,
                1,
                daysAgo(50),
                now,
            ],
            [
                4,
                'USB-C Hub',
                'product',
                'UH-400',
                '7-in-1 USB-C connectivity hub',
                329900,
                220000,
                18,
                1,
                17,
                5,
                1,
                daysAgo(45),
                now,
            ],
            [
                5,
                'Website Development',
                'service',
                'WEB-001',
                'Business website development package',
                3500000,
                0,
                18,
                0,
                0,
                0,
                1,
                daysAgo(40),
                now,
            ],
            [
                6,
                'UI/UX Design',
                'service',
                'DES-001',
                'UI/UX design and prototyping',
                1800000,
                0,
                18,
                0,
                0,
                0,
                1,
                daysAgo(40),
                now,
            ],
            [
                7,
                'Monthly Maintenance',
                'service',
                'MNT-001',
                'Website maintenance and support',
                750000,
                0,
                18,
                0,
                0,
                0,
                1,
                daysAgo(35),
                now,
            ],
            [
                8,
                'Wireless Mouse',
                'product',
                'MS-500',
                'Ergonomic wireless mouse',
                129900,
                75000,
                18,
                1,
                3,
                5,
                1,
                daysAgo(30),
                now,
            ],
        ];

        for (const product of products) {
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
                product,
            );
        }

        // ---------------------------------------------------------
        // Sales
        // ---------------------------------------------------------

        // Sale 1
        // 1 × Wireless Keyboard
        // Subtotal: ₹2,499
        // Tax: ₹449.82
        // Total: ₹2,948.82

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
                1,
                1,
                249900,
                0,
                44982,
                294882,
                'Office equipment purchase',
                'completed',
                daysAgo(18),
                daysAgo(18),
                daysAgo(18),
            ],
        );

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
                1,
                1,
                1,
                'Wireless Keyboard',
                1,
                249900,
                18,
                0,
                249900,
            ],
        );

        // Sale 2
        // 2 × Laptop Stand + 1 × USB-C Hub
        // Subtotal: ₹7,097
        // Discount: ₹198
        // Tax: ₹1,241.82
        // Total: ₹8,140.82

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
                2,
                2,
                709700,
                19800,
                124182,
                814082,
                'Cafe equipment order',
                'completed',
                daysAgo(12),
                daysAgo(12),
                daysAgo(12),
            ],
        );

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
                2,
                2,
                2,
                'Laptop Stand',
                2,
                189900,
                18,
                0,
                379800,
            ],
        );

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
                3,
                2,
                4,
                'USB-C Hub',
                1,
                329900,
                18,
                19800,
                310100,
            ],
        );

        // Sale 3
        // 1 × Office Chair

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
                3,
                3,
                849900,
                0,
                152982,
                1002882,
                'Office furniture order',
                'completed',
                daysAgo(7),
                daysAgo(7),
                daysAgo(7),
            ],
        );

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
                4,
                3,
                3,
                'Office Chair',
                1,
                849900,
                18,
                0,
                849900,
            ],
        );

        // Sale 4 — cancelled
        // Website Development + UI/UX Design

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
                4,
                4,
                5300000,
                300000,
                900000,
                5900000,
                'Website and design package',
                'cancelled',
                daysAgo(25),
                daysAgo(25),
                daysAgo(20),
            ],
        );

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
                5,
                4,
                5,
                'Website Development',
                1,
                3500000,
                18,
                0,
                3500000,
            ],
        );

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
                6,
                4,
                6,
                'UI/UX Design',
                1,
                1800000,
                18,
                300000,
                1500000,
            ],
        );

        // ---------------------------------------------------------
        // Invoices
        // ---------------------------------------------------------

        // Invoice 1 — Issued + fully paid

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
                1,
                'INV-1001',
                1,
                1,
                249900,
                0,
                44982,
                294882,
                294882,
                'issued',
                daysAgo(18),
                daysAgo(3),
                'Thank you for your business.',
                daysAgo(18),
                daysAgo(2),
            ],
        );

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
                1,
                1,
                1,
                'Wireless Keyboard',
                1,
                249900,
                18,
                0,
                249900,
                1,
            ],
        );

        // Invoice 2 — Issued + partially paid

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
                2,
                'INV-1002',
                2,
                2,
                709700,
                19800,
                124182,
                814082,
                300000,
                'issued',
                daysAgo(12),
                daysFromNow(18),
                'Partial payment received.',
                daysAgo(12),
                daysAgo(4),
            ],
        );

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
                2,
                2,
                2,
                'Laptop Stand',
                2,
                189900,
                18,
                0,
                379800,
                2,
            ],
        );

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
                3,
                2,
                4,
                'USB-C Hub',
                1,
                329900,
                18,
                19800,
                310100,
                1,
            ],
        );

        // Invoice 3 — Draft

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
                3,
                'INV-1003',
                3,
                null,
                849900,
                0,
                152982,
                1002882,
                0,
                'draft',
                daysAgo(2),
                daysFromNow(28),
                'Draft invoice awaiting issue.',
                daysAgo(2),
                daysAgo(2),
            ],
        );

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
                4,
                3,
                3,
                'Office Chair',
                1,
                849900,
                18,
                0,
                849900,
                0,
            ],
        );

        // Invoice 4 — Cancelled

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
                4,
                'INV-1004',
                4,
                null,
                3500000,
                0,
                630000,
                4130000,
                0,
                'cancelled',
                daysAgo(35),
                daysAgo(20),
                'Cancelled sample invoice.',
                daysAgo(35),
                daysAgo(30),
            ],
        );

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
                5,
                4,
                5,
                'Website Development',
                1,
                3500000,
                18,
                0,
                3500000,
                0,
            ],
        );

        // Invoice 5 — Issued + fully paid

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
                5,
                'INV-1005',
                3,
                null,
                849900,
                0,
                152982,
                1002882,
                1002882,
                'issued',
                daysAgo(20),
                daysAgo(5),
                'Website development services.',
                daysAgo(20),
                daysAgo(5),
            ],
        );

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
                6,
                5,
                3,
                'Office Chair',
                1,
                849900,
                18,
                0,
                849900,
                1,
            ],
        );

        // ---------------------------------------------------------
        // Payments
        // ---------------------------------------------------------

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
                1,
                1,
                294882,
                'UPI',
                daysAgo(15),
                'UPI-1001',
                'Full payment',
                daysAgo(15),
            ],
        );

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
                2,
                2,
                200000,
                'Bank transfer',
                daysAgo(10),
                'NEFT-2045',
                'First instalment',
                daysAgo(10),
            ],
        );

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
                3,
                2,
                100000,
                'UPI',
                daysAgo(4),
                'UPI-2088',
                'Second instalment',
                daysAgo(4),
            ],
        );

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
                4,
                5,
                1002882,
                'Card',
                daysAgo(5),
                'CARD-3001',
                'Paid in full',
                daysAgo(5),
            ],
        );

        // ---------------------------------------------------------
        // Seed marker
        // ---------------------------------------------------------


        db.executeSync('COMMIT');
    } catch (error) {
        db.executeSync('ROLLBACK');
        throw error;
    }
}