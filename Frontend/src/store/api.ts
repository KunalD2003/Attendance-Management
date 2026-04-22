import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AttendanceRecord, OvertimeRequest, User, UserRole } from './types';

type AuthResponse = { token: string; user: User };
type AttendanceResponse = { attendance: AttendanceRecord };
type AttendanceListResponse = { records: AttendanceRecord[] };
type OvertimeListResponse = { requests: OvertimeRequest[] };
type OvertimeResponse = { request: OvertimeRequest };
type UsersResponse = { users: User[] };
type UserResponse = { user: User };
type GeofenceResponse = {
  enabled: boolean;
  validConfig: boolean;
  officeLatitude: number;
  officeLongitude: number;
  radiusMeters: number;
};

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Auth', 'Attendance', 'Overtime', 'Users'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    signup: builder.mutation<
      AuthResponse,
      { name: string; email: string; password: string; role?: UserRole; department?: string }
    >({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    me: builder.query<{ user: User }, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    getAttendance: builder.query<AttendanceListResponse, { from?: string; to?: string; userId?: string } | void>({
      query: (params) => ({ url: '/attendance', params }),
      providesTags: ['Attendance'],
    }),
    getGeofenceConfig: builder.query<GeofenceResponse, void>({
      query: () => '/attendance/geofence',
    }),
    punchIn: builder.mutation<AttendanceResponse, { selfieBase64: string; latitude: number | null; longitude: number | null }>({
      query: (body) => ({ url: '/attendance/punch-in', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),
    punchOut: builder.mutation<AttendanceResponse, void>({
      query: () => ({ url: '/attendance/punch-out', method: 'POST' }),
      invalidatesTags: ['Attendance'],
    }),
    getOvertimeRequests: builder.query<OvertimeListResponse, void>({
      query: () => '/overtime',
      providesTags: ['Overtime'],
    }),
    requestOvertime: builder.mutation<OvertimeResponse, { attendanceId: string; hours: number; reason: string }>({
      query: (body) => ({ url: '/overtime', method: 'POST', body }),
      invalidatesTags: ['Overtime', 'Attendance'],
    }),
    reviewOvertimeRequest: builder.mutation<OvertimeResponse, { id: string; status: 'approved' | 'rejected' }>({
      query: ({ id, status }) => ({ url: `/overtime/${id}/review`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Overtime', 'Attendance'],
    }),
    getUsers: builder.query<UsersResponse, void>({
      query: () => '/users',
      providesTags: ['Users'],
    }),
    updateMyProfile: builder.mutation<UserResponse, { name: string; department: string }>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['Auth', 'Users'],
    }),
    createEmployee: builder.mutation<UserResponse, { name: string; email: string; password: string; role: 'employee' | 'manager'; department?: string; managerId?: string | null }>({
      query: (body) => ({ url: '/users/employees', method: 'POST', body }),
      invalidatesTags: ['Users'],
    }),
    updateEmployee: builder.mutation<UserResponse, { id: string; name?: string; role?: 'employee' | 'manager'; department?: string; managerId?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/users/employees/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Users'],
    }),
    deleteEmployee: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({ url: `/users/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Users'],
    }),
    exportPdf: builder.query<Blob, { from?: string; to?: string; userId?: string } | void>({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({ url: '/reports/pdf', params: arg, responseHandler: (response) => response.blob() });
        if (result.error) return { error: result.error };
        return { data: result.data as Blob };
      },
    }),
    exportExcel: builder.query<Blob, { from?: string; to?: string; userId?: string } | void>({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({ url: '/reports/excel', params: arg, responseHandler: (response) => response.blob() });
        if (result.error) return { error: result.error };
        return { data: result.data as Blob };
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useMeQuery,
  useGetAttendanceQuery,
  useGetGeofenceConfigQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useGetOvertimeRequestsQuery,
  useRequestOvertimeMutation,
  useReviewOvertimeRequestMutation,
  useGetUsersQuery,
  useUpdateMyProfileMutation,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useLazyExportPdfQuery,
  useLazyExportExcelQuery,
} = api;
