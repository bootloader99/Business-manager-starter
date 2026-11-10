import {
    PDFDocument,
    rgb,
    type PDFFont,
    type PDFPage,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
    notoSansBold,
    notoSansRegular,
} from './pdfFonts';
import {
    FileSystem,
    Dirs,
} from 'react-native-file-access';

import {
    getInvoiceById,
} from '../../database/repositories/invoiceRepository';
import {
    getCustomerById,
} from '../../database/repositories/customerRepository';
import {
    getBusinessSettings,
} from '../../database/repositories/businessSettingsRepository';

import type {
    BusinessSettings,
    Customer,
    Invoice,
    InvoiceItem,
} from '../../database/types';

import { uint8ArrayToBase64 } from '../../utils/base64';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN_X = 42;
const TOP_MARGIN = 42;
const BOTTOM_MARGIN = 42;

const CONTENT_WIDTH =
    PAGE_WIDTH - MARGIN_X * 2;

const DARK = rgb(0.067, 0.094, 0.153);
const SECONDARY = rgb(0.40, 0.44, 0.50);
const BORDER = rgb(0.89, 0.90, 0.92);
const WHITE = rgb(1, 1, 1);
const LIGHT_SURFACE = rgb(0.97, 0.98, 0.99);

type PdfColors = {
    primary: ReturnType<typeof rgb>;
    dark: ReturnType<typeof rgb>;
    secondary: ReturnType<typeof rgb>;
    border: ReturnType<typeof rgb>;
    white: ReturnType<typeof rgb>;
    lightSurface: ReturnType<typeof rgb>;
};

type PdfContext = {
    doc: PDFDocument;
    regularFont: PDFFont;
    boldFont: PDFFont;
    colors: PdfColors;
};

type InvoicePdfData = {
    invoice: Invoice;
    items: InvoiceItem[];
    customer: Customer | null;
    business: BusinessSettings;
};

function hexToRgb(hex: string) {
    const normalized = hex
        .replace('#', '')
        .trim();

    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return rgb(0.31, 0.27, 0.88);
    }

    const red =
        parseInt(normalized.slice(0, 2), 16) /
        255;

    const green =
        parseInt(normalized.slice(2, 4), 16) /
        255;

    const blue =
        parseInt(normalized.slice(4, 6), 16) /
        255;

    return rgb(red, green, blue);
}

function formatCurrency(
    amountMinor: number,
    settings: BusinessSettings,
): string {
    const decimals =
        settings.currency_decimal_places;

    const amount =
        amountMinor /
        Math.pow(10, decimals);

    return `${settings.currency_symbol}${amount.toFixed(
        decimals,
    )}`;
}

function formatDate(
    value: string | null | undefined,
): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

function getStatusLabel(
    invoice: Invoice,
): string {
    if (invoice.status === 'draft') {
        return 'DRAFT';
    }

    if (invoice.status === 'cancelled') {
        return 'CANCELLED';
    }

    if (
        invoice.paid_minor >=
        invoice.total_minor
    ) {
        return 'PAID';
    }

    if (invoice.paid_minor > 0) {
        return 'PARTIALLY PAID';
    }

    return 'UNPAID';
}

function drawText(
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    font: PDFFont,
    size: number,
    color: ReturnType<typeof rgb>,
): void {
    page.drawText(text, {
        x,
        y,
        size,
        font,
        color,
    });
}

function drawRightText(
    page: PDFPage,
    text: string,
    rightX: number,
    y: number,
    font: PDFFont,
    size: number,
    color: ReturnType<typeof rgb>,
): void {
    const width =
        font.widthOfTextAtSize(text, size);

    drawText(
        page,
        text,
        rightX - width,
        y,
        font,
        size,
        color,
    );
}

function drawLine(
    page: PDFPage,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: ReturnType<typeof rgb>,
    thickness = 1,
): void {
    page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        color,
        thickness,
    });
}

