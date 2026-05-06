import { CalendarDays, CalendarPlus, ClipboardClock, LayoutDashboard, Users } from 'lucide-react';
import type { NavItem } from '../types/navigation';
export const EMPLOYEE_NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    name: 'Leave',
    icon: CalendarPlus,
    href: '/leave',
  },
];
export const MANAGER_NAV_ITEMS: NavItem[] = [
  {
    name: 'Manager Dashboard',
    icon: LayoutDashboard,
    href: '/manager-dashboard',
  },
  {
    name: 'All Employees',
    icon: Users,
    href: '/manager/employees',
  },
  {
    name: 'Pending Requests',
    icon: ClipboardClock,
    href: '/manager/requests',
  },
];
export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    name: 'All Employees',
    icon: Users,
    href: '/admin/employees',
  },
  {
    name: 'Holidays',
    icon: CalendarDays,
    href: '/admin/holidays',
  },
];
