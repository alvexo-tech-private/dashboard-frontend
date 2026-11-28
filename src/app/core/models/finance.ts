/**
 * Finance module (ADMIN-EPIC-06) — mirrors dashboard-backend's FinanceDtos. All amounts are read-only (₹).
 * Settlement status labels (US-11 BR-18): PENDING, PROCESSING, COMPLETED, FAILED, EXCEPTION.
 */
export type SettlementStatusLabel = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXCEPTION';

export interface CollectionSummary {
  advanceTotal: number;
  platformFeeTotal: number;
  grossTotal: number;
  transactionCount: number;
}

export interface RefundSummary {
  amount: number;
  count: number;
}

export interface BatchCounts {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  exception: number;
}

export interface SettlementBatchRow {
  batchReference: string;
  workshopId: number;
  workshopCode: string;
  workshopName: string | null;
  area: string | null;
  settlementDate: string;
  bookingCount: number;
  grossAdvance: number;
  platformCharges: number;
  adjustments: number;
  netSettlement: number;
  status: SettlementStatusLabel;
  gatewayReference: string | null;
  completedAt: string | null;
}

export interface FinanceDashboard {
  date: string;
  collection: CollectionSummary;
  refunds: RefundSummary;
  batches: BatchCounts;
  workshopSettlements: SettlementBatchRow[];
}

export interface BatchBooking {
  bookingId: number;
  bookingNumber: string | null;
  riderName: string | null;
  vehicleNumber: string | null;
  serviceDate: string | null;
  advance: number;
  charges: number;
  netContribution: number;
  settlementStatus: string;
  paymentStatus: string | null;
  orderId: string | null;
  cashfreePaymentId: string | null;
  payoutReference: string | null;
}

export interface HistoryEntry {
  at: string;
  action: string;
  detail: string;
  by: string;
}

export interface SettlementBatchDetail {
  batch: SettlementBatchRow;
  note: string | null;
  failureReason: string | null;
  exception: boolean;
  bookings: BatchBooking[];
  history: HistoryEntry[];
}

export interface FinanceParty {
  id: number;
  code: string | null;
  name: string | null;
  phone: string | null;
  area: string | null;
}

export interface PaymentDetail {
  orderId: string;
  cashfreePaymentId: string | null;
  paymentDate: string | null;
  method: string | null;
  advance: number;
  platformFee: number;
  gross: number;
  status: string;
}

export interface Charges {
  handlingFee: number | null;
  tcs: number | null;
  workshopShare: number | null;
  bykCommission: number;
  gatewayCharges: number | null;
}

export interface RefundDetail {
  reason: string;
  status: 'PROCESSING' | 'REFUNDED' | 'FAILED';
  amount: number;
  initiatedAt: string | null;
  completedAt: string | null;
  cashfreeRefundId: string | null;
  lastError: string | null;
}

export interface BookingSettlement {
  status: string;
  batchReference: string | null;
  batchStatus: SettlementStatusLabel | null;
  settlementDate: string | null;
  amount: number;
  payoutReference: string | null;
  gatewayReference: string | null;
  expectedDate: string | null;
  holdReason: string | null;
}

export interface BookingFinance {
  bookingId: number;
  bookingNumber: string | null;
  bookingStatus: string;
  serviceDate: string | null;
  rider: FinanceParty;
  workshop: FinanceParty;
  payment: PaymentDetail | null;
  charges: Charges | null;
  refunds: RefundDetail[];
  settlement: BookingSettlement | null;
  exception: string | null;
}

export interface OfflineClosureRequest {
  utr: string;
  comment: string;
  paymentMode?: string;
}

// ── Finance Dashboard (BYK Finance Portal mock-up) ──

export interface OverviewCard {
  amount: number;
  count: number;
  previousAmount: number;
  /** % change vs the previous period of the same length; null when there was nothing before. */
  changePercent: number | null;
  /** Daily amounts across the period, for the sparkline. */
  trend: number[];
}

export type TransactionStatus = 'PAID' | 'TO_BE_PAID' | 'REFUNDED' | 'REFUND_PROCESSING' | 'CANCELLED' | 'NO_PAYMENT';

export interface TransactionRow {
  bookingId: number;
  bookingNumber: string | null;
  customerName: string | null;
  workshopId: number;
  workshopName: string | null;
  paymentDate: string;
  amount: number;
  status: TransactionStatus;
  detailedStatus: string;
  orderId: string | null;
  cashfreePaymentId: string | null;
  /** Cashfree refund id, once a refund was sent / completed. */
  cashfreeRefundId: string | null;
}

export interface TransactionPage {
  rows: TransactionRow[];
  page: number;
  size: number;
  total: number;
}

export interface FinanceOverview {
  from: string;
  to: string;
  customerPayments: OverviewCard;
  workshopPayable: OverviewCard;
  settled: OverviewCard;
  refunds: OverviewCard;
  recentTransactions: TransactionRow[];
  lastUpdated: string;
}
