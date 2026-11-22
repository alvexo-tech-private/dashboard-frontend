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

  it('renders Rider and Sales Agent Management as single links to their directories', () => {
    const groups = visibleNavGroups(NAV_GROUPS, AdminRole.OPERATIONS_ADMIN);
    const rider = groups.find((g) => g.label === 'Rider Management')!;
    const agent = groups.find((g) => g.label === 'Sales Agent Management')!;
    expect(rider.flat).toBeTrue();
    expect(rider.children.map((c) => c.path)).toEqual(['riders/directory']);
    expect(agent.flat).toBeTrue();
    expect(agent.children.map((c) => c.path)).toEqual(['sales-agents/directory']);
  });
});