function drawStatusBadge(
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    colors: PdfColors,
    boldFont: PDFFont,
): void {
    const size = 8;
    const paddingX = 7;
    const paddingY = 4;

    const textWidth =
        boldFont.widthOfTextAtSize(
            text,
            size,
        );

    const width =
        textWidth + paddingX * 2;

    const height = 18;

    page.drawRectangle({
        x,
        y,
        width,
        height,
        color: colors.primary,
        opacity: 0.10,
        borderColor: colors.primary,
        borderWidth: 0.5,
    });

    drawText(
        page,
        text,
        x + paddingX,
        y + paddingY + 1,
        boldFont,
        size,
        colors.primary,
    );
}

function wrapText(
    text: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
): string[] {
    const cleanText = text.trim();
    if (!cleanText) return [];

    const words = cleanText.split(/\s+/);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        let remaining = word;
        // Split unbroken identifiers and URLs so text stays inside its column.
        while (remaining.length > 0 && font.widthOfTextAtSize(remaining, size) > maxWidth) {
            let splitAt = 1;
            for (let index = 1; index <= remaining.length; index += 1) {
                if (font.widthOfTextAtSize(remaining.slice(0, index), size) > maxWidth) break;
                splitAt = index;
            }
            if (current) {
                lines.push(current);
                current = '';
            }
            lines.push(remaining.slice(0, splitAt));
            remaining = remaining.slice(splitAt);
        }

        if (!remaining) continue;
        const candidate = current ? current + ' ' + remaining : remaining;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
            current = candidate;
        } else {
            if (current) lines.push(current);
            current = remaining;
        }
    }

    if (current) lines.push(current);
    return lines;
}

function drawWrappedText(
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    width: number,
    font: PDFFont,
    size: number,
    color: ReturnType<typeof rgb>,
    lineHeight: number,
): number {
    const lines = wrapText(
        text,
        font,
        size,
        width,
    );

    let currentY = y;

    for (const line of lines) {
        drawText(
            page,
            line,
            x,
            currentY,
            font,
            size,
            color,
        );

        currentY -= lineHeight;
    }

    return currentY;
}

function drawSectionTitle(
    page: PDFPage,
    title: string,
    x: number,
    y: number,
    font: PDFFont,
    colors: PdfColors,
): void {
    drawText(
        page,
        title.toUpperCase(),
        x,
        y,
        font,
        9,
        colors.secondary,
    );
}

function drawBusinessHeader(
    page: PDFPage,
    data: InvoicePdfData,
    ctx: PdfContext,
    y: number,
): number {
    const {
        invoice,
        business,
    } = data;

    const {
        regularFont,
        boldFont,
        colors,
    } = ctx;

    let businessY = drawWrappedText(
        page,
        business.business_name || 'My Business',
        MARGIN_X,
        y,
        270,
        boldFont,
        21,
        colors.dark,
        24,
    ) - 2;

    const businessLines = [
        business.address,
        business.email,
        business.phone,
        business.website,
        business.tax_number
            ? `Tax No: ${business.tax_number}`
            : null,
    ].filter(
        (
            value,
        ): value is string =>
            Boolean(value?.trim()),
    );

    for (const line of businessLines) {
        businessY = drawWrappedText(
            page,
            line,
            MARGIN_X,
            businessY,
            270,
            regularFont,
            9,
            colors.secondary,
            12,
        );
    }

    const rightX =
        PAGE_WIDTH - MARGIN_X;

    drawRightText(
        page,
        'INVOICE',
        rightX,
        y,
        boldFont,
        24,
        colors.primary,
    );

    drawRightText(
        page,
        invoice.invoice_number,
        rightX,
        y - 25,
        boldFont,
        12,
        colors.dark,
    );

    drawStatusBadge(
        page,
        getStatusLabel(invoice),
        rightX -
        boldFont.widthOfTextAtSize(
            getStatusLabel(invoice),
            8,
        ) -
        14,
        y - 50,
        colors,
        boldFont,
    );

    const dividerY =
        Math.min(
            businessY,
            y - 75,
        ) - 12;

    drawLine(
        page,
        MARGIN_X,
        dividerY,
        rightX,
        dividerY,
        colors.border,
    );

    return dividerY - 28;
}

