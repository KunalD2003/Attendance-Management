import { useAppSelector } from '@/store';
import { StatCard } from '@/components/StatCard';
import { Clock, CalendarCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { useGetAttendanceQuery, useGetOvertimeRequestsQuery, useRequestOvertimeMutation } from '@/store/api';

export function EmployeeDashboard() {
  const user = useAppSelector(s => s.auth.user);
  const { data } = useGetAttendanceQuery();
  const { data: overtimeData, refetch: refetchOvertime } = useGetOvertimeRequestsQuery();
  const [requestOvertime] = useRequestOvertimeMutation();
  const records = data?.records ?? [];
  const overtimeRequests = overtimeData?.requests ?? [];
  const todayKey = new Date().toISOString().split('T')[0];
  const activeRecord = records.find(r => r.date === todayKey && r.status === 'active');
  const currentSession = activeRecord ? { punchIn: activeRecord.punchIn } : null;

  const myRecords = useMemo(() => records.filter(r => r.userId === user?.id), [records, user]);
  const totalHours = useMemo(() => myRecords.reduce((sum, r) => sum + r.hoursWorked, 0), [myRecords]);
  const totalOT = useMemo(() => myRecords.reduce((sum, r) => sum + r.overtimeHours, 0), [myRecords]);
  const completedDays = myRecords.filter(r => r.status === 'completed').length;
  const incompleteDays = myRecords.filter(r => r.status === 'incomplete').length;
  const requestedAttendanceIds = new Set(overtimeRequests.map((request) => request.attendanceId));
  const eligibleOtRecords = myRecords.filter((record) => record.overtimeHours > 0 && !requestedAttendanceIds.has(record.id));

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your attendance overview</p>
      </div>

      {currentSession && (
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-success flex items-center gap-3">
          <Clock className="h-5 w-5 text-success" />
          <span className="text-sm text-foreground">
            You are currently clocked in since <span className="font-semibold text-success">{currentSession.punchIn}</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Hours" value={totalHours.toFixed(1)} subtitle="This week" icon={Clock} />
        <StatCard label="Completed" value={completedDays} subtitle="Full shifts (≥8h)" icon={CalendarCheck} trend={{ value: `${completedDays} days`, positive: true }} />
        <StatCard label="Incomplete" value={incompleteDays} subtitle="Short shifts (<8h)" icon={AlertTriangle} />
        <StatCard label="Overtime" value={`${totalOT.toFixed(1)}h`} subtitle="Extra hours" icon={TrendingUp} trend={{ value: `${totalOT.toFixed(1)}h OT`, positive: totalOT > 0 }} />
      </div>

      {/* Weekly bar chart */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Weekly Attendance</h2>
        <div className="space-y-3">
          {weekDays.map((day, i) => {
            const record = myRecords[i];
            const hours = record?.hoursWorked ?? 0;
            const pct = Math.min(100, (hours / 10) * 100);
            return (
              <div key={day} className="flex items-center gap-4">
                <span className="w-10 text-sm font-medium text-muted-foreground">{day}</span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${hours >= 8 ? 'bg-primary' : 'bg-warning'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-sm tabular-nums text-foreground text-right">{hours.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent records */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Recent Records</h2>
        <div className="space-y-2">
          {myRecords.slice(-5).reverse().map(r => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <div className="text-sm text-foreground">{r.date}</div>
                <div className="text-xs text-muted-foreground">{r.punchIn} — {r.punchOut}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground tabular-nums">{r.hoursWorked.toFixed(2)}h</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  r.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  {r.status === 'completed' ? 'Completed' : 'Incomplete'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Overtime Requests</h2>
        <div className="space-y-3">
          {eligibleOtRecords.slice(0, 5).map((record) => (
            <div key={record.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="text-sm text-foreground">{record.date} • {record.overtimeHours.toFixed(2)}h OT</div>
              <button
                onClick={async () => {
                  const reason = window.prompt('Enter OT reason');
                  if (!reason) return;
                  await requestOvertime({ attendanceId: record.id, hours: record.overtimeHours, reason }).unwrap();
                  await refetchOvertime();
                }}
                className="inline-flex items-center px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
              >
                Request OT
              </button>
            </div>
          ))}
          {eligibleOtRecords.length === 0 && (
            <p className="text-sm text-muted-foreground">No pending overtime requests to submit.</p>
          )}
        </div>
      </div>
    </div>
  );
}