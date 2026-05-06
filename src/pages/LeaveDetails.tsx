import { cancelLeave, fetchLeaveById, updateLeave } from '@/api/leave.api';
import LeaveForm from '@/components/leave/LeaveForm';
import Loading from '@/components/Loading';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import useLeaveCategories from '@/hooks/useLeaveCategories';
import type { LeaveCategoryResponse } from '@/types/leaveCategory';
import type { LeaveFormValues } from '@/types/leaveForm';
import type { LeaveResponse } from '@/types/leaves';
import { parseLocalDate } from '@/utils/date';
import { buildUpdatePayload } from '@/utils/leaveForm';
import { isAxiosError } from 'axios';
import { startOfMonth } from 'date-fns';
import type { FormikHelpers } from 'formik';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const LeaveDetails = (): React.JSX.Element => {
  const [leave, setLeave] = useState<LeaveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();
  const { categories } = useLeaveCategories();
  const navigate = useNavigate();

  const fetchLeaveDetails = async (id: string | undefined) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchLeaveById(id);
      setLeave(data);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveDetails(id);
  }, [id]);

  const handleUpdateLeave = async (
    values: LeaveFormValues,
    { resetForm }: FormikHelpers<LeaveFormValues>,
  ): Promise<void> => {
    const leaveData = buildUpdatePayload(values, updateLeaveInitialValues);

    if (Object.keys(leaveData).length === 0) {
      toast.error('No changes made. At least one field must be provided to update the leave');
      return;
    }

    try {
      await updateLeave(id, leaveData);
      toast.success('Leave updated successfully!');
      resetForm();
      navigate('/leave');
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Leave updation failed');
      } else {
        toast.error('Unexpected Error Occurred');
      }
    }
  };

  const handleCancelLeave = async () => {
    try {
      await cancelLeave(id);
      toast.success('Leave cancelled successfully.');
      navigate('/leave');
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to cancel leave');
      } else {
        toast.error('Failed to cancel leave');
      }
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !leave) {
    return (
      <div className="text-center py-6 text-xl font-bold tracking-tight text-foreground">
        Leave not found
      </div>
    );
  }

  const leaveDate = new Date(leave.date);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  leaveDate.setHours(0, 0, 0, 0);

  const firstDayOfCurrentMonth = startOfMonth(today);
  const isBeforeCurrentMonth = leaveDate < firstDayOfCurrentMonth;
  const isPastOrToday = leaveDate <= today;

  const matchedCategory: LeaveCategoryResponse | undefined = categories.find(
    (category) => category.name === leave.type,
  );

  const updateLeaveInitialValues: LeaveFormValues = {
    leaveCategoryId: matchedCategory?.id || '',
    holidayId: '',
    dateRange: { from: parseLocalDate(leave.date), to: parseLocalDate(leave.date) },
    duration: leave.duration,
    startTime: leave.startTime,
    description: leave.reason,
    leaveType: 'regular',
  };

  return (
    <div className="w-full p-3">
      <Button variant="outline" className="w-max mb-4 cursor-pointer" onClick={() => navigate(-1)}>
        <ArrowLeft /> Back
      </Button>

      <PageHeader pageTitle="Leave Details" pageSubtitle="View and manage your leave details" />

      <div className="w-full lg:max-w-1/2 flex bg-white rounded-2xl shadow-xs border border-neutral-200 h-full">
        <LeaveForm
          initialValues={updateLeaveInitialValues}
          onSubmit={handleUpdateLeave}
          submitLabel="Update Leave"
          datePickerMode="single"
          handleCancelLeave={handleCancelLeave}
          cancelLabel="Cancel Leave"
          disableSubmit={isBeforeCurrentMonth}
          disableCancel={isPastOrToday}
        />
      </div>
    </div>
  );
};

export default LeaveDetails;