function drawCustomerAndInvoiceInfo(
    page: PDFPage,
    data: InvoicePdfData,
    ctx: PdfContext,
    y: number,
): number {
    const {
        invoice,
        customer,
    } = data;

    const {
        regularFont,
        boldFont,
        colors,
    } = ctx;

    const rightX =
        PAGE_WIDTH - MARGIN_X;

    drawSectionTitle(
        page,
        'Bill To',
        MARGIN_X,
        y,
        boldFont,
        colors,
    );

    let customerY = y - 18;

    if (customer) {
        customerY = drawWrappedText(
            page,
            customer.name,
            MARGIN_X,
            customerY,
            235,
            boldFont,
            11,
            colors.dark,
            14,
        ) - 1;

        if (customer.company_name) {
            customerY =
                drawWrappedText(
                    page,
                    customer.company_name,
                    MARGIN_X,
                    customerY,
                    235,
                    regularFont,
                    9,
                    colors.secondary,
                    12,
                );
        }

        const customerLines = [
            customer.address,
            customer.email,
            customer.phone,
            customer.tax_number
                ? `Tax No: ${customer.tax_number}`
                : null,
        ].filter(
            (
                value,
            ): value is string =>
                Boolean(value?.trim()),
        );

        for (const line of customerLines) {
            customerY =
                drawWrappedText(
                    page,
                    line,
                    MARGIN_X,
                    customerY,
                    235,
                    regularFont,
                    9,
                    colors.secondary,
                    12,
                );
        }
    } else {
        drawText(
            page,
            'Walk-in customer',
            MARGIN_X,
            customerY,
            regularFont,
            10,
            colors.secondary,
        );

        customerY -= 15;
    }

    drawSectionTitle(
        page,
        'Invoice Details',
        365,
        y,
        boldFont,
        colors,
    );

    const detailX = 365;
    const valueX = rightX;

    const details = [
        [
            'Issue date',
            formatDate(invoice.issue_date),
        ],
        [
            'Due date',
            formatDate(invoice.due_date),
        ],
    ];

    let detailY = y - 18;

    for (const [label, value] of details) {
        drawText(
            page,
            label,
            detailX,
            detailY,
            regularFont,
            9,
            colors.secondary,
        );

        drawRightText(
            page,
            value,
            valueX,
            detailY,
            regularFont,
            9,
            colors.dark,
        );

        detailY -= 17;
    }

    return (
        Math.min(
            customerY,
            detailY,
        ) - 20
    );
}

function drawTableHeader(
    page: PDFPage,
    ctx: PdfContext,
    y: number,
): number {
    const {
        boldFont,
        colors,
    } = ctx;

    const rowHeight = 24;

    page.drawRectangle({
        x: MARGIN_X,
        y: y - rowHeight + 5,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: colors.lightSurface,
    });

    drawText(
        page,
        'ITEM',
        MARGIN_X + 8,
        y - 10,
        boldFont,
        8,
        colors.secondary,
    );

    drawRightText(
        page,
        'QTY',
        365,
        y - 10,
        boldFont,
        8,
        colors.secondary,
    );

    drawRightText(
        page,
        'PRICE',
        435,
        y - 10,
        boldFont,
        8,
        colors.secondary,
    );

    drawRightText(
        page,
        'TAX',
        485,
        y - 10,
        boldFont,
        8,
        colors.secondary,
    );

    drawRightText(
        page,
        'AMOUNT',
        PAGE_WIDTH - MARGIN_X - 8,
        y - 10,
        boldFont,
        8,
        colors.secondary,
    );

    return y - rowHeight;
}

