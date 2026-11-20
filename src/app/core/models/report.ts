import { PagedResponse } from './paged-response';

/** An inclusive date range as ISO dates (yyyy-MM-dd), the way the report endpoints take it. */
export interface ReportRange {
  from: string;
  to: string;
}

export type ExportFormat = 'CSV' | 'XLSX';

export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const SETTLEMENT_STATUSES = [
  'AWAITING_PAYOUT',
  'PROCESSING',
  'PAID',
  'FAILED',
  'ON_HOLD',
  'NO_SETTLEMENT_REQUIRED',
] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

/** "AWAITING_PAYOUT" -> "Awaiting payout" */
export function statusLabel(status: string): string {
  const text = status.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface BookingReportRow {
  id: number;
  bookingNumber: string;
  scheduledDateTime: string;
  status: string;
  serviceType: string | null;
  bookingType: string | null;
  channel: string | null;
  riderId: number | null;
  riderName: string | null;
  workshopId: number | null;
  workshopName: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  advancePaid: number | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

export interface BookingReport {
  total: number;
  statusCounts: StatusCount[];
  rows: PagedResponse<BookingReportRow>;
}

export interface RegistrationReportRow {
  date: string | null;
  riders: number;
  workshops: number;
  salesAgents: number;
  total: number;
}

export interface RegistrationReport {
  totals: RegistrationReportRow;
  days: RegistrationReportRow[];
}

export interface WorkshopPerformanceRow {
  workshopId: number;
  workshopName: string | null;
  city: string | null;
  totalBookings: number;
  completed: number;
  cancelled: number;
  rejected: number;
  completionRate: number;
  completedBookingValue: number;
  averageRating: number | null;
  reviews: number;
}

export interface SettlementWorkshopRow {
  workshopId: number;
  workshopName: string | null;
  bookings: number;
  advanceCollected: number;
  advanceHandlingFee: number;
  netPay: number;
  tcsDeduction: number;
  finalPayout: number;
  paidAmount: number;
  outstandingAmount: number;
  failedOrOnHold: number;
}

export interface SettlementLine {
  settlementId: number;
  settlementDate: string;
  workshopId: number | null;
  workshopName: string | null;
  bookingId: number | null;
  bookingNumber: string | null;
  advanceCollected: number;
  advanceHandlingFee: number;
  netPay: number;
  tcsDeduction: number;
  finalPayout: number;
  status: string;
  expectedSettlementDate: string | null;
  payoutDate: string | null;
  payoutReference: string | null;
  bankReference: string | null;
  gatewayPayoutId: string | null;
  holdReason: string | null;
}

export interface SettlementTotals {
  settlements: number;
  workshops: number;
  advanceCollected: number;
  advanceHandlingFee: number;
  netPay: number;
  tcsDeduction: number;
  finalPayout: number;
}

export interface SettlementStatusTotal {
  status: string;
  count: number;
  finalPayout: number;
}

export interface SettlementReport<T> {
  totals: SettlementTotals;
  byStatus: SettlementStatusTotal[];
  rows: PagedResponse<T>;
}

/** Optional filters shared by the bookings and settlement reports; undefined/null ones are not sent. */
export interface ReportFilters {
  status?: string | null;
  workshopId?: number | null;
}
