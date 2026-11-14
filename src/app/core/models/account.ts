/**
 * Account status of a rider / workshop / sales agent, derived by the backend
 * from the booking API's users.active + users.deleted (see AccountStatus.java).
 */
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

/** Directory filter: one status, or every account. */
export type AccountStatusFilter = AccountStatus | 'ALL';

export type AccountAction = 'suspend' | 'restore' | 'delete';

/** Plain-language name of the kind of account, used in dialogs and messages. */
export type AccountKind = 'rider' | 'workshop' | 'sales agent';

export interface AccountHistoryEntry {
  id: number;
  action: 'ACCOUNT_SUSPENDED' | 'ACCOUNT_RESTORED' | 'ACCOUNT_DELETED';
  previousStatus: AccountStatus;
  newStatus: AccountStatus;
  reason: string | null;
  performedBy: string;
  performedAt: string;
}