function drawInvoiceItem(
    page: PDFPage,
    item: InvoiceItem,
    data: InvoicePdfData,
    ctx: PdfContext,
    y: number,
): { page: PDFPage; y: number } {
    const { doc, regularFont, boldFont, colors } = ctx;
    const itemWidth = 260;
    const itemFontSize = 9;
    const lineHeight = 12;
    const nameLines = wrapText(item.name, regularFont, itemFontSize, itemWidth);
    const linesPerPage = Math.max(
        1,
        Math.floor((PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN - 120) / lineHeight),
    );

    let currentPage = page;
    let currentY = y;
    let lineIndex = 0;

    while (lineIndex < nameLines.length) {
        // Reserve room for the fixed footer and keep every continuation within printable bounds.
        if (currentY < BOTTOM_MARGIN + 80) {
            drawFooter(currentPage, data.business, ctx);
            currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            currentY = drawTableHeader(
                currentPage,
                ctx,
                PAGE_HEIGHT - TOP_MARGIN,
            );
        }

        const availableLines = Math.max(
            1,
            Math.floor((currentY - (BOTTOM_MARGIN + 80)) / lineHeight),
        );
        const chunkCount = Math.min(
            nameLines.length - lineIndex,
            availableLines,
            linesPerPage,
        );
        const chunk = nameLines.slice(lineIndex, lineIndex + chunkCount);
        const rowStartY = currentY;

        chunk.forEach((line, index) => {
            drawText(
                currentPage,
                line,
                MARGIN_X + 8,
                rowStartY - 14 - index * lineHeight,
                regularFont,
                itemFontSize,
                colors.dark,
            );
        });

        // Values belong to the first segment only; continuation pages repeat the item name.
        if (lineIndex === 0) {
            drawRightText(currentPage, String(item.quantity), 365, rowStartY - 14, regularFont, 9, colors.dark);
            drawRightText(
                currentPage,
                formatCurrency(item.unit_price_minor, data.business),
                435,
                rowStartY - 14,
                regularFont,
                9,
                colors.dark,
            );
            drawRightText(currentPage, String(item.tax_rate) + '%', 485, rowStartY - 14, regularFont, 9, colors.secondary);
            drawRightText(
                currentPage,
                formatCurrency(item.total_minor, data.business),
                PAGE_WIDTH - MARGIN_X - 8,
                rowStartY - 14,
                boldFont,
                9,
                colors.dark,
            );
        }

        currentY = rowStartY - Math.max(30, chunk.length * lineHeight + 12);
        drawLine(
            currentPage,
            MARGIN_X,
            currentY,
            PAGE_WIDTH - MARGIN_X,
            currentY,
            colors.border,
            0.6,
        );
        lineIndex += chunkCount;

        if (lineIndex < nameLines.length) {
            drawFooter(currentPage, data.business, ctx);
            currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            currentY = drawTableHeader(
                currentPage,
                ctx,
                PAGE_HEIGHT - TOP_MARGIN,
            );
        }
    }

    return { page: currentPage, y: currentY };
}

