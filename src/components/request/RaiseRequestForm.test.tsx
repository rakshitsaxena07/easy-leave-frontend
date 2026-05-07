import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import RaiseRequestForm from './RaiseRequestForm';
import * as leaveCategoriesApi from '@/api/leaveCategories.api';
import userEvent from '@testing-library/user-event';
import type { DateRange } from 'react-day-picker';
import type { RaiseRequestFormValues } from '@/types/request';

const mockPastDate = new Date(2026, 2, 10);

const mockCategories = [
  { id: '1', name: 'Annual Leave' },
  { id: '2', name: 'Sick Leave' },
];

const initialValues: RaiseRequestFormValues = {
  requestType: '',
  leaveCategoryId: '',
  dateRange: undefined,
  duration: 'FULL_DAY',
  startTime: '10:00',
  description: '',
};

const mockOnSubmit = vi.fn();

const renderRaiseRequestForm = () => {
  render(<RaiseRequestForm initialValues={initialValues} onSubmit={mockOnSubmit} />);
};

vi.mock('./DatePicker', () => ({
  default: ({ setDate }: { setDate: (range: DateRange) => void }) => (
    <button type="button" onClick={() => setDate({ from: mockPastDate, to: undefined })}>
      Pick a date
    </button>
  ),
}));

describe('RaiseRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(leaveCategoriesApi, 'fetchLeaveCategories').mockResolvedValue(mockCategories);
  });

  test('renders request type select by default', () => {
    renderRaiseRequestForm();
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
  });

  test('renders description field by default', () => {
    renderRaiseRequestForm();
    expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();
  });

  test('renders submit button by default', () => {
    renderRaiseRequestForm();
    expect(screen.getByRole('button', { name: 'Raise Request' })).toBeInTheDocument();
  });

  test('shows leave category select when PAST_LEAVE is selected', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'PAST_LEAVE');
    expect(await screen.findByLabelText(/Category/i)).toBeInTheDocument();
  });

  test('shows date picker when PAST_LEAVE is selected', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'PAST_LEAVE');
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  test('shows duration when PAST_LEAVE is selected', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'PAST_LEAVE');
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
  });

  test('shows start time and end time when PAST_LEAVE is selected', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'PAST_LEAVE');
    expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();
  });

  test('does not show leave category when COMPENSATORY_OFF is selected', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'COMPENSATORY_OFF');
    expect(screen.queryByLabelText(/Category/i)).not.toBeInTheDocument();
  });

  test('shows date picker when COMPENSATORY_OFF is selected', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'COMPENSATORY_OFF');
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  test('shows duration when COMPENSATORY_OFF is selected', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'COMPENSATORY_OFF');
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
  });

  test('shows start time and end time when COMPENSATORY_OFF is selected', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'COMPENSATORY_OFF');
    expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();
  });

  test('end time is disabled', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'PAST_LEAVE');
    expect(screen.getByLabelText(/End Time/i)).toBeDisabled();
  });

  test('end time updates when duration changes to half day', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'PAST_LEAVE');
    await userEvent.selectOptions(screen.getByLabelText(/Duration/i), 'HALF_DAY');
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '10:00' } });
    expect(screen.getByLabelText(/End Time/i)).toHaveValue('14:00');
  });

  test('end time updates when duration is full day', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'PAST_LEAVE');
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '09:00' } });
    expect(screen.getByLabelText(/End Time/i)).toHaveValue('17:00');
  });

  test('shows date error when submitted without selecting a date', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'COMPENSATORY_OFF');
    await userEvent.click(screen.getByRole('button', { name: 'Raise Request' }));
    expect(await screen.findByText('Select a date')).toBeInTheDocument();
  });

  test('shows description error when submitted without description', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'COMPENSATORY_OFF');
    await userEvent.click(screen.getByRole('button', { name: 'Raise Request' }));
    expect(await screen.findByText('Reason is required')).toBeInTheDocument();
  });

  test('shows description error when description exceeds 1000 characters', async () => {
    renderRaiseRequestForm();
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), 'COMPENSATORY_OFF');
    fireEvent.change(screen.getByLabelText(/Reason/i), {
      target: { value: 'a'.repeat(1500) },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Raise Request' }));
    expect(await screen.findByText('Reason cannot be over 1000 characters')).toBeInTheDocument();
  });
});
