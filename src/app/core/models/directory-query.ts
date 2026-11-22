import { AccountStatusFilter } from './account';

export interface DirectoryQuery {
  page: number;
  size: number;
  search: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  /** Account status filter; omitted means all accounts. */
  status?: AccountStatusFilter;
}
