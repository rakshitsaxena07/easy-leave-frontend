import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import useLeaves from './useLeaves';
import * as leaveApi from '../api/leave.api';
import type { LeaveResponse } from '../types/leaves';

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

describe('useLeaves hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should fetch leaves successfully', async () => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockResolvedValue(mockPageResponse);
    const { result } = renderHook(() => useLeaves({ status: 'all', scope: 'self' }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.leaves).toEqual(mockLeaves);
    expect(result.current.error).toBeNull();
  });

  test('should load more leaves when loadMore is called', async () => {
    const fetchSpy = vi
      .spyOn(leaveApi, 'fetchLeaves')
      .mockResolvedValueOnce({
        content: mockLeaves,
        last: false,
        number: 0,
        totalPages: 2,
        totalElements: 2,
        size: 1,
        first: true,
      })
      .mockResolvedValueOnce({
        content: mockLeaves,
        last: true,
        number: 1,
        totalPages: 2,
        totalElements: 2,
        size: 1,
        first: false,
      });

    const { result } = renderHook(() => useLeaves({ status: 'all', scope: 'self' }));

    await waitFor(() => {
      expect(result.current.leaves.length).toBe(1);
    });

    expect(result.current.hasMore).toBe(true);

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.leaves.length).toBe(2);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.current.leaves).toEqual([...mockLeaves, ...mockLeaves]);
    expect(result.current.hasMore).toBe(false);
  });

  test('should set error when API call fails with Error object', async () => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockRejectedValue(new Error('failed to fetch'));
    const { result } = renderHook(() => useLeaves({ status: 'all', scope: 'self' }));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('failed to fetch');
  });

  test('should set generic error when API call fails with non-Error value', async () => {
    vi.spyOn(leaveApi, 'fetchLeaves').mockRejectedValue('Failed to load your leaves');
    const { result } = renderHook(() => useLeaves({ status: 'all', scope: 'self' }));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Failed to load your leaves');
    expect(result.current.leaves).toEqual([]);
  });
});
