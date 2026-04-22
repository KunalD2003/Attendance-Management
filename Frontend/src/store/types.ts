export type UserRole = 'employee' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  punchIn: string | null;
  punchOut: string | null;
  selfieUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  hoursWorked: number;
  status: 'completed' | 'incomplete' | 'absent' | 'active';
  overtimeHours: number;
  punchSessions?: {
    id: string;
    punchIn: string | null;
    punchOut: string | null;
    selfieUrl: string | null;
    latitude: number | null;
    longitude: number | null;
  }[];
}

export interface OvertimeRequest {
  id: string;
  attendanceId?: string;
  userId: string;
  userName: string;
  date: string;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}