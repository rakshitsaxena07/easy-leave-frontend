import React from 'react';
import { Formik, Form, type FormikHelpers } from 'formik';
import { Button } from '@/components/ui/button';
import { addHours } from '@/utils/time';
import type { LeaveFormValues } from '@/types/leaveForm';
import { validateLeaveForm } from '@/utils/leaveForm';
import { FULL_DAY_DURATION_HOURS, HALF_DAY_DURATION_HOURS } from '@/constants/leaveForm';
import SelectField from '@/components/form/SelectField';
import useLeaveCategories from '@/hooks/useLeaveCategories';
import useHolidays from '@/hooks/useHolidays';
import DatePickerField from '@/components/form/DatePickerField';
import TextareaField from '@/components/form/TextareaField';
import TimeField from '@/components/form/TimeField';
import { TriangleAlert } from 'lucide-react';
import { startOfMonth } from 'date-fns';

type LeaveFormProps = {
  initialValues: LeaveFormValues;
  onSubmit: (
    values: LeaveFormValues,
    helpers: FormikHelpers<LeaveFormValues>,
  ) => void | Promise<void>;
  submitLabel?: string;
  datePickerMode?: 'range' | 'single';
  handleCancelLeave?: () => void;
  cancelLabel?: string;
  disableSubmit?: boolean;
  disableCancel?: boolean;
};

const LeaveForm = ({
  initialValues,
  onSubmit,
  submitLabel = 'Submit Leave',
  datePickerMode = 'range',
  handleCancelLeave,
  cancelLabel = 'Cancel Leave',
  disableSubmit = false,
  disableCancel = false,
}: LeaveFormProps): React.JSX.Element => {
  const { categories, loading, error } = useLeaveCategories();
  const { holidays, loading: holidaysLoading, error: holidaysError } = useHolidays('OPTIONAL');

  const filteredHolidays = holidays.filter((holiday) => {
    const holidayDate = new Date(holiday.date);
    const firstDayOfCurrentMonth = startOfMonth(new Date());
    return holidayDate >= firstDayOfCurrentMonth;
  });

  const holidayOptions = filteredHolidays.map((holiday) => ({
    value: holiday.id,
    label: `${holiday.name} (${holiday.date})`,
  }));

  const durationOptions = [
    { value: 'FULL_DAY', label: 'Full Day' },
    { value: 'HALF_DAY', label: 'Half Day' },
  ];

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validate={(values) => validateLeaveForm(values)}
      enableReinitialize
    >
      {({ isSubmitting, values }) => (
        <Form className="flex flex-col gap-4 p-4 w-full">
          <SelectField
            name="leaveType"
            id="leaveType"
            label="Leave Type"
            options={[
              { value: 'regular', label: 'Regular Leave' },
              { value: 'holiday', label: 'Optional Holiday' },
            ]}
            required={true}
          />

          {values.leaveType === 'holiday' ? (
            <SelectField
              name="holidayId"
              id="holidayId"
              label="Select Optional Holiday"
              options={holidayOptions}
              loading={holidaysLoading}
              error={holidaysError}
              placeholder="Choose a holiday"
              required={true}
            />
          ) : (
            <SelectField
              name="leaveCategoryId"
              id="leaveCategoryId"
              label="Leave Category"
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
              loading={loading}
              error={error}
              placeholder="Select a category"
              required={true}
            />
          )}

          {values.leaveType !== 'holiday' && (
            <DatePickerField
              name="dateRange"
              label="Date"
              mode={datePickerMode}
              value={values.dateRange}
              required={true}
            />
          )}

          {values.leaveType !== 'holiday' && (
            <SelectField
              name="duration"
              id="duration"
              label="Duration"
              options={durationOptions}
              required={true}
            />
          )}

          <div className="flex justify-between gap-3">
            <TimeField
              name="startTime"
              id="startTime"
              label="Start Time"
              disabled={false}
              className="bg-gray-50 cursor-text"
              required={true}
            />
            <TimeField
              name="endTime"
              id="endTime"
              label="End Time"
              disabled
              value={
                values.duration === 'FULL_DAY'
                  ? addHours(values.startTime, FULL_DAY_DURATION_HOURS)
                  : addHours(values.startTime, HALF_DAY_DURATION_HOURS)
              }
              className="cursor-not-allowed"
            />
          </div>

          {values.leaveType !== 'holiday' && (
            <TextareaField
              name="description"
              id="description"
              label="Leave Description"
              placeholder="Describe your reason for leave..."
              required={true}
            />
          )}

          <Button
            type="submit"
            disabled={isSubmitting || disableSubmit}
            className="w-full bg-(--technogise-blue) cursor-pointer py-5"
          >
            {submitLabel}
          </Button>

          {handleCancelLeave && (
            <div className="flex flex-col gap-2">
              <Button
                className="w-full cursor-pointer py-5"
                type="button"
                variant="destructive"
                onClick={handleCancelLeave}
                disabled={disableCancel}
              >
                {cancelLabel}
              </Button>
              {!disableCancel && (
                <div className="flex gap-2 p-2 text-sm text-gray-800">
                  <TriangleAlert size={18} />
                  Cancelling leave cannot be undone.
                </div>
              )}
            </div>
          )}
        </Form>
      )}
    </Formik>
  );
};

export default LeaveForm;
