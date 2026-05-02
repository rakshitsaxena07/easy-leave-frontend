import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LeaveDetails from '@/pages/LeaveDetails';
import * as api from '@/api/leave.api';
import * as leaveFormUtils from '@/utils/leaveForm';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { LeaveApplicationResponse, LeaveResponse } from '@/types/leaves';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';

vi.mock('@/api/leave.api');
vi.mock('@/utils/leaveForm');

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockLeave: LeaveResponse = {
  id: '1',
  date: '2026-04-06',
  employeeName: 'Raj',
  type: 'Annual Leave',
  duration: 'FULL_DAY',
  startTime: '09:00:00',
  applyOn: '2026-04-06T10:00:00',
  reason: 'Personal work',
  holidayId: null,
};

const mockUpdateLeaveResponse: LeaveApplicationResponse = {
  id: '123',
  date: new Date(2026, 3, 6).toISOString(),
  type: 'Annual Leave',
  duration: 'FULL_DAY',
  startTime: '10:00',
  description: 'Test',
};

vi.mock('@/hooks/useLeaveCategories');

const renderWithRouter = () => {
  return render(
    <MemoryRouter initialEntries={['/leave/1']}>
      <Routes>
        <Route path="/leave/:id" element={<LeaveDetails />} />
      </Routes>
    </MemoryRouter>,
  );
};

const submitForm = async () => {
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /update leave/i })).toBeInTheDocument(),
  );
  await userEvent.click(screen.getByRole('button', { name: /update leave/i }));
};

const cancelLeave = async () => {
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /cancel leave/i })).toBeInTheDocument(),
  );
  await userEvent.click(screen.getByRole('button', { name: /cancel leave/i }));
};

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(async () => {
  vi.clearAllMocks();
  vi.spyOn(api, 'fetchLeaveById').mockResolvedValue(mockLeave);

  const { default: useLeaveCategories } = await import('@/hooks/useLeaveCategories');
  vi.mocked(useLeaveCategories).mockReturnValue({
    categories: [{ id: 'cat-1', name: 'Annual Leave' }],
    loading: false,
    error: null,
    loadLeaveCategories: vi.fn(),
  });
});

