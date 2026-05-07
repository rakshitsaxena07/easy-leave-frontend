import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import ApplyLeaveForm from '@/components/leave/ApplyLeaveForm';
import * as leaveCategoriesApi from '@/api/leaveCategories.api';
import * as holidayApi from '@/api/holiday.api';
import userEvent from '@testing-library/user-event';
import type { LeaveApplicationRequest, LeaveApplicationResponse } from '@/types/leaves';
import * as leaveApi from '@/api/leave.api';
import type { DateRange } from 'react-day-picker';
import { getDatesBetween } from '@/utils/time';
import { toast } from 'react-hot-toast';

// Monday, April 6, 2026
const mockToday = new Date(2026, 3, 6);

const mockCategories = [
  { id: '1', name: 'Annual Leave' },
  { id: '2', name: 'Bereavement Leave' },
];

const mockLeaveApplicationRequest: LeaveApplicationRequest = {
  leaveCategoryId: '1',
  dates: getDatesBetween({ from: mockToday, to: undefined }),
  startTime: '10:00',
  duration: 'FULL_DAY',
  description: 'Test',
};

const mockLeaveApplicationResponse: LeaveApplicationResponse[] = [
  {
    id: '123',
    date: mockToday.toISOString(),
    type: 'Annual Leave',
    duration: 'FULL_DAY',
    startTime: '10:00',
    description: 'Test',
  },
];

const renderApplyLeaveForm = () => {
  render(<ApplyLeaveForm refreshLeaves={vi.fn()} />);
};

