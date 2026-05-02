import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import * as leaveApi from '../api/leave.api';
import * as dashboardApi from '@/api/dashboard.api';
import * as holidayApi from '@/api/holiday.api';
import type { LeaveResponse } from '../types/leaves';
import userEvent from '@testing-library/user-event';
import type { HolidayResponse } from '@/types/holiday';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

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

const mockMetrics = {
  totalAnnualLeaves: 20,
  leavesTaken: 5,
  remainingAnnualLeaves: 15,
  pendingRequests: 2,
};

const mockHolidays: HolidayResponse[] = [
  {
    id: '1',
    name: 'Fixed Holiday',
    type: 'FIXED',
    date: '2026-09-01',
  },
  {
    id: '2',
    name: 'Optional Holiday',
    type: 'OPTIONAL',
    date: '2026-10-01',
  },
];

const renderDashboard = () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(mockPageResponse);
    vi.spyOn(dashboardApi, 'getEmployeeDashboardMetrics').mockResolvedValue(mockMetrics);
    vi.spyOn(holidayApi, 'fetchHolidays').mockResolvedValue(mockHolidays);
  });

  test('renders page header', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(
        screen.getByText('Welcome to your dashboard! Here you can find an overview of your Leaves'),
      ).toBeInTheDocument();
    });
  });

  test('renders Upcoming Leaves heading', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Upcoming Leaves')).toBeInTheDocument();
    });
  });

  test('renders Upcoming Holidays heading', async () => {
    renderDashboard();
    expect(await screen.findByText('Holidays')).toBeInTheDocument();
  });

  test('shows upcoming leaves loading state', async () => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockImplementation(() => new Promise(() => {}));
    renderDashboard();
    expect(await screen.findByText('Upcoming Leaves')).toBeInTheDocument();
    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
  });

  test('shows holiday loading state', async () => {
    vi.spyOn(holidayApi, 'fetchHolidays').mockImplementation(() => new Promise(() => {}));
    renderDashboard();
    expect(await screen.findByText('Holidays')).toBeInTheDocument();
    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
  });

  test('renders table columns', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Applied On')).toBeInTheDocument();
    });
  });

  test('renders holiday card when upcoming holidays exist', async () => {
    renderDashboard();

    expect(await screen.findByText('Fixed Holiday')).toBeInTheDocument();
    expect(screen.getByText('FIXED')).toBeInTheDocument();
    expect(await screen.findByText('Optional Holiday')).toBeInTheDocument();
    expect(screen.getByText('OPTIONAL')).toBeInTheDocument();
  });

  test('calls fetchLeaves with upcoming status and self scope', async () => {
    const spy = vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(mockPageResponse);
    renderDashboard();
    await waitFor(() => {
      expect(spy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'upcoming',
          scope: 'self',
        }),
      );
    });
  });

  test('shows error message on API failure', async () => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockRejectedValue(new Error('Failed to fetch leaves'));
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch leaves')).toBeInTheDocument();
    });
  });

  test('navigates to leave detail page when a row is clicked', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Annual Leave')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Annual Leave'));
    expect(mockNavigate).toHaveBeenCalledWith('/leave/1');
  });

  test('Should show metric details', async () => {
    renderDashboard();

    expect(await screen.findByText('Total Annual Leave')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();

    expect(screen.getByText('Annual Leave Taken')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Annual Leave Remaining')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText('Pending Request')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('shows error message when dashboard metrics API fails', async () => {
    vi.spyOn(dashboardApi, 'getEmployeeDashboardMetrics').mockRejectedValue(
      new Error('Failed to fetch dashboard metrics'),
    );
    renderDashboard();
    expect(await screen.findByText('Failed to fetch dashboard metrics')).toBeInTheDocument();
  });

  test('shows fallback error message when dashboard metrics API throws non-error value', async () => {
    vi.spyOn(dashboardApi, 'getEmployeeDashboardMetrics').mockRejectedValue('unknown error');
    renderDashboard();
    expect(await screen.findByText('Failed to fetch dashboard metrics')).toBeInTheDocument();
  });

  test('shows holiday API error message', async () => {
    vi.spyOn(holidayApi, 'fetchHolidays').mockRejectedValue(new Error('Failed to fetch holidays'));
    renderDashboard();
    expect(await screen.findByText('Failed to fetch holidays')).toBeInTheDocument();
  });

  test('shows no upcoming holidays fallback when no holidays exist', async () => {
    vi.spyOn(holidayApi, 'fetchHolidays').mockResolvedValue([]);
    renderDashboard();
    expect(await screen.findByText('No Holiday(s)')).toBeInTheDocument();
  });
});
