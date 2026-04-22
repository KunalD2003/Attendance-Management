# Full-Stack MERN Attendance System

Real-time attendance management with role-based access, live selfie punch flow, location tracking, overtime workflow, and report exports (PDF/Excel).

## Tech Stack

- Frontend: React + Vite + TanStack Router + Redux Toolkit + RTK Query
- Backend: Node.js + Express.js
- Database: MongoDB (Mongoose)
- Media: Cloudinary (selfie uploads)
- Logging: Morgan + Winston

## Project Structure

- `Frontend/` - UI app, role-based dashboards, punch, reports, exports
- `Backend/` - API server, auth/RBAC, attendance, overtime, report generation
- `render.yaml` - Render deployment config for backend

## Features Implemented

- Secure login and signup with JWT auth
- Role-based access control for employee/manager/admin
- Punch in with live captured selfie + geolocation
- Punch out with working hours and overtime calculation
- Overtime request + manager/admin review workflow
- Role-scoped report access and export to PDF/Excel
- Admin user listing
- Backend request validation (Joi)
- Optional geofencing on punch-in (env driven)

## Local Setup

### 1) Clone and install

```bash
git clone <your-repo-url>
cd D-Table-Task
```

### 2) Backend setup

```bash
cd Backend
npm install
copy .env.example .env
```

Set values in `Backend/.env`:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLIENT_URL` (frontend URL)

Optional geofence values:

- `GEOFENCE_ENABLED=true|false`
- `OFFICE_LATITUDE`
- `OFFICE_LONGITUDE`
- `GEOFENCE_RADIUS_METERS`

Seed demo users (optional):

```bash
npm run seed
```

Run backend:

```bash
npm run dev
```

### 3) Frontend setup

```bash
cd ../Frontend
npm install
copy .env.example .env
```

Set `Frontend/.env`:

- `VITE_API_URL=http://localhost:5000/api`

Run frontend:

```bash
npm run dev
```

## API Overview

- Auth
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Attendance
  - `GET /api/attendance`
  - `POST /api/attendance/punch-in`
  - `POST /api/attendance/punch-out`
- Overtime
  - `GET /api/overtime`
  - `POST /api/overtime`
  - `PATCH /api/overtime/:id/review`
- Reports
  - `GET /api/reports/pdf`
  - `GET /api/reports/excel`
- Users
  - `GET /api/users` (admin)

## Architecture Notes

- JWT auth with `Authorization: Bearer <token>`
- Role checks handled via middleware
- Joi middleware validates body/query params before controllers
- Attendance is normalized per user/day
- Selfies are uploaded to Cloudinary from base64 payload
- Reports are generated server-side:
  - PDF via `pdfkit`
  - Excel via `xlsx`

## Deployment

### Backend on Render

- `render.yaml` is included at repo root
- Connect GitHub repo to Render
- Render will create `attendance-backend` service using `Backend/`
- Configure secret env vars in Render dashboard

### Frontend on Vercel

- `Frontend/vercel.json` is included
- Import `Frontend` project in Vercel
- Set env var:
  - `VITE_API_URL=<your-render-backend-url>/api`

## Assumptions

- Selfie capture is from browser camera and sent as base64 image.
- Manager’s team is identified by `managerId` on user documents.
- If geofencing is enabled, punch-in is denied outside configured radius.
- Employee can export only own report data because backend enforces role scope.