function drawTotals(
    page: PDFPage,
    data: InvoicePdfData,
    ctx: PdfContext,
    y: number,
): number {
    const {
        invoice,
        business,
    } = data;

    const {
        regularFont,
        boldFont,
        colors,
    } = ctx;

    const labelX = 350;
    const valueX =
        PAGE_WIDTH - MARGIN_X;

    const rows = [
        [
            'Subtotal',
            formatCurrency(
                invoice.subtotal_minor,
                business,
            ),
        ],
        [
            'Discount',
            formatCurrency(
                invoice.discount_minor,
                business,
            ),
        ],
        [
            'Tax',
            formatCurrency(
                invoice.tax_minor,
                business,
            ),
        ],
    ];

    let currentY = y;

    for (const [label, value] of rows) {
        drawText(
            page,
            label,
            labelX,
            currentY,
            regularFont,
            9,
            colors.secondary,
        );

        drawRightText(
            page,
            value,
            valueX,
            currentY,
            regularFont,
            9,
            colors.dark,
        );

        currentY -= 17;
    }

    drawLine(
        page,
        labelX,
        currentY + 5,
        valueX,
        currentY + 5,
        colors.border,
    );

    currentY -= 8;

    drawText(
        page,
        'Total',
        labelX,
        currentY,
        boldFont,
        12,
        colors.dark,
    );

    drawRightText(
        page,
        formatCurrency(
            invoice.total_minor,
            business,
        ),
        valueX,
        currentY,
        boldFont,
        12,
        colors.primary,
    );

    currentY -= 25;

    const balanceMinor =
        Math.max(
            0,
            invoice.total_minor -
            invoice.paid_minor,
        );

    drawText(
        page,
        'Paid',
        labelX,
        currentY,
        regularFont,
        9,
        colors.secondary,
    );

    drawRightText(
        page,
        formatCurrency(
            invoice.paid_minor,
            business,
        ),
        valueX,
        currentY,
        regularFont,
        9,
        colors.dark,
    );

    currentY -= 17;

    drawText(
        page,
        'Balance',
        labelX,
        currentY,
        boldFont,
        10,
        colors.dark,
    );

    drawRightText(
        page,
        formatCurrency(
            balanceMinor,
            business,
        ),
        valueX,
        currentY,
        boldFont,
        10,
        balanceMinor > 0
            ? colors.primary
            : colors.dark,
    );

    return currentY - 25;
}

function drawNotes(
    page: PDFPage,
    invoice: Invoice,
    business: BusinessSettings,
    ctx: PdfContext,
    y: number,
): { page: PDFPage; y: number } {
    if (!invoice.notes?.trim()) return { page, y };

    const { doc, regularFont, boldFont, colors } = ctx;
    let currentPage = page;
    let currentY = y;
    let continued = false;

    const startNotesPage = () => {
        drawFooter(currentPage, business, ctx);
        currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        currentY = PAGE_HEIGHT - TOP_MARGIN;
        drawSectionTitle(
            currentPage,
            continued ? 'Notes (continued)' : 'Notes',
            MARGIN_X,
            currentY,
            boldFont,
            colors,
        );
        currentY -= 18;
        continued = true;
    };

    // Keep notes clear of the fixed footer, moving the section if totals leave too little room.
    if (currentY < BOTTOM_MARGIN + 80) {
        startNotesPage();
    } else {
        drawSectionTitle(currentPage, 'Notes', MARGIN_X, currentY, boldFont, colors);
        currentY -= 18;
    }

    const lines = wrapText(invoice.notes, regularFont, 9, CONTENT_WIDTH);
    for (const line of lines) {
        if (currentY < BOTTOM_MARGIN + 42) startNotesPage();
        drawText(currentPage, line, MARGIN_X, currentY, regularFont, 9, colors.secondary);
        currentY -= 12;
    }

    return { page: currentPage, y: currentY - 10 };
}

function drawFooter(
    page: PDFPage,
    business: BusinessSettings,
    ctx: PdfContext,
): void {
    const {
        regularFont,
        colors,
    } = ctx;

    const text =
        business.business_name ||
        'Business Manager';

    drawLine(
        page,
        MARGIN_X,
        BOTTOM_MARGIN + 20,
        PAGE_WIDTH - MARGIN_X,
        BOTTOM_MARGIN + 20,
        colors.border,
        0.6,
    );

    drawText(
        page,
        text,
        MARGIN_X,
        BOTTOM_MARGIN + 7,
        regularFont,
        8,
        colors.secondary,
    );

    drawRightText(
        page,
        'Thank you for your business.',
        PAGE_WIDTH - MARGIN_X,
        BOTTOM_MARGIN + 7,
        regularFont,
        8,
        colors.secondary,
    );
}

