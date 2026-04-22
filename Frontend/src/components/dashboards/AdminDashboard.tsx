import { StatCard } from '@/components/StatCard';
import { Users, Clock, TrendingUp, CalendarCheck, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { useGetAttendanceQuery, useGetOvertimeRequestsQuery } from '@/store/api';

export function AdminDashboard() {
  const { data: attendanceData } = useGetAttendanceQuery();
  const { data: overtimeData } = useGetOvertimeRequestsQuery();
  const records = attendanceData?.records ?? [];
  const otRequests = overtimeData?.requests ?? [];

  const uniqueUsers = new Set(records.map(r => r.userId)).size;
  const totalHours = useMemo(() => records.reduce((sum, r) => sum + r.hoursWorked, 0), [records]);
  const completedCount = records.filter(r => r.status === 'completed').length;
  const incompleteCount = records.filter(r => r.status === 'incomplete').length;
  const totalOT = records.reduce((sum, r) => sum + r.overtimeHours, 0);

  // Per-user summary
  const userSummary = useMemo(() => {
    const map = new Map<string, { name: string; hours: number; days: number; completed: number }>();
    records.forEach(r => {
      const existing = map.get(r.userId) ?? { name: r.userName, hours: 0, days: 0, completed: 0 };
      existing.hours += r.hoursWorked;
      existing.days += 1;
      if (r.status === 'completed') existing.completed += 1;
      map.set(r.userId, existing);
    });
    return Array.from(map.entries());
  }, [records]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System-wide attendance overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Users" value={uniqueUsers} icon={Users} />
        <StatCard label="Total Hours" value={totalHours.toFixed(1)} icon={Clock} />
        <StatCard label="Full Shifts" value={completedCount} icon={CalendarCheck} trend={{ value: `${completedCount}`, positive: true }} />
        <StatCard label="Incomplete" value={incompleteCount} icon={AlertTriangle} />
        <StatCard label="Total OT" value={`${totalOT.toFixed(1)}h`} icon={TrendingUp} />
        <StatCard label="OT Requests" value={otRequests.length} icon={ShieldCheck} />
      </div>

      {/* User summary */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">All Users Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Days Logged</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total Hours</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Completed</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Completion %</th>
              </tr>
            </thead>
            <tbody>
              {userSummary.map(([id, data]) => (
                <tr key={id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{data.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-foreground">{data.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground tabular-nums">{data.days}</td>
                  <td className="px-4 py-3 text-foreground tabular-nums">{data.hours.toFixed(2)}h</td>
                  <td className="px-4 py-3 text-foreground tabular-nums">{data.completed}/{data.days}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(data.completed / data.days) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{Math.round((data.completed / data.days) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All records */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Recent Attendance Records</h2>
        <div className="space-y-2">
          {records.slice(-10).reverse().map(r => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{r.userName.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{r.userName}</div>
                  <div className="text-xs text-muted-foreground">{r.date} • {r.punchIn} — {r.punchOut}</div>
                </div>
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
    </div>
  );
}