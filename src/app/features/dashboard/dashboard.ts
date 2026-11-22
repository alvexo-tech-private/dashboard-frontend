import { Component, computed, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary } from '../../core/models/dashboard-summary';
import { NAV_GROUPS } from '../../core/nav-items';
import { AdminRole } from '../../core/models/admin-role';
import { toIsoDate } from '../../core/utils/report-range';
import { visibleNavGroups } from '../../core/models/nav-item';

interface KpiTile {
  label: string;
  icon: string;
  // Maps this tile to a live count from DashboardSummary. Tiles without a
  // key stay "—" placeholders until their epic exposes real data.
  key?: keyof DashboardSummary;
  // BR-25/26: where selecting the tile goes, with its filter applied. Only
  // rendered as a link for roles allowed on that page.
  link?: { path: string; query: (today: string) => Record<string, string>; roles: AdminRole[] };
  hint?: string;
}

const ALL_ROLES = [AdminRole.SUPER_ADMIN, AdminRole.FINANCE_ADMIN, AdminRole.OPERATIONS_ADMIN];

interface KpiSection {
  title: string;
  tiles: KpiTile[];
}

/**
 * Dashboard KPI layout mirrors ADMIN-US-01 / BR-02..BR-20 in the docx.
 * Finance tiles aren't links yet: BR-18 sends them to the Finance Dashboard
 * (ADMIN-US-11), which isn't built, and the settlement report filters by
 * settlement date rather than the due date these counts use.
 * Rider/Workshop registered+deleted, workshop Pickup&Drop/Advance-Payment
 * adoption, Listed/Platform Trusted counts (from approved WorkshopVerification
 * rows, ADMIN-US-06), and suspended/deleted counts for workshops and sales
 * agents are wired to GET /api/dashboard/summary via `key`; every other tile
 * stays a "—" placeholder until its epic exposes real data — add a `key`
 * there too once DashboardSummaryDto grows the matching field.
 */
const KPI_SECTIONS: KpiSection[] = [
  {
    title: 'Rider Summary',
    tiles: [
      { label: 'Registered Riders', icon: 'group', key: 'registeredRiders' },
      { label: 'Deleted Riders', icon: 'person_off', key: 'deletedRiders' },
    ],
  },
  {
    title: 'Workshop Summary',
    tiles: [
      { label: 'Registered Workshops', icon: 'store', key: 'registeredWorkshops' },
      { label: 'Listed Workshops', icon: 'storefront', key: 'listedWorkshops' },
      { label: 'Platform Trusted Workshops', icon: 'verified', key: 'platformTrustedWorkshops' },
      { label: 'Pickup & Drop Enabled', icon: 'local_shipping', key: 'pickupDropEnabledWorkshops' },
      { label: 'Advance Payment Enabled', icon: 'account_balance_wallet', key: 'advancePaymentEnabledWorkshops' },
      { label: 'Suspended Workshops', icon: 'block', key: 'suspendedWorkshops' },
      { label: 'Deleted Workshops', icon: 'delete', key: 'deletedWorkshops' },
    ],
  },
  {
    title: 'Sales Agent Summary',
    tiles: [
      { label: 'Registered Sales Agents', icon: 'badge', key: 'registeredSalesAgents' },
      { label: 'Suspended Sales Agents', icon: 'block', key: 'suspendedSalesAgents' },
      { label: 'Deleted Sales Agents', icon: 'delete', key: 'deletedSalesAgents' },
    ],
  },
  {
    title: 'Booking Summary',
    tiles: [
      {
        label: "Today's Scheduled Bookings",
        icon: 'event_available',
        key: 'bookingsScheduledToday',
        hint: 'Bookings scheduled for today, not counting cancelled or rejected ones.',
        link: { path: '/reports/operations', query: (d) => ({ tab: 'bookings', from: d, to: d }), roles: ALL_ROLES },
      },
      {
        label: "Today's Cancelled Bookings",
        icon: 'event_busy',
        key: 'bookingsCancelledToday',
        hint: 'Bookings cancelled today, whatever day they were scheduled for.',
      },
    ],
  },
  {
    title: 'Finance Summary',
    tiles: [
      {
        label: 'Workshops — Pending Settlement',
        icon: 'hourglass_empty',
        key: 'workshopsPendingSettlement',
        hint: 'Workshops with an unpaid settlement due today or earlier (awaiting payout, processing, on hold or failed).',
      },
      {
        label: 'Workshops — Completed Settlement',
        icon: 'task_alt',
        key: 'workshopsSettledToday',
        hint: 'Workshops paid out today.',
      },
    ],
  },
  {
    title: 'Support Summary',
    tiles: [
      {
        label: 'Open Support Requests',
        icon: 'report_problem',
        key: 'openSupportRequests',
        hint: 'Help requests raised by workshops in the app that are open or in progress.',
      },
      { label: 'New Feedback', icon: 'rate_review', hint: 'Not available yet: no feedback review data exists.' },
    ],
  },
];

@Component({
  selector: 'app-dashboard',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  readonly kpiSections = KPI_SECTIONS;

  readonly summary = signal<DashboardSummary | null>(null);

  readonly quickNavCards = computed(() => {
    const role = this.auth.currentRole();
    if (!role) return [];
    return visibleNavGroups(NAV_GROUPS, role).map((g) => ({
      label: g.label,
      icon: g.icon,
      path: g.children[0].path,
    }));
  });

  constructor(protected auth: AuthService, private dashboardService: DashboardService) {
    this.dashboardService.getSummary().subscribe({
      next: (summary) => this.summary.set(summary),
      // Leave tiles at their "—" placeholder if the backend isn't reachable.
      error: () => this.summary.set(null),
    });
  }

  /** The tile's link target for the current role, or null when it shouldn't be a link. */
  tileLink(tile: KpiTile): { path: string; query: Record<string, string> } | null {
    const role = this.auth.currentRole();
    if (!tile.link || !role || !tile.link.roles.includes(role)) return null;
    return { path: tile.link.path, query: tile.link.query(toIsoDate(new Date())) };
  }

  tileValue(tile: KpiTile): string {
    const summary = this.summary();
    if (!tile.key || !summary) return '—';
    return summary[tile.key].toLocaleString();
  }
}
