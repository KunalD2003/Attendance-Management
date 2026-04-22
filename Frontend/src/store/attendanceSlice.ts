import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AttendanceRecord, OvertimeRequest } from './types';
import { api } from './api';
import { logout } from './authSlice';

interface AttendanceState {
  records: AttendanceRecord[];
  overtimeRequests: OvertimeRequest[];
  currentSession: {
    punchIn: string | null;
    selfieUrl: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

const initialState: AttendanceState = {
  records: [],
  overtimeRequests: [],
  currentSession: null,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setAttendanceRecords(state, action: PayloadAction<AttendanceRecord[]>) {
      state.records = action.payload;
      const todayKey = new Date().toISOString().split('T')[0];
      const active = action.payload.find((record) => record.date === todayKey && record.status === 'active');
      state.currentSession = active
        ? {
            punchIn: active.punchIn,
            selfieUrl: active.selfieUrl,
            latitude: active.latitude,
            longitude: active.longitude,
          }
        : null;
    },
    setOvertimeRequests(state, action: PayloadAction<OvertimeRequest[]>) {
      state.overtimeRequests = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => initialState)
      .addMatcher(api.endpoints.getAttendance.matchFulfilled, (state, action) => {
        state.records = action.payload.records;
        const todayKey = new Date().toISOString().split('T')[0];
        const active = action.payload.records.find((record) => record.date === todayKey && record.status === 'active');
        state.currentSession = active
          ? {
              punchIn: active.punchIn,
              selfieUrl: active.selfieUrl,
              latitude: active.latitude,
              longitude: active.longitude,
            }
          : null;
      })
      .addMatcher(api.endpoints.getOvertimeRequests.matchFulfilled, (state, action) => {
        state.overtimeRequests = action.payload.requests;
      })
      .addMatcher(api.endpoints.punchIn.matchFulfilled, (state, action) => {
        const attendance = action.payload.attendance;
        state.currentSession = {
          punchIn: attendance.punchIn,
          selfieUrl: attendance.selfieUrl,
          latitude: attendance.latitude,
          longitude: attendance.longitude,
        };
      })
      .addMatcher(api.endpoints.punchOut.matchFulfilled, (state) => {
        state.currentSession = null;
      });
  },
});

export const { setAttendanceRecords, setOvertimeRequests } = attendanceSlice.actions;
export default attendanceSlice.reducer;