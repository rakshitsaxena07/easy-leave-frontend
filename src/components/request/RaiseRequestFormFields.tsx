import { Form, type FormikHelpers } from 'formik';
import { useEffect, useRef } from 'react';
import type { Matcher } from 'react-day-picker';
import { subDays } from 'date-fns';
import SelectField from '../form/SelectField';
import DatePickerField from '../form/DatePickerField';
import TimeField from '../form/TimeField';
import TextareaField from '../form/TextareaField';
import { Button } from '../ui/button';
import type { RaiseRequestFormValues } from '@/types/request';
import { addHours } from '@/utils/time';
import { FULL_DAY_DURATION_HOURS, HALF_DAY_DURATION_HOURS } from '@/constants/leaveForm';
import LeaveCategorySelect from './LeaveCategorySelect';

const now = new Date();
const thirtyDays = subDays(now, 30);

const pastLeaveDisabled: Matcher[] = [
  { before: thirtyDays },
  { after: subDays(now, 1) },
  { dayOfWeek: [0, 6] },
];

const compOffDisabled: Matcher[] = [
  { before: thirtyDays },
  { after: subDays(now, 1) },
  { dayOfWeek: [1, 2, 3, 4, 5] },
];

const RaiseRequestFormFields = ({
  isSubmitting,
  values,
  setFieldValue,
}: {
  isSubmitting: boolean;
  values: RaiseRequestFormValues;
  setFieldValue: FormikHelpers<RaiseRequestFormValues>['setFieldValue'];
}): React.JSX.Element => {
  const isPastLeave = values.requestType === 'PAST_LEAVE';

  const prevRequestType = useRef(values.requestType);
  useEffect(() => {
    if (prevRequestType.current !== values.requestType) {
      setFieldValue('leaveCategoryId', '');
      setFieldValue('dateRange', undefined);
      setFieldValue('description', '');
      prevRequestType.current = values.requestType;
    }
  }, [values.requestType, setFieldValue]);

  return (
    <Form className="flex flex-col gap-4 p-4 w-full">
      <SelectField
        name="requestType"
        id="requestType"
        label="Type"
        required
        options={[
          { value: 'PAST_LEAVE', label: 'Past Leave' },
          { value: 'COMPENSATORY_OFF', label: 'Compensatory Off' },
        ]}
        placeholder="Select request type"
      />

      {isPastLeave && <LeaveCategorySelect required setFieldValue={setFieldValue} />}

      {values.requestType !== '' && (
        <>
          <DatePickerField
            name="dateRange"
            label="Date"
            mode={isPastLeave ? 'range' : 'single'}
            value={values.dateRange}
            disabledDays={isPastLeave ? pastLeaveDisabled : compOffDisabled}
            required
          />

          <SelectField
            name="duration"
            id="duration"
            label="Duration"
            required
            options={[
              { value: 'FULL_DAY', label: 'Full Day' },
              { value: 'HALF_DAY', label: 'Half Day' },
            ]}
          />

          <div className="flex justify-between gap-3">
            <TimeField name="startTime" id="startTime" label="Start Time" required />

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
            />
          </div>
        </>
      )}

      <TextareaField
        name="description"
        id="description"
        label="Reason"
        required
        placeholder={'Provide a reason for your request...'}
      />

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-(--technogise-blue) cursor-pointer py-5"
      >
        Raise Request
      </Button>
    </Form>
  );
};

export default RaiseRequestFormFields;
