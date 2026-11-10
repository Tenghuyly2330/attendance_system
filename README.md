# Student Attendance Management System – Full Stack Website

A modern, responsive, high-reliability **Student Attendance Management Website** designed for automated attendance tracking in schools and universities. Students mark attendance without needing a login or logout by entering their Student ID Card Number and capturing a live face verification photo via the browser MediaDevices API. A separate, feature-packed Admin Dashboard provides real-time statistics, CSV exports, class management, student CRUD, and photo verification logs.

---

## Architecture Overview

```
student-attendance/
├── frontend/                     # React.js + Vite + Tailwind CSS Kiosk & Admin Client
│   ├── src/
│   │   ├── components/           # Navbar, CameraCapture, StudentCard, StatCard
│   │   ├── hooks/                # useCamera (MediaDevices API wrapper & track cleanup)
│   │   ├── pages/                # Attendance, Success, NotFound, AlreadySubmitted, Admin
│   │   ├── services/             # Axios API client & endpoints
│   │   ├── App.jsx               # React Router navigation
│   │   ├── main.jsx              # Application bootstrap
│   │   └── index.css             # Tailwind CSS & animations
│   ├── nginx.conf                # Production SPA Nginx configuration
│   ├── Dockerfile                # Multi-stage production Docker build
│   └── package.json
├── backend/                      # Node.js + Express.js + PostgreSQL MVC REST API
│   ├── config/                   # db.js (PostgreSQL pool, auto-migration, SSL)
│   ├── controllers/              # Student, Attendance, Class, Admin controllers
│   ├── middleware/               # Multer photo upload, JWT auth, Error handlers
│   ├── routes/                   # API routes (/api/students, /api/attendance, etc.)
│   ├── scripts/                  # seed.js (Schema initialization & sample data)
│   ├── uploads/                  # Persistent storage for profile and face photos
│   │   ├── profiles/
│   │   └── attendance/
│   ├── init.sql                  # PostgreSQL table schemas, constraints & seed
│   ├── server.js                 # Express server entry point
│   ├── Dockerfile                # Container definition
│   └── package.json
├── admin_dashboard/              # Standalone Admin Portal (alternative preview port 3001)
├── docker-compose.yml            # Multi-container orchestration (DB, API, Frontend)
├── .env.example                  # Environment configuration template
└── README.md                     # Comprehensive documentation
```

---

## 1. Key Features

- **No Student Login Required**: Students can mark attendance swiftly at a touchscreen or kiosk terminal using only their Student ID Card Number.
- **Monochrome Black & White Design**: Clean, modern, high-contrast black and white styling across all pages, cards, modals, and buttons.
- **Zero-Scroll Step Switching**: Steps 1, 2, and 3 switch cleanly in place without vertical scrolling:
  - **Step 1**: Student ID Card search & Class Directory lookup.
  - **Step 2**: Verified student info & automatic camera activation.
  - **Step 3**: Captured face photo preview, attendance summary, and one-click submission.
- **Direct Camera Activation**: Camera opens automatically when entering Step 2 without needing an extra click.
- **Class Directory Table with First-Letter Avatars**: Students who forget their ID can view a class-grouped table with first-letter circular avatars to find and select their card number.
- **Cloudinary Face Storage (`attendance_image`)**: Captured face photos are uploaded directly to Cloudinary in the `attendance_image` folder, with secure URLs saved in PostgreSQL.
- **Real Working Camera Preview**: Powered by HTML5 `navigator.mediaDevices.getUserMedia` with:
  - Automatic front-facing camera selection (`facingMode: "user"`).
  - Live video preview stream with silhouette face alignment guide.
  - HTML5 Canvas frame capture to JPEG blob.
  - Instant captured photo preview and retake option.
  - Automatic track cleanup upon page exit to ensure camera privacy.
  - Clear error detection for camera permission denied or devices without webcams.
- **Strict Server-Side Validation**:
  - Validates that the student ID exists in PostgreSQL.
  - Verifies a live face photo has been captured.
  - Enforces single attendance submission per student per calendar day (duplicate prevention via SQL `UNIQUE (student_id, attendance_date)` constraint and controller checks).
  - Attendance date and time are generated on the server (client timestamps are not trusted).
  - Automated status classification: Submissions after 08:30 AM are marked as `Late`, otherwise `Present`.
