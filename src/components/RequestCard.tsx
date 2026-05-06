import type { RequestResponse } from '@/types/request';
import { formatEnumLabel } from '@/utils/formateEnumLabel';
import React from 'react';

type RequestCardProps = {
  request: RequestResponse;
};

function RequestCard({ request }: RequestCardProps): React.JSX.Element {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md ">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-card-foreground">{request.employeeName}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <p>
            <span className="font-semibold">Type : </span>
            {formatEnumLabel(request.type)}
          </p>
          <p>
            <span className="font-semibold text-gray-800">Duration : </span>
            {formatEnumLabel(request.duration)}
          </p>
          <p>
            <span className="font-semibold text-gray-800">Applied Date : </span>
            {new Date(request.appliedDate).toLocaleDateString()}
          </p>
          <p>
            <span className="font-semibold text-gray-800">Leave Date : </span>
            {new Date(request.date).toLocaleDateString()}
          </p>
          {request.leaveCategory && (
            <p>
              <span className="font-semibold text-gray-800">Category : </span>
              {request.leaveCategory}
            </p>
          )}
        </div>

        <div className="mt-2 flex flex-col">
          <p className="font-semibold text-gray-800 mb-1 text-sm">Description : </p>
          <p className="text-sm text-gray-600 leading-relaxed">{request.description}</p>
        </div>
      </div>
    </div>
  );
}

export default RequestCard;
