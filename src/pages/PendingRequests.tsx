import Loading from '@/components/Loading';
import PageHeader from '@/components/PageHeader';
import RequestCard from '@/components/RequestCard';
import useRequest from '@/hooks/useRequest';
import React, { useState } from 'react';

function PendingRequests(): React.JSX.Element {
  const [page, setPage] = useState<number>(0);

  const { requests, loading, loadingMore, error, hasMore } = useRequest({
    status: 'PENDING',
    scope: 'ORGANIZATION',
    page,
  });

  const onLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && page === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <div className="w-full p-4 rounded-md bg-red-100 text-red-700">{error}</div>;
  }

  return (
    <div className="w-full flex flex-col p-4 gap-4 bg-gray-50">
      <PageHeader
        pageTitle="Pending Request(s)"
        pageSubtitle="Review and manage all employee requests"
      />

      {!loading && requests.length === 0 && (
        <div className="w-full flex items-center justify-center py-10">
          No Pending Request(s) Found
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>

      {hasMore && (
        <div className="flex items-center justify-center py-4">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-5 py-2 bg-sidebar hover:bg-sidebar/80 text-white rounded-md disabled:opacity-50 cursor-pointer"
          >
            {loadingMore ? <Loading /> : 'Show More'}
          </button>
        </div>
      )}
    </div>
  );
}

export default PendingRequests;