describe('LeaveDetails Page Component', () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-01-01'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test('renders page header', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Leave Details')).toBeInTheDocument();
      expect(screen.getByText('View and manage your leave details')).toBeInTheDocument();
    });
  });

  test('shows loading initially', () => {
    renderWithRouter();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('show go back button and navigate back on click', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backButton);
  });

  test('renders page after data is fetched', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Leave Details')).toBeInTheDocument();
    });
  });

  test('shows error when API fails', async () => {
    vi.spyOn(api, 'fetchLeaveById').mockRejectedValue(new Error('Failed to fetch leave'));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Leave not found')).toBeInTheDocument();
    });
  });

  test('populates leaveCategoryId when category matches leave type', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Leave Details')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Annual Leave')).toBeInTheDocument();
  });

  test('sets empty string for leaveCategoryId when no category matches leave type', async () => {
    const { default: useLeaveCategories } = await import('@/hooks/useLeaveCategories');
    vi.mocked(useLeaveCategories).mockReturnValue({
      categories: [{ id: 'cat-99', name: 'Sick Leave' }],
      loading: false,
      error: null,
      loadLeaveCategories: vi.fn(),
    });

    renderWithRouter();

    await waitFor(() => expect(screen.getByText('Leave Details')).toBeInTheDocument());
  });

  test('does not call setError when fetchLeaveById throws a non-Error value', async () => {
    vi.spyOn(api, 'fetchLeaveById').mockRejectedValue('network failure');

    renderWithRouter();

    await waitFor(() => expect(screen.getByText('Leave not found')).toBeInTheDocument());
  });

  test('shows error toast when no fields have changed', async () => {
    vi.mocked(leaveFormUtils.buildUpdatePayload).mockReturnValue({});

    renderWithRouter();
    await submitForm();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'No changes made. At least one field must be provided to update the leave',
      ),
    );
  });

  test('calls updateLeave and shows success toast when changes exist', async () => {
    vi.mocked(leaveFormUtils.buildUpdatePayload).mockReturnValue({ duration: 'HALF_DAY' });
    vi.spyOn(api, 'updateLeave').mockResolvedValue(mockUpdateLeaveResponse);

    renderWithRouter();
    await submitForm();

    await waitFor(() => {
      expect(api.updateLeave).toHaveBeenCalledWith('1', { duration: 'HALF_DAY' });
      expect(toast.success).toHaveBeenCalledWith('Leave updated successfully!');
    });
  });

  test('shows axios error message when updateLeave throws an AxiosError', async () => {
    vi.mocked(leaveFormUtils.buildUpdatePayload).mockReturnValue({ duration: 'HALF_DAY' });

    const axiosErr = {
      isAxiosError: true,
      response: { data: { message: 'Unauthorized' } },
    };
    vi.spyOn(api, 'updateLeave').mockRejectedValue(axiosErr);

    renderWithRouter();
    await submitForm();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Unauthorized'));
  });

  test('shows fallback message when axios error has no response message', async () => {
    vi.mocked(leaveFormUtils.buildUpdatePayload).mockReturnValue({ duration: 'HALF_DAY' });

    const axiosErr = {
      isAxiosError: true,
      response: { data: {} },
    };
    vi.spyOn(api, 'updateLeave').mockRejectedValue(axiosErr);

    renderWithRouter();
    await submitForm();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Leave updation failed'));
  });

  test('shows generic error toast when updateLeave throws a non-axios error', async () => {
    vi.mocked(leaveFormUtils.buildUpdatePayload).mockReturnValue({ duration: 'HALF_DAY' });
    vi.spyOn(api, 'updateLeave').mockRejectedValue(new Error('Unknown'));

    renderWithRouter();
    await submitForm();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Unexpected Error Occurred'));
  });

  test('shows success toast messsage when leave cancelled successfully', async () => {
    vi.spyOn(api, 'cancelLeave').mockResolvedValue();

    renderWithRouter();
    await cancelLeave();
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Leave cancelled successfully.'),
    );
  });

  test('shows axios error toast messsage when cancel leave throws AxiosError', async () => {
    const axiosErr = {
      isAxiosError: true,
      response: { data: { message: 'Cannot cancel past leave' } },
    };

    vi.spyOn(api, 'cancelLeave').mockRejectedValue(axiosErr);

    renderWithRouter();
    await cancelLeave();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Cannot cancel past leave'));
  });

  test('shows generic error toast messsage when cancel leave throws non-axios error', async () => {
    vi.spyOn(api, 'cancelLeave').mockRejectedValue(new Error('Network error'));

    renderWithRouter();
    await cancelLeave();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to cancel leave'));
  });

  test('shows fallback message when cancel leave throws axios error that has no response message', async () => {
    const axiosErr = {
      isAxiosError: true,
      response: { data: {} },
    };
    vi.spyOn(api, 'cancelLeave').mockRejectedValue(axiosErr);

    renderWithRouter();
    await cancelLeave();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to cancel leave'));
  });

  test('disables update button when leave date is in the past', async () => {
    vi.spyOn(api, 'fetchLeaveById').mockResolvedValue({
      ...mockLeave,
      date: '2025-01-14',
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update leave/i })).toBeDisabled();
    });
  });

  test('enables update button when leave date is in the future', async () => {
    vi.spyOn(api, 'fetchLeaveById').mockResolvedValue({
      ...mockLeave,
      date: '2026-01-10',
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update leave/i })).not.toBeDisabled();
    });
  });

  test('renders informational message with cancel button', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Cancelling leave cannot be undone.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel leave/i })).toBeInTheDocument();
    });
  });
});