- **Separate Admin Dashboard**:
  - Live KPI cards: Total Students, Total Attendance Today, Absent Students, Late Students, Turnout Percentage.
  - Attendance log table with filters for Date, Class, Status, and Search.
  - Modal viewer for inspection of high-resolution captured face photos.
  - Student Directory management: Add, edit, delete students with profile photos.
  - Academic Class management.
  - One-click attendance export to CSV.
  - Admin authentication with bcrypt password hashing and JWT token authorization.

---

## 2. Sample Student Test Data

| Student ID | Full Name | Class | Sample Notes |
|---|---|---|---|
| `STU-1001` | John Anderson | Grade 10-A | High School Sophomore |
| `STU-1002` | Emily Watson | Grade 10-A | High School Sophomore |
| `STU-1003` | Michael Chang | Grade 10-B | High School Sophomore |
| `STU-1004` | Sophia Rodriguez | Grade 11-A | High School Junior |
| `STU-1005` | David Kim | Grade 12-Science | High School Senior |

**Default Admin Credentials:**
- **Username**: `admin`
- **Password**: `admin123`

---

## 3. Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- PostgreSQL (Local instance or Cloud PostgreSQL like Neon/Supabase)

### Step 1: Clone and Configure Environment
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

If using cloud PostgreSQL (e.g. Neon DB), set `DB_URL` in `backend/.env`:
```env
DB_URL="postgresql://username:password@host/database?sslmode=require"
PORT=5000
JWT_SECRET=attendance_management_secret_key_2026
```

### Step 2: Install Dependencies & Seed Database
```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Seed database schema and sample records
npm run seed

# 3. Start Backend Server (runs on http://localhost:5000)
npm run dev
```

### Step 3: Start the Frontend Client
In a new terminal window:
```bash
# 1. Install Frontend Dependencies
cd frontend
npm install

# 2. Start Vite Development Server (runs on http://localhost:3000)
npm run dev
```

