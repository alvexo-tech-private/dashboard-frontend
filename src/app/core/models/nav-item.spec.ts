import { NAV_GROUPS } from '../nav-items';
import { AdminRole } from './admin-role';
import { visibleNavGroups } from './nav-item';

function reportPaths(role: AdminRole): string[] {
  return visibleNavGroups(NAV_GROUPS, role)
    .filter((g) => g.label === 'Reports')
    .flatMap((g) => g.children.map((c) => c.path));
}

describe('visibleNavGroups', () => {
  it('shows Operations Reports to every role but Finance Reports only to finance roles', () => {
    expect(reportPaths(AdminRole.OPERATIONS_ADMIN)).toEqual(['reports/operations']);
    expect(reportPaths(AdminRole.FINANCE_ADMIN)).toEqual(['reports/operations', 'reports/finance']);
    expect(reportPaths(AdminRole.SUPER_ADMIN)).toEqual(['reports/operations', 'reports/finance']);
  });

  it('still hides whole groups a role is not allowed in', () => {
    const labels = visibleNavGroups(NAV_GROUPS, AdminRole.OPERATIONS_ADMIN).map((g) => g.label);
    expect(labels).not.toContain('Finance');
    expect(labels).not.toContain('Platform Settings');
  });
});
