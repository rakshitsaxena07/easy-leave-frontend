import { screen, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import * as employeeLeaveBalance from '@/api/employeesLeaveBalance.api';
import SingleEmployeeLeaveDetails from './SingleEmployeeLeaveDetails';
import * as leaveApi from '@/api/leave.api';
import * as userApi from '@/api/user.api';
import type { LeaveResponse } from '@/types/leaves';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockLeaveRecord = [
  {
    leaveId: '1',
    leaveType: 'Annual Leave',
    totalLeavesAvailable: 24,
    leavesTaken: 6,
    leavesRemaining: 18,
  },
  {
    leaveId: '2',
    leaveType: 'Paternity Leave',
    totalLeavesAvailable: 90,
    leavesTaken: 20,
    leavesRemaining: 70,
  },
];

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

const renderSingleEmployeeLeaveDetails = () => {
  return render(
    <MemoryRouter initialEntries={['/employee/1']}>
      <Routes>
        <Route path="/employee/:id" element={<SingleEmployeeLeaveDetails />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('SingleEmployeeLeaveDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(employeeLeaveBalance, 'fetchSingleEmployeeLeaveRecord').mockResolvedValue(
      mockLeaveRecord,
    );
    vi.spyOn(employeeLeaveBalance, 'fetchYears').mockResolvedValue(['2025', '2026']);
    vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(mockPageResponse);
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.spyOn(userApi, 'fetchUserDetails').mockResolvedValue({
      name: 'Priyansh Saxena',
      email: 'test@gmail.com',
    });
  });

  test('shows loading state initially', () => {
    renderSingleEmployeeLeaveDetails();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders leave records table with record', async () => {
    renderSingleEmployeeLeaveDetails();

    await waitFor(() => {
      expect(screen.getAllByRole('cell', { name: 'Annual Leave' })).toHaveLength(2);
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
    });
  });

  test('shows error message when error is Error instance - fetchLeavesRecord', async () => {
    vi.spyOn(employeeLeaveBalance, 'fetchSingleEmployeeLeaveRecord').mockRejectedValue(
      new Error('Error fetching leave record'),
    );

    renderSingleEmployeeLeaveDetails();

    await waitFor(() => {
      expect(screen.getByText('Error fetching leave record')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('shows error message when error is not type of Error instance', async () => {
    vi.spyOn(employeeLeaveBalance, 'fetchSingleEmployeeLeaveRecord').mockRejectedValue(
      'Failed to fetch leave record',
    );

    renderSingleEmployeeLeaveDetails();

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch leave record')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('sets current year when fetchYears returns empty array', async () => {
    const currentYear = new Date().getFullYear().toString();

    vi.spyOn(employeeLeaveBalance, 'fetchYears').mockResolvedValue([]);

    renderSingleEmployeeLeaveDetails();

    await waitFor(() => {
      expect(employeeLeaveBalance.fetchSingleEmployeeLeaveRecord).toHaveBeenCalledWith(
        '1',
        currentYear,
      );
    });
  });

  test('displays inline error message for 500 errors', async () => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockRejectedValue({
      response: { status: 500 },
      message: 'Internal Server Error',
      isAxiosError: true,
    });
    renderSingleEmployeeLeaveDetails();
    await waitFor(() => {
      expect(screen.queryByText('Employee not found.')).not.toBeInTheDocument();
    });
    const backButton = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('renders table columns', async () => {
    renderSingleEmployeeLeaveDetails();
    await waitFor(() => {
      expect(screen.getAllByRole('columnheader', { name: 'Type' }).length).toBeGreaterThan(0);
      expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Duration' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Applied On' })).toBeInTheDocument();
    });
  });

  test('renders leave row data correctly', async () => {
    renderSingleEmployeeLeaveDetails();
    await waitFor(() => {
      expect(screen.getByText('Full Day')).toBeInTheDocument();
      expect(screen.getByText('10/1/2026')).toBeInTheDocument();
      expect(screen.getByText('9/1/2026')).toBeInTheDocument();
    });
  });

  test('navigates back on back button click', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderSingleEmployeeLeaveDetails();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('shows error from leavesDetailsError branch', async () => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockRejectedValue(
      new Error('Failed to fetch leave record Details'),
    );
    renderSingleEmployeeLeaveDetails();
    const error = await screen.findByText('Failed to fetch leave record Details');
    expect(error).toBeInTheDocument();
  });

  test('shows error message when error is not type of Error instance - fetchUser', async () => {
    vi.spyOn(userApi, 'fetchUserDetails').mockRejectedValue('Failed to fetch user details');

    renderSingleEmployeeLeaveDetails();

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch user details')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('shows error from userDetailsError', async () => {
    vi.spyOn(userApi, 'fetchUserDetails').mockRejectedValue(
      new Error('Failed to fetch user details'),
    );
    renderSingleEmployeeLeaveDetails();
    const error = await screen.findByText('Failed to fetch user details');
    expect(error).toBeInTheDocument();
  });

  test('updates selected year when dropdown changes', async () => {
    renderSingleEmployeeLeaveDetails();
    await waitFor(() => {
      expect(screen.getByDisplayValue('2026')).toBeInTheDocument();
    });

    const dropdown = screen.getByDisplayValue('2026');
    await userEvent.selectOptions(dropdown, '2025');

    await waitFor(() => {
      expect(screen.getByDisplayValue('2025')).toBeInTheDocument();
    });
  });
});
