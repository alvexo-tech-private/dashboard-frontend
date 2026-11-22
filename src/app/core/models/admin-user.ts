import { AdminRole } from './admin-role';
import { AccountHistoryEntry } from './account';

export type AdminUserStatus = 'ACTIVE' | 'DISABLED';

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: AdminRole;
  status: AdminUserStatus;
  /** True until the admin replaces the temporary password they were given. */
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Returned once on create / reset; the password can't be fetched again. */
export interface TemporaryPassword {
  adminUser: AdminUser;
  temporaryPassword: string;
}

export interface AdminUserQuery {
  page: number;
  size: number;
  search: string;
  role: AdminRole | null;
  status: AdminUserStatus | null;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export type AdminUserAction =
  | 'ADMIN_CREATED'
  | 'ADMIN_ROLE_CHANGED'
  | 'ADMIN_DISABLED'
  | 'ADMIN_ENABLED'
  | 'ADMIN_PASSWORD_RESET'
  | 'PASSWORD_CHANGED';

/** Same shape as an account history entry; previous/new hold a role or a status depending on the action. */
export type AdminUserHistoryEntry = Omit<AccountHistoryEntry, 'action' | 'previousStatus' | 'newStatus'> & {
  action: AdminUserAction;
  previousStatus: string | null;
  newStatus: string | null;
};
