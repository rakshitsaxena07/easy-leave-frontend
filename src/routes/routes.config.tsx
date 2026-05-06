import type { Role } from '@/types/auth';
import Dashboard from '@/pages/Dashboard';
import ManagerDashboard from '@/pages/ManagerDashboard';
import AllEmployeesDetails from '@/pages/AllEmployeesDetails';
import AllEmployeesLeaveBalance from '@/pages/AllEmployeesLeaveBalance';
import SingleEmployeeLeaveDetails from '@/pages/SingleEmployeeLeaveDetails';
import LeaveDetails from '@/pages/LeaveDetails';
import Holidays from '@/pages/Holidays';
import LeaveAndRequest from '@/pages/LeaveAndRequest';
import PendingRequests from '@/pages/PendingRequests';

export type AppRoute = {
  path: string;
  element: React.ReactNode;
  roles?: Role[];
};

export const APP_ROUTES: AppRoute[] = [
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/leave',
    element: <LeaveAndRequest />,
  },
  {
    path: '/leave/:id',
    element: <LeaveDetails />,
  },
  {
    path: '/manager-dashboard',
    element: <ManagerDashboard />,
    roles: ['MANAGER'],
  },
  {
    path: '/admin/employees',
    element: <AllEmployeesDetails />,
    roles: ['ADMIN'],
  },
  {
    path: '/manager/employees',
    element: <AllEmployeesLeaveBalance />,
    roles: ['MANAGER'],
  },
  {
    path: '/manager/employees/:id',
    element: <SingleEmployeeLeaveDetails />,
    roles: ['MANAGER'],
  },
  {
    path: '/manager/requests',
    element: <PendingRequests />,
    roles: ['MANAGER'],
  },
  {
    path: '/admin/holidays',
    element: <Holidays />,
    roles: ['ADMIN'],
  },
];
