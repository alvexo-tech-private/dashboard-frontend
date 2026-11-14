import { AccountStatus } from './account';

export interface SalesAgent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  city: string | null;
  referralCode: string | null;
  totalReferrals: number | null;
  totalBonusEarned: number | null;
  active: boolean;
  accountStatus: AccountStatus;
  createdAt: string;
}
