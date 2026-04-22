import { StatCard } from '@/components/StatCard';
import { Users, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useGetAttendanceQuery, useGetOvertimeRequestsQuery, useReviewOvertimeRequestMutation } from '@/store/api';

export function ManagerDashboard() {
  const { data: attendanceData } = useGetAttendanceQuery();
  const { data: overtimeData, refetch } = useGetOvertimeRequestsQuery();
  const [reviewRequest] = useReviewOvertimeRequestMutation();
  const records = attendanceData?.records ?? [];
  const otRequests = overtimeData?.requests ?? [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = useMemo(() => records.filter(r => r.date === todayStr), [records, todayStr]);
  const uniqueUsers = new Set(records.map(r => r.userId)).size;
  const pendingOT = otRequests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Team Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your team's attendance and overtime</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Team Members" value={uniqueUsers} icon={Users} />
        <StatCard label="Present Today" value={todayRecords.length} icon={CheckCircle2} trend={{ value: `${todayRecords.length} active`, positive: true }} />
        <StatCard label="Late Today" value={todayRecords.filter(r => r.punchIn && r.punchIn > '09:15').length} icon={AlertTriangle} />
        <StatCard label="Pending OT" value={pendingOT.length} subtitle="Awaiting approval" icon={Clock} />
      </div>

      {/* Team attendance */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Today's Team Attendance</h2>
        <div className="space-y-3">
          {todayRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records for today yet.</p>
          ) : todayRecords.map(r => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{r.userName.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{r.userName}</div>
                  <div className="text-xs text-muted-foreground">In: {r.punchIn} • Out: {r.punchOut ?? 'Active'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground tabular-nums">{r.hoursWorked.toFixed(2)}h</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  r.status === 'completed' ? 'bg-success/10 text-success' : r.status === 'active' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                }`}>
                  {r.status === 'completed' ? 'Full Shift' : r.status === 'active' ? 'Active' : 'Incomplete'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OT Requests */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Overtime Requests</h2>
        <div className="space-y-3">
          {otRequests.map(req => (
            <div key={req.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div>
                <div className="text-sm font-medium text-foreground">{req.userName}</div>
                <div className="text-xs text-muted-foreground">{req.date} • {req.hours.toFixed(2)}h • {req.reason}</div>
              </div>
              <div className="flex items-center gap-2">
                {req.status === 'pending' ? (
                  <>
                    <button
                      onClick={async () => { await reviewRequest({ id: req.id, status: 'approved' }).unwrap(); await refetch(); }}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={async () => { await reviewRequest({ id: req.id, status: 'rejected' }).unwrap(); await refetch(); }}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                ) : (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    req.status === 'approved' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {req.status === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}