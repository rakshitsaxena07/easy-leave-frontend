import { MemoryRouter } from 'react-router-dom';
import ManagerDashboard from './ManagerDashboard';
import { render, screen, waitFor } from '@testing-library/react';
import type { LeaveResponse } from '@/types/leaves';
import * as leaveApi from '../api/leave.api';
import * as dashboardApi from '../api/dashboard.api';
import type { ManagerDashboardMetrics } from '@/types/dashboard';
import userEvent from '@testing-library/user-event';

const renderManagerDashboard = () => {
  return render(
    <MemoryRouter>
      <ManagerDashboard />
    </MemoryRouter>,
  );
};

const mockLeaves: LeaveResponse[] = [
  {
    id: '1',
    type: 'Annual Leave',
    duration: 'FULL_DAY',
    date: '2026-10-01',
    applyOn: '2026-09-01',
    employeeName: 'Priyansh Saxena',
    startTime: '09:00',
    reason: 'Vacation',
    holidayId: null,
  },
];

const mockPageResponse = {
  content: mockLeaves,
  first: true,
  last: true,
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
};

const mockEmployeesMetrics: ManagerDashboardMetrics = {
  totalEmployees: 20,
  totalEmployeesOnLeaveToday: 5,
  totalEmployeesOnLeaveTomorrow: 3,
};

describe('ManagerDashboard', () => {
  beforeEach(() => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(mockPageResponse);
    vi.spyOn(dashboardApi, 'getManagerDashboardMetrics').mockResolvedValue(mockEmployeesMetrics);
  });

  test('renders page header', () => {
    renderManagerDashboard();
    expect(screen.getByText('Manager Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Team leave overview at a glance')).toBeInTheDocument();
  });

  test('renders Currently on Leave and Upcoming Leaves sections', () => {
    renderManagerDashboard();
    expect(screen.getByText('Currently on Leave')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Leaves')).toBeInTheDocument();
  });

  test('shows Loading inside Show More button when clicked', async () => {
    vi.spyOn(leaveApi, 'fetchLeaves')
      .mockResolvedValueOnce({
        content: mockLeaves,
        first: true,
        last: false,
        totalPages: 2,
        totalElements: 2,
        size: 1,
        number: 0,
      })
      .mockResolvedValueOnce({
        content: mockLeaves,
        first: true,
        last: false,
        totalPages: 2,
        totalElements: 2,
        size: 1,
        number: 0,
      })
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockImplementation(() => new Promise(() => {}));

    renderManagerDashboard();

    const buttons = await screen.findAllByRole('button', {
      name: /show more/i,
    });

    await userEvent.click(buttons[0]);
    await userEvent.click(buttons[1]);

    expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0);
  });

  test('calls fetchLeaves with upcoming status and organization scope', async () => {
    const spy = vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(mockPageResponse);
    renderManagerDashboard();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'upcoming',
          scope: 'organization',
        }),
      );
    });
  });

  test('calls fetchLeaves with ongoing status and organization scope', async () => {
    const spy = vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(mockPageResponse);
    renderManagerDashboard();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ongoing',
          scope: 'organization',
        }),
      );
    });
  });

  test('show error message when fetchLeaves fails', async () => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockRejectedValue(new Error('Failed to fetch leaves'));
    renderManagerDashboard();
    await waitFor(() => {
      expect(screen.getAllByText('Failed to fetch leaves')[0]).toBeInTheDocument();
    });
  });

  test('render employee metrics title in each card', async () => {
    renderManagerDashboard();
    await waitFor(() => {
      expect(screen.getByText('Total Employees')).toBeInTheDocument();
      expect(screen.getByText('On Leave Today')).toBeInTheDocument();
      expect(screen.getByText('On Leave Tomorrow')).toBeInTheDocument();
    });
  });

  test('render employee metrics data in each card', async () => {
    renderManagerDashboard();
    await waitFor(() => {
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  test('displays error message when API rejects with Error object', async () => {
    vi.spyOn(dashboardApi, 'getManagerDashboardMetrics').mockRejectedValue(
      new Error('Failed to fetch data'),
    );
    renderManagerDashboard();
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
    });
  });

  test('displays error message on network error', async () => {
    vi.spyOn(dashboardApi, 'getManagerDashboardMetrics').mockRejectedValue(
      'Failed to fetch dashboard metrics',
    );
    renderManagerDashboard();
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch dashboard metrics')).toBeInTheDocument();
    });
  });
});
