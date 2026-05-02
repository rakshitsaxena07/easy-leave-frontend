import Leave from '@/pages/LeaveAndRequest';
import type { LeaveResponse } from '@/types/leaves';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import * as leaveApi from '@/api/leave.api';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockLeaves: LeaveResponse[] = [
  {
    id: '1',
    type: 'Annual Leave',
    duration: 'FULL_DAY',
    date: '2026-10-01',
    applyOn: '2026-09-01',
    employeeName: 'Priyansh Saxena',
    startTime: '09:00',
    reason: 'Personal work',
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

const renderLeavePage = () => {
  render(
    <MemoryRouter>
      <Leave />
    </MemoryRouter>,
  );
};

describe('Leave Page Component', () => {
  beforeEach(() => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(mockPageResponse);
  });

  test('renders My Leaves heading', () => {
    renderLeavePage();
    expect(screen.getByText('My Leaves')).toBeInTheDocument();
  });

  test('renders filter dropdown with all status options', () => {
    renderLeavePage();
    expect(screen.getByDisplayValue('All')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    renderLeavePage();
    expect(screen.getByText('Loading...', { selector: 'p' })).toBeInTheDocument();
  });

  test('renders leave data after loading', async () => {
    renderLeavePage();
    await waitFor(() => {
      expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    });
  });

  test('renders table columns', async () => {
    renderLeavePage();
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Type' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Duration' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    });
  });

  test('shows error message on API failure', async () => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockRejectedValue(new Error('Failed to fetch leaves'));
    renderLeavePage();
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch leaves')).toBeInTheDocument();
    });
  });

  test('calls fetchLeaves with upcoming status on filter change', async () => {
    const spy = vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(mockPageResponse);
    renderLeavePage();
    const dropdown = screen.getByDisplayValue('All');
    await userEvent.selectOptions(dropdown, 'upcoming');
    await waitFor(() => {
      expect(spy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'upcoming',
          scope: 'self',
        }),
      );
    });
  });

  test('shows Ongoing status for leave today', async () => {
    const todayLeave: LeaveResponse[] = [
      {
        ...mockLeaves[0],
        date: new Date().toISOString().split('T')[0],
      },
    ];

    const todayResponse = { ...mockPageResponse, content: todayLeave };

    vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(todayResponse);
    renderLeavePage();
    await waitFor(() => {
      expect(screen.getByText('Ongoing')).toBeInTheDocument();
    });
  });

  test('shows Completed leave ', async () => {
    const todayLeave: LeaveResponse[] = [
      {
        ...mockLeaves[0],
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ];

    const todayResponse = { ...mockPageResponse, content: todayLeave };

    vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(todayResponse);
    renderLeavePage();
    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  test('renders ApplyLeaveForm component', async () => {
    renderLeavePage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Submit Leave' })).toBeInTheDocument();
    });
  });

  test('navigates to leave detail page when a row is clicked', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    renderLeavePage();

    await waitFor(() => expect(screen.getByText('Annual Leave')).toBeInTheDocument());

    await userEvent.click(screen.getByText('Annual Leave'));

    expect(mockNavigate).toHaveBeenCalledWith('/leave/1');
  });

  test('shows error toast when clicking on optional holiday leave', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    const optionalHolidayLeave: LeaveResponse[] = [
      {
        ...mockLeaves[0],
        type: 'Optional Holiday',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ];
    const optionalHolidayResponse = { ...mockPageResponse, content: optionalHolidayLeave };

    vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(optionalHolidayResponse);

    renderLeavePage();

    await waitFor(() => {
      expect(screen.getByText('Optional Holiday')).toBeInTheDocument();
    });

    const row = await screen.findByRole('row', {
      name: /optional holiday/i,
    });
    await userEvent.click(row);

    expect(toast.error).toHaveBeenCalledWith('Cannot update optional holiday');

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
