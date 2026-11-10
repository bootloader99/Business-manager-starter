import React, {
  useCallback,

  useState,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  AppButton,
  AppCard,
  ConfirmationModal,
  DetailRow,
  DetailSection,
  LoadingState,
  ScreenContainer,
  StatusBadge,
  SummaryCard,
  useAppToast,
} from '../../components';
import { getCustomerById } from '../../database/repositories/customerRepository';
import { getProducts } from '../../database/repositories/productRepository';
import { isValidStoredDate } from '../../utils/validation';
import {
  getInvoiceById,
  type InvoiceWithItems,
  issueInvoice,
} from '../../database/repositories/invoiceRepository';
import type {
  Customer,
  InvoiceStatus,
  Payment,
} from '../../database/types';

import { usePayments } from '../../hooks/usePayments';
import type { MoreStackParamList } from '../../navigation/types';
import { spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { formatCurrency } from '../../utils';
import { useFocusEffect } from '@react-navigation/native';

import { generateInvoicePdf } from '../../services/pdf/invoicePdfService';
import { fontFamily } from '../../theme/typography';


type Props = NativeStackScreenProps<
  MoreStackParamList,
  'InvoiceDetails'
>;

type InvoiceDetails = InvoiceWithItems;

type PaymentStatus =
  | 'unpaid'
  | 'partial'
  | 'paid';

const statusLabels: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  issued: 'Issued',
  cancelled: 'Cancelled',
};

const statusVariants: Record<
  InvoiceStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  draft: 'warning',
  issued: 'primary',
  cancelled: 'neutral',
};

const paymentStatusLabels: Record<
  PaymentStatus,
  string
> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
};

const paymentStatusVariants: Record<
  PaymentStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  unpaid: 'warning',
  partial: 'primary',
  paid: 'success',
};

