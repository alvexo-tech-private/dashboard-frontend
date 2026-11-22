import { AdminRole } from './admin-role';

export interface AdminUserSummary {
  id: number;
  email: string;
  fullName: string;
  role: AdminRole;
  /** True while the admin is on a temporary password set by a Super Admin. */
  mustChangePassword: boolean;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  adminUser: AdminUserSummary;
}
