import { AdminRole } from './admin-role';

export interface NavChild {
  label: string;
  path: string;
  description: string;
  /** Narrows the group's roles for this one page; omitted = same roles as the group. */
  roles?: AdminRole[];
}

export interface NavGroup {
  label: string;
  icon: string;
  roles: AdminRole[];
  children: NavChild[];
}

/** Roles allowed on a child page: its own list if it has one, else its group's. */
export function childRoles(group: NavGroup, child: NavChild): AdminRole[] {
  return child.roles ?? group.roles;
}

/** The groups and children a role may see; groups left with no visible child are dropped. */
export function visibleNavGroups(groups: NavGroup[], role: AdminRole): NavGroup[] {
  return groups
    .filter((g) => g.roles.includes(role))
    .map((g) => ({ ...g, children: g.children.filter((c) => childRoles(g, c).includes(role)) }))
    .filter((g) => g.children.length > 0);
}