export default function InvoiceDetailsScreen({
  route,
  navigation,
}: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const [invoiceData, setInvoiceData] =
    useState<InvoiceDetails | null>(null);

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] =
    useState(false);

  const [showIssueConfirmation, setShowIssueConfirmation] =
    useState(false);

  const [isIssuing, setIsIssuing] = useState(false);

  const { showToast } = useAppToast();

  const invoiceId = Number(
    route.params.invoiceId,
  );

  const {
    payments,
    isLoading: isPaymentsLoading,
    error: paymentsError,
    refreshPayments,
  } = usePayments(invoiceId);

  const loadInvoice = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (
        !Number.isInteger(invoiceId) ||
        invoiceId <= 0
      ) {
        setInvoiceData(null);
        setCustomer(null);
        setError('Invalid invoice.');
        return;
      }

      const result =
        await getInvoiceById(invoiceId);

      if (!result) {
        setInvoiceData(null);
        setCustomer(null);
        setError(
          'Invoice could not be found.',
        );
        return;
      }

      setInvoiceData(result);

      if (result.invoice.customer_id !== null) {
        const customerResult =
          await getCustomerById(
            result.invoice.customer_id,
          );

        setCustomer(customerResult ?? null);
      } else {
        setCustomer(null);
      }
    } catch (err) {
      console.error(
        'Failed to load invoice:',
        err,
      );

      setInvoiceData(null);
      setCustomer(null);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load invoice.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  const handleIssueInvoice = useCallback(() => {
    if (!invoiceData || isLoading || isIssuing) {
      return;
    }

    setShowIssueConfirmation(true);
  }, [invoiceData, isLoading, isIssuing]);

  const handleConfirmIssueInvoice = useCallback(async () => {
    if (!invoiceData || isLoading || isIssuing) {
      return;
    }

    try {
      setIsIssuing(true);
      setError(null);

      if (!isValidStoredDate(invoiceData.invoice.issue_date)) {
        setShowIssueConfirmation(false);
        showToast({ message: 'Enter a valid invoice date before issuing this invoice.', type: 'error', duration: 4000 });
        return;
      }

      const products = await getProducts();
      for (const item of invoiceData.items) {
        if (item.product_id === null) continue;
        const product = products.find(candidate => candidate.id === item.product_id);
        if (!product || product.type !== 'product' || product.track_stock !== 1) continue;
        if (product.stock_quantity < item.quantity) {
          setShowIssueConfirmation(false);
          showToast({ message: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}; required: ${item.quantity}.`, type: 'error', duration: 4000 });
          return;
        }
      }

      await issueInvoice(invoiceData.invoice.id);
      setShowIssueConfirmation(false);

      await loadInvoice();
      await refreshPayments();

      showToast({
        message: 'The invoice has been issued successfully.',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to issue invoice:', err);
      setShowIssueConfirmation(false);

      showToast({
        message:
          err instanceof Error
            ? err.message
            : 'Something went wrong while issuing the invoice.',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsIssuing(false);
    }
  }, [invoiceData, isLoading, isIssuing, loadInvoice, refreshPayments, showToast]);

  const handleGeneratePdf = useCallback(async () => {
    if (!invoiceData || isGeneratingPdf) {
      return;
    }

    try {
      setIsGeneratingPdf(true);

      // Generate the PDF from the saved invoice.
      await generateInvoicePdf(
        invoiceData.invoice.id,
      );

      showToast({
        message: 'Invoice PDF saved to Downloads.',
        type: 'success',
      });
    } catch (err) {
      console.error(
        'Failed to generate invoice PDF:',
        err,
      );

      showToast({
        message:
          err instanceof Error
            ? err.message
            : 'Something went wrong while generating the invoice PDF.',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [
    invoiceData,
    isGeneratingPdf,
    showToast,
  ]);









  useFocusEffect(
    useCallback(() => {
      loadInvoice();
      refreshPayments();
    }, [loadInvoice, refreshPayments]),
  );

  if (isLoading) {
    return <LoadingState fullscreen />;
  }

  if (!invoiceData) {
    return (
      <ScreenContainer
        title="Invoice"
        scroll={false}>
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>
            Unable to load invoice
          </Text>

          <Text style={styles.errorMessage}>
            {error ?? 'Invoice not found.'}
          </Text>

          <AppButton
            title="Try Again"
            onPress={loadInvoice}
            style={styles.retryButton}
          />

          <AppButton
            title="Back"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.retryButton}
          />
        </View>
      </ScreenContainer>
    );
  }

  const invoice = invoiceData.invoice;
  const status = invoice.status;

  const balanceDue = Math.max(
    invoice.total_minor - invoice.paid_minor,
    0,
  );

  console.log(invoice.status)
console.log('Invoice balance debug:', {
  invoiceId: invoice.id,
  status: invoice.status,
  totalMinor: invoice.total_minor,
  paidMinor: invoice.paid_minor,
  calculatedBalance: balanceDue,
});

  const paymentStatus =
    getPaymentStatus(
      invoice.paid_minor,
      invoice.total_minor,
      invoice.status,
    );

  const summaryRows = [
    {
      label: 'Subtotal',
      value: formatCurrency(
        invoice.subtotal_minor,
      ),
    },
    {
      label: 'Tax',
      value: formatCurrency(
        invoice.tax_minor,
      ),
    },
    {
      label: 'Discount',
      value: `-${formatCurrency(
        invoice.discount_minor,
      )}`,
    },
    {
      label: 'Total',
      value: formatCurrency(
        invoice.total_minor,
      ),
      emphasized: true,
    },
    {
      label: 'Paid',
      value: formatCurrency(
        invoice.paid_minor,
      ),
    },
    {
      label: 'Balance due',
      value: formatCurrency(balanceDue),
      emphasized: true,
    },
  ];

  return (
    <ScreenContainer
      title={invoice.invoice_number}
    >
      <AppCard style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.invoiceNumber}>
              {invoice.invoice_number}
            </Text>

            <Text style={styles.date}>
              {formatDate(invoice.issue_date)}
            </Text>
          </View>

          <StatusBadge
            label={
              statusLabels[status] ??
              capitalize(status)
            }
            variant={
              statusVariants[status] ??
              'neutral'
            }
          />
        </View>
      </AppCard>

      <DetailSection title="Customer">
        {customer ? (
          <>
            <DetailRow
              label="Name"
              value={customer.name}
            />

            {customer.company_name ? (
              <DetailRow
                label="Company"
                value={customer.company_name}
              />
            ) : null}

            {customer.phone ? (
              <DetailRow
                label="Phone"
                value={customer.phone}
              />
            ) : null}

            {customer.email ? (
              <DetailRow
                label="Email"
                value={customer.email}
              />
            ) : null}

            {customer.address ? (
              <DetailRow
                label="Address"
                value={customer.address}
              />
            ) : null}
          </>
        ) : (
          <DetailRow
            label="Customer"
            value="Walk-in customer"
          />
        )}
      </DetailSection>

      <DetailSection title="Invoice">
        <DetailRow
          label="Invoice number"
          value={invoice.invoice_number}
        />

        <DetailRow
          label="Issue date"
          value={formatDate(invoice.issue_date)}
        />

        {invoice.due_date ? (
          <DetailRow
            label="Due date"
            value={formatDate(invoice.due_date)}
          />
        ) : null}

        <DetailRow
          label="Status"
          value={
            statusLabels[status] ??
            capitalize(status)
          }
        />

      </DetailSection>

      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>Items</Text>

        {invoiceData.items.length === 0 ? (
          <Text style={styles.noItems}>
            No items recorded.
          </Text>
        ) : (
          invoiceData.items.map((item, index) => (
            <View key={item.id ?? index} style={styles.invoiceItemWrapper}>
              <InvoiceItemCard item={item} />
            </View>
          ))
        )}
      </View>
      <View style={styles.summarySection}>
        <SummaryCard rows={summaryRows} />
      </View>

      <DetailSection title="Payments">
        <View style={styles.paymentContent}>
          <View style={styles.paymentStatusRow}>
            <Text style={styles.paymentStatusLabel}>
              Payment status
            </Text>

            <StatusBadge
              label={paymentStatusLabels[paymentStatus]}
              variant={paymentStatusVariants[paymentStatus]}
            />
          </View>

          {isPaymentsLoading ? (
            <View style={styles.paymentLoading}>
              <LoadingState />
            </View>
          ) : paymentsError ? (
            <View style={styles.paymentError}>
              <Text style={styles.paymentErrorText}>
                {paymentsError}
              </Text>

              <AppButton
                title="Try Again"
                variant="secondary"
                onPress={refreshPayments}
              />
            </View>
          ) : payments.length === 0 ? (
            <Text style={styles.noPayments}>
              No payments recorded yet.
            </Text>
          ) : (
            <View style={styles.paymentList}>
              {payments.map(payment => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                />
              ))}
            </View>
          )}

          {status === 'issued' && balanceDue > 0 ? (
            <AppButton
              title="Record Payment"
              onPress={() =>
                navigation.navigate('RecordPayment', {
                  invoiceId: String(invoice.id),
                })
              }
              style={styles.recordPaymentButton}
            />
          ) : null}
        </View>
      </DetailSection>

      {invoice.notes ? (
        <DetailSection title="Notes">
          <Text style={styles.notes}>
            {invoice.notes}
          </Text>
        </DetailSection>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          title="Generate PDF"
          onPress={handleGeneratePdf}
          loading={isGeneratingPdf}
          disabled={isGeneratingPdf}
        />

        {status === 'draft' ? (
          <AppButton
            title="Issue Invoice"
            onPress={handleIssueInvoice}
          />
        ) : null}

        <AppButton
          title="Back"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </View>

      <ConfirmationModal
        visible={showIssueConfirmation}
        title="Issue Invoice"
        message="Once issued, the invoice will be finalized and stock will be deducted for tracked products."
        confirmLabel="Issue Invoice"
        cancelLabel="Cancel"
        loading={isIssuing}
        onConfirm={handleConfirmIssueInvoice}
        onCancel={() => {
          if (!isIssuing) {
            setShowIssueConfirmation(false);
          }
        }}
      />
    </ScreenContainer>
  );
}

type InvoiceItemCardProps = {
  item: InvoiceDetails['items'][number];
};

function InvoiceItemCard({
  item,
}: InvoiceItemCardProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const lineSubtotal =
    Math.round(
      item.quantity *
      item.unit_price_minor,
    ) - item.discount_minor;

  return (
    <AppCard style={styles.itemCard}>
      <View style={styles.itemTop}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>
            {item.name}
          </Text>

          <Text style={styles.itemMeta}>
            {item.quantity} ×{' '}
            {formatCurrency(
              item.unit_price_minor,
            )}
          </Text>

          {item.tax_rate > 0 ? (
            <Text style={styles.itemTax}>
              Tax {item.tax_rate}%
            </Text>
          ) : null}

          {item.discount_minor > 0 ? (
            <Text style={styles.itemDiscount}>
              Discount{' '}
              {formatCurrency(
                item.discount_minor,
              )}
            </Text>
          ) : null}
        </View>

        <Text style={styles.itemTotal}>
          {formatCurrency(
            Math.max(0, lineSubtotal),
          )}
        </Text>
      </View>
    </AppCard>
  );
}

type PaymentCardProps = {
  payment: Payment;
};

function PaymentCard({
  payment,
}: PaymentCardProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  return (
    <AppCard style={styles.paymentCard}>
      <View style={styles.paymentTop}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentMethod}>
            {payment.payment_method}
          </Text>

          <Text style={styles.paymentDate}>
            {formatDate(
              payment.payment_date,
            )}
          </Text>
        </View>

        <Text style={styles.paymentAmount}>
          {formatCurrency(
            payment.amount_minor,
          )}
        </Text>
      </View>

      {payment.reference ? (
        <Text style={styles.paymentMeta}>
          Reference: {payment.reference}
        </Text>
      ) : null}

      {payment.notes ? (
        <Text style={styles.paymentNotes}>
          {payment.notes}
        </Text>
      ) : null}
    </AppCard>
  );
}

function getPaymentStatus(
  paidMinor: number,
  totalMinor: number,
  invoiceStatus: InvoiceStatus,
): PaymentStatus {
  if (totalMinor === 0 && invoiceStatus !== 'issued') {
    return 'unpaid';
  }

  if (paidMinor >= totalMinor) {
    return 'paid';
  }

  if (paidMinor <= 0) {
    return 'unpaid';
  }

  return 'partial';
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  headerCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },

  headerInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
    gap: spacing.xs,
  },

  invoiceNumber: {
    ...typography.title,
    fontSize: 24,
    color: colors.textPrimary,
  },

  date: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  itemCard: {
    padding: spacing.md,
  },

  invoiceItemWrapper: {
    // Spacing between item cards is managed by itemsSection.gap.
  },

  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },

  itemInfo: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },

  itemName: {
    ...typography.body,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },

  itemMeta: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  itemTax: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  itemDiscount: {
    ...typography.caption,
    color: colors.warning,
  },

  itemTotal: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    flexShrink: 0,
    textAlign: 'right',
  },

  noItems: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  paymentContent: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },

  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  paymentStatusLabel: {
    ...typography.body,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },

  paymentList: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },

  paymentCard: {
    padding: spacing.md,
  },

  paymentTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },

  paymentInfo: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },

  paymentMethod: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  paymentDate: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  paymentAmount: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    flexShrink: 0,
    textAlign: 'right',
  },

  paymentMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  paymentNotes: {
    ...typography.secondary,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  noPayments: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  paymentLoading: {
    minHeight: 48,
    justifyContent: 'center',
  },

  itemsSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  itemsTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },

  summarySection: {
    marginTop: spacing.md,
  },
  paymentError: {
    gap: spacing.sm,
  },

  paymentErrorText: {
    ...typography.secondary,
    color: colors.danger,
  },

  recordPaymentButton: {
    marginTop: spacing.md,
  },

  notes: {
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },

  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  errorTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  errorMessage: {
    ...typography.secondary,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  retryButton: {
    marginTop: spacing.md,
    width: '100%',
  },
});

