import { db } from '../database';

async function createSchemaVersionTable(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    ) STRICT
  `);
}

async function getSchemaVersion(): Promise<number> {
  const result = await db.execute(
    'SELECT version FROM schema_version LIMIT 1',
  );

  if (result.rows.length === 0) {
    await db.execute(
      'INSERT INTO schema_version (version) VALUES (?)',
      [0],
    );

    return 0;
  }

  return Number(result.rows[0].version);
}

async function migrateToVersionOne(): Promise<void> {
  await db.transaction(async () => {
    /*
     * Business configuration
     *
     * This is intentionally a single-row table.
     * The app is designed around one business profile per installation.
     */
    await db.execute(`
      CREATE TABLE IF NOT EXISTS business_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),

        business_name TEXT NOT NULL DEFAULT '',
        logo_uri TEXT,

        email TEXT,
        phone TEXT,
        website TEXT,
        address TEXT,

        tax_number TEXT,

        currency_code TEXT NOT NULL DEFAULT 'INR',
        currency_symbol TEXT NOT NULL DEFAULT '₹',
        currency_decimal_places INTEGER NOT NULL DEFAULT 2,

        invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
        next_invoice_number INTEGER NOT NULL DEFAULT 1,

        default_tax_rate REAL NOT NULL DEFAULT 0,

        primary_color TEXT NOT NULL DEFAULT '#4F46E5',

        payment_methods TEXT NOT NULL DEFAULT '["Cash","Bank Transfer","UPI","Card","Cheque","Other"]',

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT
    `);

    /*
     * Customers
     */
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company_name TEXT,
        tax_number TEXT,

        address TEXT,
        notes TEXT,

        is_archived INTEGER NOT NULL DEFAULT 0
          CHECK (is_archived IN (0, 1)),

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT
    `);

    /*
     * Products and services
     *
     * type:
     *   product = stock can be tracked
     *   service = no stock tracking
     */
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,
        type TEXT NOT NULL
          CHECK (type IN ('product', 'service')),

        sku TEXT,

        description TEXT,

        price_minor INTEGER NOT NULL DEFAULT 0,
        cost_minor INTEGER NOT NULL DEFAULT 0,

        tax_rate REAL NOT NULL DEFAULT 0,

        track_stock INTEGER NOT NULL DEFAULT 0
          CHECK (track_stock IN (0, 1)),

        stock_quantity REAL NOT NULL DEFAULT 0,

        is_active INTEGER NOT NULL DEFAULT 1
          CHECK (is_active IN (0, 1)),

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT
    `);

    /*
     * Sales
     *
     * A sale is the actual business transaction.
     * An invoice can optionally be generated from a sale.
     */
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        customer_id INTEGER,

        subtotal_minor INTEGER NOT NULL DEFAULT 0,
        discount_minor INTEGER NOT NULL DEFAULT 0,
        tax_minor INTEGER NOT NULL DEFAULT 0,
        total_minor INTEGER NOT NULL DEFAULT 0,

        notes TEXT,

        status TEXT NOT NULL DEFAULT 'completed'
          CHECK (status IN ('draft', 'completed', 'cancelled')),

        sale_date TEXT NOT NULL,

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        FOREIGN KEY (customer_id)
          REFERENCES customers(id)
          ON DELETE SET NULL
      ) STRICT
    `);

    /*
     * Items belonging to a sale.
     *
     * Product information is also snapshotted so historical sales
     * don't change when the product is later renamed or repriced.
     */
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        sale_id INTEGER NOT NULL,
        product_id INTEGER,

        name TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit_price_minor INTEGER NOT NULL DEFAULT 0,
        tax_rate REAL NOT NULL DEFAULT 0,

        discount_minor INTEGER NOT NULL DEFAULT 0,
        total_minor INTEGER NOT NULL DEFAULT 0,

        FOREIGN KEY (sale_id)
          REFERENCES sales(id)
          ON DELETE CASCADE,

        FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE SET NULL
      ) STRICT
    `);

    /*
     * Invoices
     *
     * Version 1 starts with the original invoice lifecycle.
     * Version 3 replaces it with:
     *
     *   draft -> issued -> cancelled
     */
    await db.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        invoice_number TEXT NOT NULL UNIQUE,

        customer_id INTEGER,
        sale_id INTEGER,

        subtotal_minor INTEGER NOT NULL DEFAULT 0,
        discount_minor INTEGER NOT NULL DEFAULT 0,
        tax_minor INTEGER NOT NULL DEFAULT 0,
        total_minor INTEGER NOT NULL DEFAULT 0,

        paid_minor INTEGER NOT NULL DEFAULT 0,

        status TEXT NOT NULL DEFAULT 'draft'
          CHECK (
            status IN (
              'draft',
              'sent',
              'partially_paid',
              'paid',
              'overdue',
              'cancelled'
            )
          ),

        issue_date TEXT NOT NULL,
        due_date TEXT,

        notes TEXT,

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        FOREIGN KEY (customer_id)
          REFERENCES customers(id)
          ON DELETE SET NULL,

        FOREIGN KEY (sale_id)
          REFERENCES sales(id)
          ON DELETE SET NULL

      ) STRICT
    `);

    /*
     * Invoice items
     */
    await db.execute(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        invoice_id INTEGER NOT NULL,
        product_id INTEGER,

        name TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit_price_minor INTEGER NOT NULL DEFAULT 0,
        tax_rate REAL NOT NULL DEFAULT 0,

        discount_minor INTEGER NOT NULL DEFAULT 0,
        total_minor INTEGER NOT NULL DEFAULT 0,

        FOREIGN KEY (invoice_id)
          REFERENCES invoices(id)
          ON DELETE CASCADE,

        FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE SET NULL
      ) STRICT
    `);

    /*
     * Payments recorded against invoices.
     *
     * These are payment records, NOT online payment gateway transactions.
     */
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        invoice_id INTEGER NOT NULL,

        amount_minor INTEGER NOT NULL
          CHECK (amount_minor > 0),

        payment_method TEXT NOT NULL,
        payment_date TEXT NOT NULL,

        reference TEXT,
        notes TEXT,

        created_at TEXT NOT NULL,

        FOREIGN KEY (invoice_id)
          REFERENCES invoices(id)
          ON DELETE CASCADE
      ) STRICT
    `);


    /*
     * Indexes for the queries the app will perform frequently.
     */
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_customers_name
      ON customers(name)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_products_name
      ON products(name)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_sales_customer
      ON sales(customer_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_sales_date
      ON sales(sale_date)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_invoices_customer
      ON invoices(customer_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_invoices_status
      ON invoices(status)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_payments_invoice
      ON payments(invoice_id)
    `);

    const now = new Date().toISOString();

    await db.execute(
      `
        INSERT OR IGNORE INTO business_settings (
          id,
          created_at,
          updated_at
        )
        VALUES (1, ?, ?)
      `,
      [now, now],
    );

    // This migration creates schema version 1.
    await db.execute(
      'UPDATE schema_version SET version = ?',
      [1],
    );
  });
}

async function migrateToVersionThree(): Promise<void> {
  await db.transaction(async tx => {
    /*
     * SQLite does not support changing a CHECK constraint directly.
     *
     * Rebuild invoices with the final document lifecycle:
     *   draft -> issued -> cancelled
     *
     * Existing `sent` invoices are migrated to `issued`.
     *
     * invoice_items and payments are rebuilt as well because they
     * reference invoices through foreign keys.
     */

    await tx.execute(`
      ALTER TABLE invoices
      RENAME TO invoices_v2
    `);

    await tx.execute(`
      CREATE TABLE invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        invoice_number TEXT NOT NULL UNIQUE,

        customer_id INTEGER,
        sale_id INTEGER,

        subtotal_minor INTEGER NOT NULL DEFAULT 0,
        discount_minor INTEGER NOT NULL DEFAULT 0,
        tax_minor INTEGER NOT NULL DEFAULT 0,
        total_minor INTEGER NOT NULL DEFAULT 0,

        paid_minor INTEGER NOT NULL DEFAULT 0,

        status TEXT NOT NULL DEFAULT 'draft'
          CHECK (
            status IN (
              'draft',
              'issued',
              'cancelled'
            )
          ),

        issue_date TEXT NOT NULL,
        due_date TEXT,

        notes TEXT,

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        FOREIGN KEY (customer_id)
          REFERENCES customers(id)
          ON DELETE SET NULL,

        FOREIGN KEY (sale_id)
          REFERENCES sales(id)
          ON DELETE SET NULL

      ) STRICT
    `);

    await tx.execute(`
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
      SELECT
        id,
        invoice_number,
        customer_id,
        sale_id,
        subtotal_minor,
        discount_minor,
        tax_minor,
        total_minor,
        paid_minor,
        CASE
          WHEN status = 'sent' THEN 'issued'
          ELSE status
        END,
        issue_date,
        due_date,
        notes,
        created_at,
        updated_at
      FROM invoices_v2
    `);

    /*
     * Rebuild invoice_items so its foreign key points to
     * the new invoices table.
     */
    await tx.execute(`
      ALTER TABLE invoice_items
      RENAME TO invoice_items_v2
    `);

    await tx.execute(`
      CREATE TABLE invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        invoice_id INTEGER NOT NULL,
        product_id INTEGER,

        name TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit_price_minor INTEGER NOT NULL DEFAULT 0,
        tax_rate REAL NOT NULL DEFAULT 0,

        discount_minor INTEGER NOT NULL DEFAULT 0,
        total_minor INTEGER NOT NULL DEFAULT 0,

        FOREIGN KEY (invoice_id)
          REFERENCES invoices(id)
          ON DELETE CASCADE,

        FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE SET NULL
      ) STRICT
    `);

    await tx.execute(`
      INSERT INTO invoice_items (
        id,
        invoice_id,
        product_id,
        name,
        quantity,
        unit_price_minor,
        tax_rate,
        discount_minor,
        total_minor
      )
      SELECT
        id,
        invoice_id,
        product_id,
        name,
        quantity,
        unit_price_minor,
        tax_rate,
        discount_minor,
        total_minor
      FROM invoice_items_v2
    `);

    /*
     * Rebuild payments so its foreign key points to
     * the new invoices table.
     */
    await tx.execute(`
      ALTER TABLE payments
      RENAME TO payments_v2
    `);

    await tx.execute(`
      CREATE TABLE payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        invoice_id INTEGER NOT NULL,

        amount_minor INTEGER NOT NULL
          CHECK (amount_minor > 0),

        payment_method TEXT NOT NULL,
        payment_date TEXT NOT NULL,

        reference TEXT,
        notes TEXT,

        created_at TEXT NOT NULL,

        FOREIGN KEY (invoice_id)
          REFERENCES invoices(id)
          ON DELETE CASCADE
      ) STRICT
    `);

    await tx.execute(`
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
      SELECT
        id,
        invoice_id,
        amount_minor,
        payment_method,
        payment_date,
        reference,
        notes,
        created_at
      FROM payments_v2
    `);

    /*
     * The old tables are no longer needed.
     */
    await tx.execute(`
      DROP TABLE payments_v2
    `);

    await tx.execute(`
      DROP TABLE invoice_items_v2
    `);

    await tx.execute(`
      DROP TABLE invoices_v2
    `);

    /*
     * Restore invoice-related indexes.
     */
    await tx.execute(`
      CREATE INDEX IF NOT EXISTS idx_invoices_customer
      ON invoices(customer_id)
    `);

    await tx.execute(`
      CREATE INDEX IF NOT EXISTS idx_invoices_status
      ON invoices(status)
    `);

    await tx.execute(`
      CREATE INDEX IF NOT EXISTS idx_payments_invoice
      ON payments(invoice_id)
    `);

    // This migration creates schema version 3.
    await tx.execute(
      'UPDATE schema_version SET version = ?',
      [3],
    );
  });
}

async function migrateToVersionFour(): Promise<void> {
  await db.transaction(async tx => {
    await tx.execute(`
      ALTER TABLE invoice_items
      ADD COLUMN stock_deducted_quantity
      REAL NOT NULL DEFAULT 0
    `);

    // This migration creates schema version 4.
    await tx.execute(
      'UPDATE schema_version SET version = ?',
      [4],
    );
  });
}

async function migrateToVersionFive(): Promise<void> {
  await db.transaction(async tx => {
    await tx.execute(`
      CREATE TABLE IF NOT EXISTS app_preferences (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      ) STRICT
    `);

    // This migration creates schema version 5.
    await tx.execute(
      'UPDATE schema_version SET version = ?',
      [5],
    );
  });
}


async function migrateToVersionEight(): Promise<void> {
  await db.transaction(async tx => {
    const invoiceColumns = await tx.execute('PRAGMA table_info(invoices)');
    const hasQuotationId = invoiceColumns.rows.some(
      column => String(column.name) === 'quotation_id',
    );

    if (hasQuotationId) {
      // Remove indexes before rebuilding tables so their names can be reused.
      await tx.execute('DROP INDEX IF EXISTS idx_invoices_quotation_unique');
      await tx.execute('DROP INDEX IF EXISTS idx_invoices_customer');
      await tx.execute('DROP INDEX IF EXISTS idx_invoices_status');
      await tx.execute('DROP INDEX IF EXISTS idx_payments_invoice');

      // Rebuild invoices and dependent tables to remove the legacy quotation
      // foreign key while preserving invoices, invoice items, and payments.
      await tx.execute('ALTER TABLE invoices RENAME TO invoices_legacy_v7');
      await tx.execute('ALTER TABLE invoice_items RENAME TO invoice_items_legacy_v7');
      await tx.execute('ALTER TABLE payments RENAME TO payments_legacy_v7');

      await tx.execute(`
        CREATE TABLE invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_number TEXT NOT NULL UNIQUE,
          customer_id INTEGER,
          sale_id INTEGER,
          subtotal_minor INTEGER NOT NULL DEFAULT 0,
          discount_minor INTEGER NOT NULL DEFAULT 0,
          tax_minor INTEGER NOT NULL DEFAULT 0,
          total_minor INTEGER NOT NULL DEFAULT 0,
          paid_minor INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'draft'
            CHECK (status IN ('draft', 'issued', 'cancelled')),
          issue_date TEXT NOT NULL,
          due_date TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
          FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
        ) STRICT
      `);

      await tx.execute(`
        INSERT INTO invoices (
          id, invoice_number, customer_id, sale_id, subtotal_minor,
          discount_minor, tax_minor, total_minor, paid_minor, status,
          issue_date, due_date, notes, created_at, updated_at
        )
        SELECT
          id, invoice_number, customer_id, sale_id, subtotal_minor,
          discount_minor, tax_minor, total_minor, paid_minor, status,
          issue_date, due_date, notes, created_at, updated_at
        FROM invoices_legacy_v7
      `);

      await tx.execute(`
        CREATE TABLE invoice_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          product_id INTEGER,
          name TEXT NOT NULL,
          quantity REAL NOT NULL DEFAULT 1,
          unit_price_minor INTEGER NOT NULL DEFAULT 0,
          tax_rate REAL NOT NULL DEFAULT 0,
          discount_minor INTEGER NOT NULL DEFAULT 0,
          total_minor INTEGER NOT NULL DEFAULT 0,
          stock_deducted_quantity REAL NOT NULL DEFAULT 0,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
        ) STRICT
      `);

      await tx.execute(`
        INSERT INTO invoice_items (
          id, invoice_id, product_id, name, quantity, unit_price_minor,
          tax_rate, discount_minor, total_minor, stock_deducted_quantity
        )
        SELECT
          id, invoice_id, product_id, name, quantity, unit_price_minor,
          tax_rate, discount_minor, total_minor, stock_deducted_quantity
        FROM invoice_items_legacy_v7
      `);

      await tx.execute(`
        CREATE TABLE payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
          payment_method TEXT NOT NULL,
          payment_date TEXT NOT NULL,
          reference TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        ) STRICT
      `);

      await tx.execute(`
        INSERT INTO payments (
          id, invoice_id, amount_minor, payment_method, payment_date,
          reference, notes, created_at
        )
        SELECT
          id, invoice_id, amount_minor, payment_method, payment_date,
          reference, notes, created_at
        FROM payments_legacy_v7
      `);

      await tx.execute('DROP TABLE invoice_items_legacy_v7');
      await tx.execute('DROP TABLE payments_legacy_v7');
      await tx.execute('DROP TABLE invoices_legacy_v7');

      await tx.execute('CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id)');
      await tx.execute('CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)');
      await tx.execute('CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id)');
    }

    // Remove tables and indexes that belonged to deleted Starter features.
    await tx.execute('DROP INDEX IF EXISTS idx_quotations_customer');
    await tx.execute('DROP INDEX IF EXISTS idx_expenses_date');
    await tx.execute('DROP INDEX IF EXISTS idx_expenses_category');
    await tx.execute('DROP TABLE IF EXISTS quotation_items');
    await tx.execute('DROP TABLE IF EXISTS quotations');
    await tx.execute('DROP TABLE IF EXISTS expenses');

    const settingsColumns = await tx.execute('PRAGMA table_info(business_settings)');
    const hasQuotationPrefix = settingsColumns.rows.some(
      column => String(column.name) === 'quotation_prefix',
    );
    const hasNextQuotationNumber = settingsColumns.rows.some(
      column => String(column.name) === 'next_quotation_number',
    );

    if (hasQuotationPrefix) {
      await tx.execute('ALTER TABLE business_settings DROP COLUMN quotation_prefix');
    }
    if (hasNextQuotationNumber) {
      await tx.execute('ALTER TABLE business_settings DROP COLUMN next_quotation_number');
    }

    await tx.execute('UPDATE schema_version SET version = ?', [8]);
  });
}

export async function runMigrations(): Promise<void> {
  await createSchemaVersionTable();

  const currentVersion = await getSchemaVersion();

  if (currentVersion < 1) {
    await migrateToVersionOne();
  }

  if (currentVersion < 3) {
    await migrateToVersionThree();
  }

  if (currentVersion < 4) {
    await migrateToVersionFour();
  }

  if (currentVersion < 5) {
    await migrateToVersionFive();
  }

  if (currentVersion < 6) {
    await db.transaction(async tx => {
      await tx.execute('UPDATE schema_version SET version = ?', [6]);
    });
  }

  if (currentVersion < 7) {
    await db.transaction(async tx => {
      const columns = await tx.execute('PRAGMA table_info(products)');
      const hasLowStockThreshold = columns.rows.some(
        column => String(column.name) === 'low_stock_threshold',
      );

      if (hasLowStockThreshold) {
        await tx.execute(
          'ALTER TABLE products DROP COLUMN low_stock_threshold',
        );
      }

      await tx.execute('UPDATE schema_version SET version = ?', [7]);
    });
  }


  if (currentVersion < 8) {
    await migrateToVersionEight();
  }
}