Open your browser to [http://localhost:3000](http://localhost:3000).

---

## 4. Docker Compose Deployment

To run the complete stack (PostgreSQL database, Node.js backend, and Nginx-powered React frontend) using Docker Compose:

```bash
docker-compose up --build -d
```

### Checking Services Status
```bash
docker-compose ps
```

### Accessing the Applications
- **Frontend Kiosk**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **PostgreSQL Database**: `localhost:5432` (`attendance_db`)

### Stopping the Services
```bash
docker-compose down -v
```

---

## 5. API Endpoints Reference

### Health Check
- `GET /api/health`
  - Returns backend and PostgreSQL connectivity status.

### Student Management
- `GET /api/students/:studentId`
  - Looks up student by ID card number (e.g., `STU-1001`).
  - Returns student info and whether attendance was already marked today.
  - Returns 404: `"Student ID Not Found. Please Check Your Student ID Card."`
- `GET /api/students`
  - Returns all students with optional `?search=` and `?class_name=` filters.
- `POST /api/students`
  - Creates a new student profile (supports `multipart/form-data` with `profile_photo`).
- `PUT /api/students/:id`
  - Updates student information.
- `DELETE /api/students/:id`
  - Deletes a student and their attendance history.

### Attendance Management
- `POST /api/attendance`
  - Submits attendance.
  - Body: `student_id` (string), `face_photo` (file).
  - Returns 201 on success.
  - Returns 400 if already submitted today: `"Attendance Already Submitted Today."`
- `GET /api/attendance/today`
  - Returns all attendance records logged today with student details.
- `GET /api/attendance/student/:studentId`
  - Returns attendance history for a single student.
- `GET /api/attendance`
  - Filtered list: `?date=YYYY-MM-DD`, `?class_name=...`, `?status=Present|Late`, `?search=...`.
- `GET /api/attendance/export/csv`
  - Exports matching attendance records into a downloadable `.csv` file.

### Admin Operations
- `POST /api/admin/login`
  - Validates `username` and `password`. Returns JWT token.
- `GET /api/admin/stats`
  - Returns summary KPI metrics and attendance breakdown per class.
- `GET /api/classes`
  - Lists all academic classes with enrolled student counts.
- `POST /api/classes`
  - Creates a new class.
- `DELETE /api/classes/:id`
  - Deletes a class (if no students are enrolled).

---

## 6. API Testing Examples (cURL & PowerShell)

### 1. Backend Health Check
```bash
curl -i http://localhost:5000/api/health
```
**Expected Output:**
```json
{
  "status": "ok",
  "service": "student-attendance-backend",
  "uptime_seconds": 120,
  "timestamp": "2026-11-10T02:47:03.986Z",
  "database": {
    "status": "connected",
    "time": "2026-11-10T02:47:04.287Z"
  }
}
```

### 2. Search Existing Student
```bash
curl -i http://localhost:5000/api/students/STU-1001
```
**Expected Output:**
```json
{
  "success": true,
  "student": {
    "id": 1,
    "student_id": "STU-1001",
    "full_name": "John Anderson",
    "class_name": "Grade 10-A",
    "profile_photo": "/uploads/profiles/stu-1001.svg"
  },
  "already_submitted_today": false,
  "today_attendance": null
}
```

### 3. Search Non-Existent Student
```bash
curl -i http://localhost:5000/api/students/STU-9999
```
**Expected Output (HTTP 404):**
```json
{
  "success": false,
  "message": "Student ID Not Found. Please Check Your Student ID Card."
}
```

### 4. Submit Attendance with Photo Upload
```bash
curl -X POST http://localhost:5000/api/attendance \
  -F "student_id=STU-1002" \
  -F "face_photo=@backend/uploads/profiles/stu-1002.svg;type=image/png"
```
**Expected Output (HTTP 201):**
```json
{
  "success": true,
  "message": "Attendance Submitted Successfully.",
  "attendance": {
    "id": 2,
    "student_id": "STU-1002",
    "attendance_date": "2026-11-10",
    "attendance_time": "09:47:38",
    "face_photo": "/uploads/attendance/att_STU-1002_1794278858640.svg",
    "status": "Late",
    "full_name": "Emily Watson",
    "class_name": "Grade 10-A"
  }
}
```

### 5. Attempt Duplicate Attendance Submission
Submitting again for the same student on the same day:
```bash
curl -X POST http://localhost:5000/api/attendance \
  -F "student_id=STU-1002" \
  -F "face_photo=@backend/uploads/profiles/stu-1002.svg;type=image/png"
```
**Expected Output (HTTP 400):**
```json
{
  "success": false,
  "message": "Attendance Already Submitted Today.",
  "attendance": {
    "id": 2,
    "attendance_date": "2026-11-10",
    "attendance_time": "09:47:38"
  }
}
```

---

## 7. Troubleshooting

| Symptom | Cause | Solution |
|---|---|---|
| **"Camera permission denied"** in browser | Browser blocked camera access | Click the lock/tune icon in the browser address bar, set **Camera** to **Allow**, and refresh. |
| **"No camera device detected"** | Computer does not have a webcam or driver is missing | Connect an external webcam or test in a browser on a device equipped with a front camera. |
| **"Student ID Not Found"** | ID has not been registered in the database | Check the Student Directory in the Admin Dashboard at `/admin` or use a demo ID: `STU-1001` through `STU-1005`. |
| **"Attendance Already Submitted Today"** | Student already recorded attendance for the current calendar date | Only one submission per student per day is allowed. The recorded time is shown on the screen. |
| **Database connection error** | PostgreSQL service stopped or credentials incorrect | Verify `DB_URL` in `backend/.env` or confirm the Docker PostgreSQL container is healthy via `docker-compose ps`. |
| **Uploads 404 image error** | Static upload folder missing | Verify that `backend/uploads/profiles` and `backend/uploads/attendance` exist. Run `npm run seed` in `backend/` to regenerate demo assets. |

---

## 8. Security & Privacy Highlights

- **Privacy-Conscious Verification**: Photo capture is stored strictly for visual audit verification and is **not** subjected to biometric facial recognition scanning.
- **No Student Credentials Stored**: Students do not have passwords to leak; the kiosk is purely self-service.
- **SQL Injection Prevention**: All queries use parameterized statements (`$1, $2, ...`) via the PostgreSQL driver.
- **Admin Protection**: Admin management endpoints are secured via JSON Web Tokens (JWT) and passwords are saved using industry-standard `bcrypt` hashes with 10 salt rounds.
- **File Upload Protection**: Multer limits uploads to valid images (`JPEG`, `PNG`, `WebP`) with a strict 5MB size ceiling and sanitized filenames.

