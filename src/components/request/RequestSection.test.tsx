import type { RequestResponse } from '@/types/request';
import type { LeaveResponse } from '@/types/leaves';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as requestApi from '@/api/request.api';
import * as leaveApi from '../../api/leave.api';
import userEvent from '@testing-library/user-event';
import RequestSection from './RequestSection';
import { vi } from 'vitest';
import LeaveAndRequest from '@/pages/LeaveAndRequest';

const mockRequests: RequestResponse[] = [
  {
    id: '1',
    date: '2026-04-22',
    description: 'Sick leave',
    employeeName: 'Priyansh Saxena',
    status: 'PENDING',
    type: 'PAST_LEAVE',
    duration: 'FULL_DAY',
    appliedDate: '2026-04-21',
  },
  {
    id: '2',
    date: '2026-04-22',
    description: 'Sick leave',
    employeeName: 'Rakshit Saxena',
    status: 'APPROVED',
    type: 'PAST_LEAVE',
    duration: 'FULL_DAY',
    appliedDate: '2026-04-21',
  },
  {
    id: '3',
    date: '2026-04-22',
    description: 'Sick leave',
    employeeName: 'Pruthviraj Deshmukh',
    status: 'REJECTED',
    type: 'PAST_LEAVE',
    duration: 'FULL_DAY',
    appliedDate: '2026-04-21',
  },
];

const mockPageResponse = {
  content: mockRequests,
  first: true,
  last: true,
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
};

const renderRequestSection = () => {
  render(
    <MemoryRouter>
      <RequestSection />
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
    employeeName: 'Rakshit Saxena',
    startTime: '09:00',
    reason: 'Personal work',
    holidayId: null,
  },
];

const mockLeavesPageResponse = {
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
      <LeaveAndRequest />
    </MemoryRouter>,
  );
};

describe('RequestSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(requestApi, 'fetchRequests').mockResolvedValue(mockPageResponse);
  });

  test('shows loading state initially', () => {
    renderRequestSection();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders filter dropdown with default value', async () => {
    renderRequestSection();
    expect(await screen.findByDisplayValue('All')).toBeInTheDocument();
  });

  test('renders table columns', async () => {
    renderRequestSection();
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Type' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Duration' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    });
  });

  test('renders requests data after loading', async () => {
    renderRequestSection();
    expect(await screen.findAllByText('Past Leave')).toHaveLength(1);
  });

  test('calls fetchRequests with pending status on filter change', async () => {
    const spy = vi.spyOn(requestApi, 'fetchRequests').mockResolvedValue(mockPageResponse);
    renderRequestSection();
    const dropdown = screen.getByDisplayValue('All');
    await userEvent.selectOptions(dropdown, 'PENDING');
    await waitFor(() => {
      expect(spy).toHaveBeenLastCalledWith({
        status: 'PENDING',
        scope: 'SELF',
        page: 0,
      });
    });
  });

  test('loads more requests when Show More is clicked', async () => {
    const firstPage = {
      content: [mockRequests[0]],
      first: true,
      last: false,
      totalPages: 2,
      totalElements: 2,
      size: 1,
      number: 0,
    };

    const secondPage = {
      content: [mockRequests[1]],
      first: false,
      last: true,
      totalPages: 2,
      totalElements: 2,
      size: 1,
      number: 1,
    };

    const fetchSpy = vi
      .spyOn(requestApi, 'fetchRequests')
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    renderRequestSection();

    expect(await screen.findByText('Past Leave')).toBeInTheDocument();

    const button = await screen.findByRole('button', { name: 'Show More' });
    await userEvent.click(button);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenLastCalledWith({
        status: 'ALL',
        scope: 'SELF',
        page: 1,
      });
    });

    expect(await screen.findAllByText('Past Leave')).toHaveLength(3);
  });

  test('shows error message on API failure', async () => {
    vi.spyOn(requestApi, 'fetchRequests').mockRejectedValue(new Error('Failed to fetch requests'));
    renderRequestSection();
    expect(await screen.findByText('Failed to fetch requests')).toBeInTheDocument();
  });
});

describe('Leave Page Component', () => {
  beforeEach(() => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(mockLeavesPageResponse);
  });

  test('renders Leave and Raise Request tab buttons', () => {
    renderLeavePage();
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Raise Request' })).toBeInTheDocument();
  });

  test('Leave tab is active by default', () => {
    renderLeavePage();
    expect(screen.getByRole('button', { name: 'Submit Leave' })).toBeInTheDocument();
  });

  test('switching to Raise Request tab shows RaiseRequestForm', async () => {
    renderLeavePage();

    await userEvent.click(screen.getByRole('button', { name: 'Raise Request' }));

    await waitFor(() => {
      expect(screen.getByText('Request Type')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Submit Leave' })).not.toBeInTheDocument();
    });
  });

  test('switching to Raise Request tab hides leaves table', async () => {
    renderLeavePage();
    await userEvent.click(screen.getByRole('button', { name: 'Raise Request' }));
    await waitFor(() => {
      expect(screen.queryByText('My Leaves')).not.toBeInTheDocument();
    });
  });

  test('switching back to Leave tab shows leaves table again', async () => {
    renderLeavePage();
    await userEvent.click(screen.getByRole('button', { name: 'Raise Request' }));
    await userEvent.click(screen.getByRole('button', { name: 'Leave' }));
    await waitFor(() => {
      expect(screen.getByText('My Leaves')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Leave' })).toBeInTheDocument();
    });
  });
});
