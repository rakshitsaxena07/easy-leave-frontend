import type { LeaveFormValues } from '@/types/leaveForm';
import { buildUpdatePayload } from './leaveForm';
import type { LeaveDuration } from '@/types/leaves';
import type { HolidayResponse } from '@/types/holiday';

const originalLeave: LeaveFormValues = {
  leaveCategoryId: '1',
  holidayId: '',
  dateRange: { from: new Date('2026-04-10'), to: new Date('2026-04-10') },
  duration: 'FULL_DAY',
  startTime: '09:00',
  description: 'Initial reason',
  leaveType: 'regular',
};

describe('buildUpdatePayload', () => {
  test('should return empty payload when nothing changes', () => {
    const result = buildUpdatePayload(originalLeave, originalLeave);

    expect(result).toEqual({});
  });

  test('should update leaveCategoryId when changed', () => {
    const updatedLeave = { ...originalLeave, leaveCategoryId: '2' };

    const result = buildUpdatePayload(updatedLeave, originalLeave);

    expect(result).toEqual({
      leaveCategoryId: '2',
    });
  });

  test('should update date when changed', () => {
    const updatedLeave = {
      ...originalLeave,
      dateRange: { from: new Date('2026-04-12'), to: new Date('2026-04-12') },
    };

    const result = buildUpdatePayload(updatedLeave, originalLeave);

    expect(result).toEqual({
      date: '2026-04-12',
    });
  });

  test('should not update date if same after formatting', () => {
    const updatedLeave = {
      ...originalLeave,
      dateRange: { from: new Date('2026-04-10T10:00:00'), to: new Date('2026-04-10') },
    };

    const result = buildUpdatePayload(updatedLeave, originalLeave);

    expect(result).toEqual({});
  });

  test('should update duration when changed', () => {
    const updatedLeave = { ...originalLeave, duration: 'HALF_DAY' as LeaveDuration };

    const result = buildUpdatePayload(updatedLeave, originalLeave);

    expect(result).toEqual({
      duration: 'HALF_DAY',
    });
  });

  test('should update startTime when changed', () => {
    const updatedLeave = { ...originalLeave, startTime: '10:00' };

    const result = buildUpdatePayload(updatedLeave, originalLeave);

    expect(result).toEqual({
      startTime: '10:00',
    });
  });

  test('should update description when changed', () => {
    const updatedLeave = { ...originalLeave, description: 'Updated reason' };

    const result = buildUpdatePayload(updatedLeave, originalLeave);

    expect(result).toEqual({
      description: 'Updated reason',
    });
  });

  test('should update multiple fields when multiple changes occur', () => {
    const updatedLeave = {
      ...originalLeave,
      leaveCategoryId: '2',
      duration: 'HALF_DAY' as LeaveDuration,
      description: 'Updated reason',
    };

    const result = buildUpdatePayload(updatedLeave, originalLeave);

    expect(result).toEqual({
      leaveCategoryId: '2',
      duration: 'HALF_DAY',
      description: 'Updated reason',
    });
  });

  test('should not include date if new date is empty', () => {
    const updatedLeave = {
      ...originalLeave,
      dateRange: { from: undefined, to: undefined },
    };

    const result = buildUpdatePayload(updatedLeave, originalLeave);

    expect(result).toEqual({});
  });

  test('should handle oldDate as empty string when original date is missing', () => {
    const original: LeaveFormValues = {
      ...originalLeave,
      dateRange: { from: undefined, to: undefined },
    };

    const updated: LeaveFormValues = {
      ...originalLeave,
      dateRange: { from: new Date('2026-04-15'), to: new Date('2026-04-15') },
    };

    const result = buildUpdatePayload(updated, original);

    expect(result).toEqual({
      date: '2026-04-15',
    });
  });

  test('should update holidayId and related fields when holidayId changes', () => {
    const holidays: HolidayResponse[] = [
      { id: 'holiday-1', name: 'Holiday 1', date: '2026-12-31', type: 'OPTIONAL' },
      { id: 'holiday-2', name: 'Holiday 2', date: '2026-10-20', type: 'OPTIONAL' },
    ];

    const original: LeaveFormValues = {
      ...originalLeave,
      leaveType: 'holiday',
      holidayId: 'holiday-2',
    };

    const updated: LeaveFormValues = {
      ...originalLeave,
      leaveType: 'holiday',
      holidayId: 'holiday-1',
    };

    const result = buildUpdatePayload(updated, original, holidays);

    expect(result).toEqual({
      holidayId: 'holiday-1',
      date: '2026-12-31',
      description: 'Holiday 1',
    });
  });

  test('should update only startTime when holidayId does not change', () => {
    const original: LeaveFormValues = {
      ...originalLeave,
      leaveType: 'holiday',
      holidayId: 'holiday-1',
      startTime: '09:00',
    };

    const updated: LeaveFormValues = {
      ...original,
      startTime: '10:00',
    };

    const result = buildUpdatePayload(updated, original, []);

    expect(result).toEqual({ startTime: '10:00' });
  });

  test('should return empty payload when nothing changes on holiday leave', () => {
    const original: LeaveFormValues = {
      ...originalLeave,
      leaveType: 'holiday',
      holidayId: 'holiday-1',
    };

    const result = buildUpdatePayload(original, original, []);

    expect(result).toEqual({});
  });
});