vi.mock('../DatePicker', () => ({
  default: ({ setDate }: { setDate: (range: DateRange) => void }) => (
    <button type="button" onClick={() => setDate({ from: mockToday, to: undefined })}>
      Pick a date
    </button>
  ),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ApplyLeaveForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(leaveCategoriesApi, 'fetchLeaveCategories').mockResolvedValue(mockCategories);
    vi.spyOn(leaveApi, 'applyLeave').mockResolvedValue(mockLeaveApplicationResponse);
    vi.spyOn(holidayApi, 'fetchHolidays').mockResolvedValue([
      { id: 'holiday1', name: 'Dussehra', date: '2026-10-20', type: 'OPTIONAL' },
      { id: 'holiday2', name: 'New Years Eve', date: '2026-12-31', type: 'OPTIONAL' },
    ]);
  });

  test('renders all form fields', async () => {
    renderApplyLeaveForm();

    expect(await screen.findByLabelText(/Leave Category/i)).toBeInTheDocument();
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Leave Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Leave' })).toBeInTheDocument();
  });

  test('display required field validation errors', async () => {
    renderApplyLeaveForm();

    await screen.findByLabelText(/Leave Category/i);

    await userEvent.click(screen.getByRole('button', { name: 'Submit Leave' }));

    expect(await screen.findByText('Leave category is required')).toBeInTheDocument();
    expect(screen.getByText('Please choose a date')).toBeInTheDocument();
    expect(screen.getByText('Leave Description is required')).toBeInTheDocument();
  });

  test('displays error when description exceeds 1000 characters', async () => {
    renderApplyLeaveForm();

    const leaveCategoryInput = await screen.findByLabelText(/Leave Category/i);
    await userEvent.selectOptions(leaveCategoryInput, '1');

    const descriptionInput = screen.getByLabelText(/Leave Description/i);
    const longDescription = 'a'.repeat(1001);

    fireEvent.change(descriptionInput, { target: { value: longDescription } });

    await userEvent.click(screen.getByRole('button', { name: 'Submit Leave' }));

    const validationErrors = await screen.findByTestId('errors-description-input');
    expect(validationErrors.innerHTML).toBe('Leave Description cannot be over 1000 characters');
  });

  test('submits form with correct data', async () => {
    renderApplyLeaveForm();

    const leaveCategoryInput = await screen.findByLabelText(/Leave Category/i);
    await userEvent.selectOptions(leaveCategoryInput, '1');

    await userEvent.click(screen.getByRole('button', { name: 'Pick a date' }));

    const descriptionInput = screen.getByLabelText(/Leave Description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test' } });

    await userEvent.click(screen.getByRole('button', { name: 'Submit Leave' }));

    expect(leaveApi.applyLeave).toHaveBeenCalledOnce();
    expect(leaveApi.applyLeave).toHaveBeenCalledWith(mockLeaveApplicationRequest);
    expect(toast.success).toHaveBeenCalled();
  });

  test('displays API error message on submission failure', async () => {
    const errorMessage = 'Leave already exists for selected date';
    const axiosError = {
      isAxiosError: true,
      response: { data: { message: errorMessage } },
    };

    vi.spyOn(leaveApi, 'applyLeave').mockRejectedValue(axiosError);

    renderApplyLeaveForm();

    const leaveCategoryInput = await screen.findByLabelText(/Leave Category/i);
    await userEvent.selectOptions(leaveCategoryInput, '1');

    await userEvent.click(screen.getByRole('button', { name: 'Pick a date' }));

    const descriptionInput = screen.getByLabelText(/Leave Description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test' } });

    await userEvent.click(screen.getByRole('button', { name: 'Submit Leave' }));

    expect(toast.error).toHaveBeenCalledWith(errorMessage);
  });

  test('displays generic error message when submission fails with non-axios error', async () => {
    vi.spyOn(leaveApi, 'applyLeave').mockRejectedValue(new Error('Network failure'));

    renderApplyLeaveForm();

    const leaveCategoryInput = await screen.findByLabelText(/Leave Category/i);
    await userEvent.selectOptions(leaveCategoryInput, '1');

    await userEvent.click(screen.getByRole('button', { name: 'Pick a date' }));

    const descriptionInput = screen.getByLabelText(/Leave Description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test' } });

    await userEvent.click(screen.getByRole('button', { name: 'Submit Leave' }));

    expect(toast.error).toHaveBeenCalledWith('Unexpected Error Occurred');
  });

  test('updates the end time field when duration is set to half day', async () => {
    renderApplyLeaveForm();

    const durationInput = await screen.getByLabelText(/Duration/i);
    await userEvent.selectOptions(durationInput, 'HALF_DAY');

    const startTimeInput = screen.getByLabelText(/Start Time/i);
    const endTimeInput = screen.getByLabelText(/End Time/i);

    fireEvent.change(startTimeInput, { target: { value: '10:00' } });

    expect(endTimeInput).toHaveValue('14:00');
  });

  test('displays fallback message when axios error has no response message', async () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: {} },
    };

    vi.spyOn(leaveApi, 'applyLeave').mockRejectedValue(axiosError);

    renderApplyLeaveForm();

    const leaveCategoryInput = await screen.findByLabelText(/Leave Category/i);
    const option = await screen.findByRole('option', { name: /Annual Leave/i });
    await userEvent.selectOptions(leaveCategoryInput, option);

    await userEvent.click(screen.getByRole('button', { name: 'Pick a date' }));

    const descriptionInput = screen.getByLabelText(/Leave Description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test' } });

    await userEvent.click(screen.getByRole('button', { name: 'Submit Leave' }));

    expect(toast.error).toHaveBeenCalledWith('Leave Application submission failed');
  });

  test('switches to holiday mode when Optional Holiday is selected from leave type dropdown', async () => {
    renderApplyLeaveForm();
    await screen.findByLabelText(/Leave Category/i);

    await userEvent.selectOptions(screen.getByLabelText(/Leave Type/i), 'holiday');

    expect(screen.getByLabelText(/Select Optional Holiday/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Leave Category/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pick a date/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Reason/i)).not.toBeInTheDocument();
  });

  test('displays validation error when submitting in holiday mode without selecting a holiday', async () => {
    renderApplyLeaveForm();
    await screen.findByLabelText(/Leave Category/i);

    await userEvent.selectOptions(screen.getByLabelText(/Leave Type/i), 'holiday');
    await userEvent.click(screen.getByRole('button', { name: 'Submit Leave' }));

    expect(await screen.findByText(/Please select a holiday/i)).toBeInTheDocument();
  });

  test('submits correct payload when a holiday is selected', async () => {
    renderApplyLeaveForm();
    await screen.findByLabelText(/Leave Category/i);

    await userEvent.selectOptions(screen.getByLabelText(/Leave Type/i), 'holiday');
    await userEvent.selectOptions(screen.getByLabelText(/Select Optional Holiday/i), 'holiday1');
    await userEvent.click(screen.getByRole('button', { name: 'Submit Leave' }));

    await waitFor(() => {
      expect(leaveApi.applyLeave).toHaveBeenCalledWith({
        holidayId: 'holiday1',
        dates: ['2026-10-20'],
        description: 'Dussehra',
        duration: 'FULL_DAY',
        startTime: '10:00',
      });
    });
    expect(toast.success).toHaveBeenCalled();
  });

  test('displays validation error when no leave type is selected', async () => {
    renderApplyLeaveForm();
    await screen.findByLabelText(/Leave Type/i);

    await userEvent.selectOptions(screen.getByLabelText(/Leave Type/i), '');
    await userEvent.click(screen.getByRole('button', { name: 'Submit Leave' }));

    expect(await screen.findByText(/Leave type is required/i)).toBeInTheDocument();
  });
});