async function loadInvoiceData(
    invoiceId: number,
): Promise<InvoicePdfData> {
    const invoiceResult =
        await getInvoiceById(invoiceId);

    if (!invoiceResult) {
        throw new Error(
            'Invoice could not be found.',
        );
    }

    const business =
        getBusinessSettings();

    const customer =
        invoiceResult.invoice.customer_id ===
            null
            ? null
            : await getCustomerById(
                invoiceResult.invoice.customer_id,
            );

    return {
        invoice: invoiceResult.invoice,
        items: invoiceResult.items,
        customer,
        business,
    };
}

export async function generateInvoicePdf(
    invoiceId: number,
): Promise<string> {
    if (
        !Number.isInteger(invoiceId) ||
        invoiceId <= 0
    ) {
        throw new Error(
            'Invalid invoice.',
        );
    }

    const data =
        await loadInvoiceData(invoiceId);

    if (data.items.length === 0) {
        throw new Error(
            'Invoice has no items.',
        );
    }

    const doc =
        await PDFDocument.create();
    doc.registerFontkit(fontkit);

    const regularFont = await doc.embedFont(notoSansRegular, {
        subset: false,
    });

    const boldFont = await doc.embedFont(notoSansBold, {
        subset: false,
    });

    const colors: PdfColors = {
        primary: hexToRgb(
            data.business.primary_color,
        ),
        dark: DARK,
        secondary: SECONDARY,
        border: BORDER,
        white: WHITE,
        lightSurface: LIGHT_SURFACE,
    };

    const ctx: PdfContext = {
        doc,
        regularFont,
        boldFont,
        colors,
    };

    let page =
        doc.addPage([
            PAGE_WIDTH,
            PAGE_HEIGHT,
        ]);

    let y =
        PAGE_HEIGHT -
        TOP_MARGIN;

    y = drawBusinessHeader(
        page,
        data,
        ctx,
        y,
    );

    y = drawCustomerAndInvoiceInfo(
        page,
        data,
        ctx,
        y,
    );

    // Long business/customer details can consume the first page before the table starts.
    // Move the complete item table to a fresh page rather than drawing it in the footer area.
    if (y < BOTTOM_MARGIN + 220) {
        drawFooter(page, data.business, ctx);
        page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - TOP_MARGIN;
    }

    y -= 4;

    y = drawTableHeader(
        page,
        ctx,
        y,
    );

    for (const item of data.items) {
        const result = drawInvoiceItem(page, item, data, ctx, y);
        page = result.page;
        y = result.y;
    }

    if (y < BOTTOM_MARGIN + 190) {
        drawFooter(
            page,
            data.business,
            ctx,
        );

        page =
            doc.addPage([
                PAGE_WIDTH,
                PAGE_HEIGHT,
            ]);

        y =
            PAGE_HEIGHT -
            TOP_MARGIN;
    }

    y -= 20;

    y = drawTotals(
        page,
        data,
        ctx,
        y,
    );

    const notesResult = drawNotes(
        page,
        data.invoice,
        data.business,
        ctx,
        y,
    );
    page = notesResult.page;
    y = notesResult.y;

    drawFooter(
        page,
        data.business,
        ctx,
    );

    const pdfBytes =
        await doc.save();

    const base64 =
        uint8ArrayToBase64(
            pdfBytes,
        );

    // Write to app-private storage first, then publish to Downloads through
    // react-native-file-access so Android's scoped-storage rules are respected.
    const fileName = `${data.invoice.invoice_number}.pdf`;
    const filePath = `${Dirs.CacheDir}/${fileName}`;

    await FileSystem.writeFile(
        filePath,
        base64,
        'base64',
    );

    await FileSystem.cpExternal(
        filePath,
        fileName,
        'downloads',
    );

    return filePath;
}