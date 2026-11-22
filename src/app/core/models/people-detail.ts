import { AccountStatus } from './account';

/** Booking statuses as stored by the booking API. */
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export interface BookingCounts {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export interface RiderVehicle {
  id: number;
  make: string | null;
  model: string | null;
  year: number | null;
  vehicleType: string | null;
  registrationNumber: string | null;
  primary: boolean;
  addedAt: string | null;
}

export interface RiderWorkshop {
  mechanicId: number;
  workshopName: string | null;
  bookings: number;
  lastBookingAt: string | null;
}

/** ADMIN-US-08 BR-07 Rider Details. */
export interface RiderDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  emailVerified: boolean | null;
  mobileVerified: boolean | null;
  addressLine1: string | null;
  addressLine2: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  registeredAt: string;
  accountStatus: AccountStatus;
  deletedAt: string | null;
  bookings: BookingCounts;
  vehicles: RiderVehicle[];
  workshops: RiderWorkshop[];
}

/** ADMIN-US-10 sales agent details with referral totals. */
export interface SalesAgentDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  city: string | null;
  state: string | null;
  referralCode: string | null;
  registeredAt: string;
  accountStatus: AccountStatus;
  deletedAt: string | null;
  referredWorkshops: number;
  activeReferredWorkshops: number;
  referredOthers: number;
  bonusPaid: number;
  bonusPending: number;
}

export interface BookingRow {
  id: number;
  bookingNumber: string | null;
  riderId: number | null;
  riderName: string | null;
  mechanicId: number | null;
  workshopName: string | null;
  vehicle: string | null;
  serviceType: string | null;
  status: BookingStatus;
  scheduledAt: string | null;
  bookedAt: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

export interface ReviewRow {
  id: number;
  bookingNumber: string | null;
  riderId: number | null;
  riderName: string | null;
  mechanicId: number | null;
  workshopName: string | null;
  rating: number | null;
  comment: string | null;
  workshopResponse: string | null;
  createdAt: string;
}

export interface ReferralRow {
  id: number;
  referredUserId: number | null;
  referredName: string | null;
  workshopName: string | null;
  referredRole: 'MECHANIC' | 'VEHICLE_USER' | 'SALES_REPRESENTATIVE' | 'ADMINISTRATOR' | null;
  referredAccountStatus: AccountStatus | null;
  status: string | null;
  bonusAmount: number | null;
  bonusPaid: boolean;
  referredAt: string;
}
