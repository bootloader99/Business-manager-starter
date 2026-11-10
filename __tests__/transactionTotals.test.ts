import {
  calculateTransactionTotals,
  validateDiscountField,
} from '../src/utils/transactionTotals';

describe('shared fixed-amount discount validation', () => {
  it('allows empty, zero, below-maximum, and exact-maximum discounts', () => {
    expect(validateDiscountField('', 50000)).toEqual({ discountMinor: 0 });
    expect(validateDiscountField('0', 50000)).toEqual({ discountMinor: 0 });
    expect(validateDiscountField('499.99', 50000)).toEqual({ discountMinor: 49999 });
    expect(validateDiscountField('500', 50000)).toEqual({ discountMinor: 50000 });
  });

  it('rejects negative, malformed, and excessive discounts immediately', () => {
    expect(validateDiscountField('-1', 50000).error).toBe('Discount cannot be negative.');
    expect(validateDiscountField('abc', 50000).error).toBe('Enter a valid discount amount.');
    expect(validateDiscountField('500.01', 50000).error).toBe('Discount cannot exceed the subtotal.');
  });

  it('does not flag an unfinished decimal while typing but rejects it on submit', () => {
    expect(validateDiscountField('.', 50000).error).toBeUndefined();
    expect(validateDiscountField('.', 50000, true).error).toBe('Enter a valid discount amount.');
  });

  it('preserves support for grouped currency input', () => {
    expect(validateDiscountField('1,000.00', 150000)).toEqual({ discountMinor: 100000 });
    expect(validateDiscountField('1,00', 150000).error).toBeUndefined();
    expect(validateDiscountField('1,00', 150000, true).error).toBe('Enter a valid discount amount.');
  });
});

describe('shared discounted tax calculation', () => {
  it('removes tax when a taxable item is fully discounted before tax', () => {
    const totals = calculateTransactionTotals(
      [{ quantity: 1, unit_price_minor: 50000, tax_rate: 18 }],
      50000,
    );

    expect(totals).toMatchObject({
      subtotalMinor: 50000,
      discountMinor: 50000,
      taxMinor: 0,
      totalMinor: 0,
    });
  });

  it('calculates tax on the remaining taxable base after a partial discount', () => {
    const totals = calculateTransactionTotals(
      [{ quantity: 1, unit_price_minor: 50000, tax_rate: 18 }],
      10000,
    );

    expect(totals).toMatchObject({
      subtotalMinor: 50000,
      discountMinor: 10000,
      taxMinor: 7200,
      totalMinor: 47200,
    });
  });

  it('allocates a multi-item discount without making any line taxable base negative', () => {
    const totals = calculateTransactionTotals(
      [
        { quantity: 1, unit_price_minor: 100, tax_rate: 18 },
        { quantity: 1, unit_price_minor: 200, tax_rate: 5 },
        { quantity: 1, unit_price_minor: 0, tax_rate: 18 },
      ],
      300,
    );

    expect(totals).toMatchObject({
      subtotalMinor: 300,
      discountMinor: 300,
      taxMinor: 0,
      totalMinor: 0,
    });
  });

  it('rejects negative or excessive discounts at repository-calculation level', () => {
    const item = [{ quantity: 1, unit_price_minor: 50000, tax_rate: 18 }];

    expect(() => calculateTransactionTotals(item, -1)).toThrow(
      'Discount must be zero or greater.',
    );
    expect(() => calculateTransactionTotals(item, 50001)).toThrow(
      'Discount cannot exceed the subtotal.',
    );
  });

  it('rejects a line discount above the pre-tax line value', () => {
    expect(() =>
      calculateTransactionTotals(
        [{ quantity: 1, unit_price_minor: 50000, tax_rate: 18, discount_minor: 50001 }],
        0,
      ),
    ).toThrow('Item discount cannot exceed the item value.');
  });

  it('keeps tax-free items tax-free after a partial document discount', () => {
    const totals = calculateTransactionTotals(
      [{ quantity: 1, unit_price_minor: 50000, tax_rate: 0 }],
      10000,
    );

    expect(totals).toMatchObject({
      subtotalMinor: 50000,
      discountMinor: 10000,
      taxMinor: 0,
      totalMinor: 40000,
    });
  });
});
