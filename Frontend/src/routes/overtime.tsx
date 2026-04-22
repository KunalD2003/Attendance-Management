import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useAppSelector } from '@/store';
import {
  useGetAttendanceQuery,
  useGetOvertimeRequestsQuery,
  useRequestOvertimeMutation,
  useReviewOvertimeRequestMutation,
} from '@/store/api';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export const Route = createFileRoute('/overtime')({
  component: OvertimePage,
});

function OvertimePage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: attendanceData } = useGetAttendanceQuery();
  const { data: overtimeData, refetch } = useGetOvertimeRequestsQuery();
  const [requestOvertime, { isLoading: requesting }] = useRequestOvertimeMutation();
  const [reviewRequest, { isLoading: reviewing }] = useReviewOvertimeRequestMutation();
  const [reasonByAttendance, setReasonByAttendance] = useState<Record<string, string>>({});

  const records = attendanceData?.records ?? [];
  const requests = overtimeData?.requests ?? [];

  const requestByAttendance = useMemo(() => {
    const map = new Map<string, (typeof requests)[number]>();
    requests.forEach((req) => {
      if (req.attendanceId) map.set(req.attendanceId, req);
    });
    return map;
  }, [requests]);

  const eligibleRecords = useMemo(
    () =>
      records
        .filter((record) => record.overtimeHours > 0)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [records]
  );

  const isEmployee = user?.role === 'employee';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Overtime</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEmployee ? 'Submit your overtime requests' : 'Review and approve overtime requests'}
        </p>
      </div>

      {isEmployee && (
        <div className="glass-card rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Request Overtime</h2>
          <div className="space-y-4">
            {eligibleRecords.map((record) => {
              const existingRequest = requestByAttendance.get(record.id);
              return (
                <div key={record.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">{record.date}</div>
                      <div className="text-xs text-muted-foreground">
                        OT: {record.overtimeHours.toFixed(2)}h | In: {record.punchIn ?? '-'} | Out: {record.punchOut ?? '-'}
                      </div>
                    </div>
                    {existingRequest ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          existingRequest.status === 'approved'
                            ? 'bg-success/10 text-success'
                            : existingRequest.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {existingRequest.status}
                      </span>
                    ) : null}
                  </div>
                  {!existingRequest && (
                    <div className="flex items-center gap-3">
                      <input
                        value={reasonByAttendance[record.id] ?? ''}
                        onChange={(event) =>
                          setReasonByAttendance((prev) => ({ ...prev, [record.id]: event.target.value }))
                        }
                        placeholder="Enter overtime reason"
                        className="flex-1 h-9 rounded-lg bg-input border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        disabled={requesting || !(reasonByAttendance[record.id] ?? '').trim()}
                        onClick={async () => {
                          await requestOvertime({
                            attendanceId: record.id,
                            hours: record.overtimeHours,
                            reason: (reasonByAttendance[record.id] ?? '').trim(),
                          }).unwrap();
                          setReasonByAttendance((prev) => ({ ...prev, [record.id]: '' }));
                          await refetch();
                        }}
                        className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                      >
                        Submit
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {eligibleRecords.length === 0 && (
              <p className="text-sm text-muted-foreground">No overtime-eligible attendance records found.</p>
            )}
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          {isEmployee ? 'My Overtime Requests' : 'Pending Overtime Requests'}
        </h2>
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div>
                <div className="text-sm font-medium text-foreground">{request.userName}</div>
                <div className="text-xs text-muted-foreground">
                  {request.date} • {request.hours.toFixed(2)}h • {request.reason}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {request.status === 'pending' && !isEmployee ? (
                  <>
                    <button
                      disabled={reviewing}
                      onClick={async () => {
                        await reviewRequest({ id: request.id, status: 'approved' }).unwrap();
                        await refetch();
                      }}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      disabled={reviewing}
                      onClick={async () => {
                        await reviewRequest({ id: request.id, status: 'rejected' }).unwrap();
                        await refetch();
                      }}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                ) : (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      request.status === 'approved'
                        ? 'bg-success/10 text-success'
                        : request.status === 'rejected'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-warning/10 text-warning'
                    }`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {request.status}
                  </span>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-sm text-muted-foreground">No overtime requests available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
