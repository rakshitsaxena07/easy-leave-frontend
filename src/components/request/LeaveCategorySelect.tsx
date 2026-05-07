import useLeaveCategories from '@/hooks/useLeaveCategories';
import SelectField from '../form/SelectField';
import type { FormikHelpers } from 'formik';
import type { RaiseRequestFormValues } from '@/types/request';
import { useEffect } from 'react';

const LeaveCategorySelect = ({
  required = false,
  setFieldValue,
}: {
  required?: boolean;
  setFieldValue: FormikHelpers<RaiseRequestFormValues>['setFieldValue'];
}): React.JSX.Element => {
  const { categories } = useLeaveCategories();
  const annualLeaveCategory = categories.find((c) => c.name === 'Annual Leave');

  useEffect(() => {
    if (annualLeaveCategory) {
      setFieldValue('leaveCategoryId', annualLeaveCategory.id);
    }
  }, [annualLeaveCategory, setFieldValue]);

  return (
    <div className="cursor-not-allowed [&_select]:cursor-not-allowed">
      <SelectField
        name="leaveCategoryId"
        id="leaveCategoryId"
        label="Category"
        required={required}
        options={[{ value: annualLeaveCategory?.id ?? '', label: 'Annual Leave' }]}
        disabled
      />
    </div>
  );
};

export default LeaveCategorySelect;
