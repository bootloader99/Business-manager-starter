export type DiscountableItem = {
  quantity: number;
  unit_price_minor: number;
  tax_rate: number;
  discount_minor?: number;
};

export type TransactionTotals = {
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  lineSubtotals: number[];
  lineTotals: number[];
};

export type DiscountFieldValidation = {
  discountMinor: number;
  error?: string;
};

/**
 * Validates the fixed-amount discount field while the user types.
 * Empty input and an unfinished decimal point are treated as intermediate
 * states; submit handlers still use the same error result before saving.
 */
export function validateDiscountField(
  value: string,
  subtotalMinor: number,
  isSubmitting = false,
): DiscountFieldValidation {
  const trimmed = value.trim();

  if (!trimmed) {
    return { discountMinor: 0 };
  }

  if (trimmed.startsWith('-')) {
    return {
      discountMinor: 0,
      error: 'Discount cannot be negative.',
    };
  }

  const plainAmount = /^\d*(?:\.\d*)?$/.test(trimmed);
  const groupedAmount = /^\d{1,3}(?:,\d{3})+(?:\.\d*)?$/.test(trimmed);
  const partialGroupedAmount = /^\d{1,3}(?:,\d{3})*,\d{0,2}$/.test(trimmed);
  if (!plainAmount && !groupedAmount && !partialGroupedAmount) {
    return {
      discountMinor: 0,
      error: 'Enter a valid discount amount.',
    };
  }

  if (trimmed === '.' || trimmed === ',' || partialGroupedAmount) {
    return isSubmitting
      ? {
          discountMinor: 0,
          error: 'Enter a valid discount amount.',
        }
      : { discountMinor: 0 };
  }

  const parsed = Number(trimmed.replace(/,/g, ''));
  if (!Number.isFinite(parsed)) {
    return {
      discountMinor: 0,
      error: 'Enter a valid discount amount.',
    };
  }

  const discountMinor = Math.round(parsed * 100);
  if (discountMinor > subtotalMinor) {
    return {
      discountMinor,
      error: 'Discount cannot exceed the subtotal.',
    };
  }

  return { discountMinor };
}

/**
 * The app stores prices in minor currency units and uses tax-exclusive
 * unit prices. Line discounts and document discounts are deducted before
 * tax. A document-level discount is allocated proportionally across the
 * positive line bases so the sum of allocations equals the entered discount.
 */
export function calculateTransactionTotals(
  items: DiscountableItem[],
  rawDiscountMinor: number,
): TransactionTotals {
  if (
    !Number.isFinite(rawDiscountMinor) ||
    rawDiscountMinor < 0
  ) {
    throw new Error('Discount must be zero or greater.');
  }

  const discountMinor = Math.round(rawDiscountMinor);
  const lineSubtotals = items.map(item => {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error('Item quantity must be greater than zero.');
    }

    if (
      !Number.isFinite(item.unit_price_minor) ||
      item.unit_price_minor < 0
    ) {
      throw new Error('Item price is invalid.');
    }

    if (
      !Number.isFinite(item.tax_rate) ||
      item.tax_rate < 0 ||
      item.tax_rate > 100
    ) {
      throw new Error('Item tax rate is invalid.');
    }

    const itemDiscountMinor = item.discount_minor ?? 0;
    if (
      !Number.isFinite(itemDiscountMinor) ||
      itemDiscountMinor < 0
    ) {
      throw new Error('Item discount must be zero or greater.');
    }

    const lineSubtotal =
      Math.round(item.quantity * Math.round(item.unit_price_minor)) -
      Math.round(itemDiscountMinor);

    if (lineSubtotal < 0) {
      throw new Error('Item discount cannot exceed the item value.');
    }

    return lineSubtotal;
  });

  const subtotalMinor = lineSubtotals.reduce(
    (sum, lineSubtotal) => sum + lineSubtotal,
    0,
  );

  if (discountMinor > subtotalMinor) {
    throw new Error('Discount cannot exceed the subtotal.');
  }

  const allocations = lineSubtotals.map(() => 0);
  const positiveLineIndexes = lineSubtotals
    .map((lineSubtotal, index) => ({ lineSubtotal, index }))
    .filter(item => item.lineSubtotal > 0);
  let remainingDiscount = discountMinor;

  positiveLineIndexes.forEach(({ lineSubtotal, index }) => {
    const allocation = Math.min(
      lineSubtotal,
      Math.floor((discountMinor * lineSubtotal) / subtotalMinor),
    );
    allocations[index] = allocation;
    remainingDiscount -= allocation;
  });

  // Distribute rounding remainder one minor unit at a time without allowing
  // any line's allocation to exceed its eligible taxable base.
  for (const { lineSubtotal, index } of positiveLineIndexes) {
    if (remainingDiscount <= 0) break;
    if (allocations[index] < lineSubtotal) {
      allocations[index] += 1;
      remainingDiscount -= 1;
    }
  }

  const taxMinor = items.reduce((sum, item, index) => {
    const taxableLine = lineSubtotals[index] - allocations[index];
    return sum + Math.round(taxableLine * (item.tax_rate / 100));
  }, 0);

  const lineTotals = items.map((item, index) =>
    lineSubtotals[index] +
    Math.round(lineSubtotals[index] * (item.tax_rate / 100)),
  );

  return {
    subtotalMinor,
    discountMinor,
    taxMinor,
    totalMinor: subtotalMinor - discountMinor + taxMinor,
    lineSubtotals,
    lineTotals,
  };
}
