import { MemoryRouter } from 'react-router-dom';
import * as requestApi from '@/api/request.api';
import type { RequestResponse } from '@/types/request';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PendingRequests from './PendingRequests';

const renderPendingRequest = () => {
  return render(
    <MemoryRouter>
      <PendingRequests />
    </MemoryRouter>,
  );
};

const mockRequests: RequestResponse[] = [
  {
    id: '1',
    date: '2026-04-22',
    description: 'Sick leave',
    employeeName: 'Priyansh Saxena',
    status: 'PENDING',
    leaveCategory: 'Annual Leave',
    type: 'PAST_LEAVE',
    duration: 'FULL_DAY',
    appliedDate: '2026-04-21',
  },
  {
    id: '2',
    date: '2026-04-22',
    description: 'Sick leave',
    employeeName: 'Jatin Joshi',
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

describe('Pending Request Page test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(requestApi, 'fetchRequests').mockResolvedValue(mockPageResponse);
  });

  test('shows loading state initially', () => {
    renderPendingRequest();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows error message on API failure', async () => {
    vi.spyOn(requestApi, 'fetchRequests').mockRejectedValue(new Error('Failed to fetch requests'));
    renderPendingRequest();
    expect(await screen.findByText('Failed to fetch requests')).toBeInTheDocument();
  });

  test('renders page header', async () => {
    renderPendingRequest();

    await waitFor(() => {
      expect(screen.getByText('Pending Request(s)')).toBeInTheDocument();
      expect(screen.getByText('Review and manage all employee requests')).toBeInTheDocument();
    });
  });

  test('renders request cards after loading', async () => {
    renderPendingRequest();

    expect(await screen.findByText('Priyansh Saxena')).toBeInTheDocument();
    expect(screen.getByText('Jatin Joshi')).toBeInTheDocument();
    expect(screen.getByText('Pruthviraj Deshmukh')).toBeInTheDocument();
  });

  test('render leave category if request has it', async () => {
    renderPendingRequest();

    expect(await screen.findByText('Category :')).toBeInTheDocument();
    expect(screen.getByText('Annual Leave')).toBeInTheDocument();
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

    renderPendingRequest();

    expect(await screen.findByText('Priyansh Saxena')).toBeInTheDocument();

    const button = await screen.findByRole('button', { name: 'Show More' });
    await userEvent.click(button);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenLastCalledWith({
        status: 'PENDING',
        scope: 'ORGANIZATION',
        page: 1,
      });
    });

    expect(await screen.findByText('Jatin Joshi')).toBeInTheDocument();
  });
});
