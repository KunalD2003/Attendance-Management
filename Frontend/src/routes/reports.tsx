import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { FileText, Download, Search, MapPin, Image, Eye, X } from 'lucide-react';
import { useGetAttendanceQuery, useLazyExportExcelQuery, useLazyExportPdfQuery } from '@/store/api';
import type { AttendanceRecord } from '@/store/types';

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
});

function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const { data } = useGetAttendanceQuery();
  const [triggerPdfExport, { isFetching: pdfLoading }] = useLazyExportPdfQuery();
  const [triggerExcelExport, { isFetching: excelLoading }] = useLazyExportExcelQuery();
  const records = data?.records ?? [];

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (searchUser && !r.userName.toLowerCase().includes(searchUser.toLowerCase())) return false;
      return true;
    });
  }, [records, dateFrom, dateTo, searchUser]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    const blob = await triggerPdfExport({ from: dateFrom || undefined, to: dateTo || undefined }).unwrap();
    downloadBlob(blob, 'attendance-report.pdf');
  };

  const handleExportExcel = async () => {
    const blob = await triggerExcelExport({ from: dateFrom || undefined, to: dateTo || undefined }).unwrap();
    downloadBlob(blob, 'attendance-report.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Reports</h1>
        <div className="flex gap-2">
          <button onClick={handleExportPdf} disabled={pdfLoading} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
            <Download className="h-4 w-4" /> {pdfLoading ? 'Exporting...' : 'Export PDF'}
          </button>
          <button onClick={handleExportExcel} disabled={excelLoading} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            <FileText className="h-4 w-4" /> {excelLoading ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search User</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              className="w-full h-9 rounded-lg bg-input border border-border pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Filter by name..."
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="mt-1 block h-9 rounded-lg bg-input border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="mt-1 block h-9 rounded-lg bg-input border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Punch In</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Punch Out</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hours</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Selfie</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{r.userName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3 text-foreground tabular-nums">{r.punchIn ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground tabular-nums">{r.punchOut ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-foreground tabular-nums">{r.hoursWorked.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      {r.status === 'completed' ? 'Completed' : 'Incomplete'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.selfieUrl ? (
                      <img src={r.selfieUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <Image className="h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.latitude ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {r.latitude.toFixed(2)}, {r.longitude?.toFixed(2)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedRecord(r)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      title="View punch details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[85vh] overflow-y-auto glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">Punch Details</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedRecord.userName} - {selectedRecord.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Punch In</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Punch Out</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Selfie</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedRecord.punchSessions ?? []).map((session, index) => (
                    <tr key={session.id} className="border-b border-border/50">
                      <td className="px-4 py-3 text-foreground">{index + 1}</td>
                      <td className="px-4 py-3 text-foreground tabular-nums">{session.punchIn ?? '—'}</td>
                      <td className="px-4 py-3 text-foreground tabular-nums">{session.punchOut ?? '—'}</td>
                      <td className="px-4 py-3">
                        {session.selfieUrl ? (
                          <img src={session.selfieUrl} alt={`Selfie ${index + 1}`} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <Image className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {session.latitude != null ? `${session.latitude.toFixed(4)}, ${session.longitude?.toFixed(4)}` : '—'}
                      </td>
                    </tr>
                  ))}
                  {(selectedRecord.punchSessions ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No session-level punches found for this day.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}