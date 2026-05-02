import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import DatePicker from './DatePicker';
import { format } from 'date-fns';
import userEvent from '@testing-library/user-event';

// Monday, April 6, 2026
const mockFrom = new Date(2026, 3, 6);

// Friday, April 10, 2026
const mockTo = new Date(2026, 3, 10);

beforeAll(() => {
  // Mocking the current date to April 1, 2026 for consistent test results
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 3, 1));
});

afterAll(() => {
  vi.useRealTimers();
});

describe('DatePicker', () => {
  test('displays only the start date when only from is provided', () => {
    render(<DatePicker date={{ from: mockFrom, to: undefined }} setDate={vi.fn()} />);
    expect(screen.getByText(format(mockFrom, 'LLL dd, y'))).toBeInTheDocument();
  });

  test('displays full range when both "from" and "to" are provided', () => {
    render(<DatePicker date={{ from: mockFrom, to: mockTo }} setDate={vi.fn()} mode="range" />);

    const expected = `${format(mockFrom, 'LLL dd, y')} - ${format(mockTo, 'LLL dd, y')}`;
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

describe('DatePicker - single mode selection', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 3, 1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('calls setDate with from/to equal to selected date in single mode', async () => {
    const user = userEvent.setup();
    const setDate = vi.fn();

    render(<DatePicker date={undefined} setDate={setDate} mode="single" />);

    await user.click(screen.getByRole('button')); // Popover button

    const dayButton = screen.getByRole('button', { name: /April 6(th)?,? 2026/i }); // Calendar day button
    await user.click(dayButton);

    expect(setDate).toHaveBeenCalledWith({
      from: new Date(2026, 3, 6),
      to: new Date(2026, 3, 6),
    });
  });

  test('calls setDate with undefined when selected date is cleared in single mode', async () => {
    const user = userEvent.setup();
    const setDate = vi.fn();

    render(<DatePicker date={{ from: mockFrom, to: mockFrom }} setDate={setDate} mode="single" />);

    await user.click(screen.getByRole('button'));

    const dayButton = screen.getByRole('button', { name: /April 6(th)?,? 2026/i });
    await user.click(dayButton);

    expect(setDate).toHaveBeenCalledWith(undefined);
  });
});
