import type { FormikErrors } from 'formik';
import type { LeaveFormValues } from '@/types/leaveForm';
import type { UpdateLeaveRequest } from '@/types/leaves';
import { format } from 'date-fns';
import type { HolidayResponse } from '@/types/holiday';

export const validateLeaveForm = (values: LeaveFormValues): FormikErrors<LeaveFormValues> => {
  const errors: FormikErrors<LeaveFormValues> = {};

  if (values.leaveType === 'holiday') {
    if (!values.holidayId) {
      errors.holidayId = 'Please select a holiday';
    }
  } else {
    if (!values.leaveCategoryId) {
      errors.leaveCategoryId = 'Leave category is required';
    }

    if (!values.dateRange || !values.dateRange.from) {
      errors.dateRange = 'Please choose a date';
    }

    if (!values.description.trim()) {
      errors.description = 'Leave Description is required';
    }

    if (values.description.length > 1000) {
      errors.description = 'Leave Description cannot be over 1000 characters';
    }
  }
  return errors;
};

const buildHolidayUpdatePayload = (
  updatedValues: LeaveFormValues,
  original: LeaveFormValues,
  holidays: HolidayResponse[] = [],
): Partial<UpdateLeaveRequest> => {
  const payload: Partial<UpdateLeaveRequest> = {};

  if (updatedValues.holidayId !== original.holidayId) {
    const selectedHoliday = holidays.find((holiday) => holiday.id === updatedValues.holidayId);
    payload.holidayId = updatedValues.holidayId;
    payload.date = selectedHoliday?.date;
    payload.description = selectedHoliday?.name;
  }

  if (updatedValues.startTime !== original.startTime) {
    payload.startTime = updatedValues.startTime;
  }

  return payload;
};

const buildRegularUpdatePayload = (
  updatedValues: LeaveFormValues,
  original: LeaveFormValues,
): Partial<UpdateLeaveRequest> => {
  const payload: Partial<UpdateLeaveRequest> = {};

  if (updatedValues.leaveCategoryId !== original.leaveCategoryId) {
    payload.leaveCategoryId = updatedValues.leaveCategoryId;
  }

  const newDate = updatedValues.dateRange?.from
    ? format(updatedValues.dateRange.from, 'yyyy-MM-dd')
    : '';
  const oldDate = original.dateRange?.from ? format(original.dateRange.from, 'yyyy-MM-dd') : '';
  if (newDate && newDate !== oldDate) {
    payload.date = newDate;
  }

  if (updatedValues.duration !== original.duration) {
    payload.duration = updatedValues.duration;
  }

  if (updatedValues.startTime !== original.startTime) {
    payload.startTime = updatedValues.startTime;
  }

  if (updatedValues.description !== original.description) {
    payload.description = updatedValues.description;
  }

  return payload;
};

export const buildUpdatePayload = (
  updatedValues: LeaveFormValues,
  original: LeaveFormValues,
  holidays: HolidayResponse[] = [],
): Partial<UpdateLeaveRequest> => {
  return updatedValues.leaveType === 'holiday'
    ? buildHolidayUpdatePayload(updatedValues, original, holidays)
    : buildRegularUpdatePayload(updatedValues, original);
};
