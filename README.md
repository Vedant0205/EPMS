# Educational Progress Monitoring System (EPMS)

A complete, full-stack, responsive web application engineered for educational institutions to monitor students' academic progress, attendance records, course completion milestones, and video-based learning activities.

---

## 🌟 Key Capabilities & Features

### 1. Dual Role Architecture (Student & Teacher Dashboards)
- **Role-Based Access Control**: Strict route guards ensuring students cannot access faculty tooling and vice-versa.
- **Stateless JWT Security**: Secure password hashing with bcrypt, JSON Web Tokens with expiry, and role verification middleware.

### 2. Student Portal
- **Overview Telemetry**:
  - Enrolled Courses Count
  - Completed Courses Count (100% finished)
  - In-Progress Courses Count
  - Institutional Attendance Percentage
  - Overall Learning Progress
- **Video Learning Player**:
  - HTML5 video player with seekable controls
  - Module playlist with completion checkmarks
  - Previous and Next lesson quick navigation
  - Automatic watch position resume (picks up exactly where the student left off)
  - **Strict Progress Calculation Formula**:
    $$\text{Course Completion \%} = \left(\frac{\text{Completed Lessons}}{\text{Total Lessons}}\right) \times 100$$
- **Personal Attendance Management**:
  - Present, Absent, and Leave count metrics
  - Interactive monthly calendar with color-coded status badges:
    - 🟢 **Green**: Present
    - 🔴 **Red**: Absent
    - 🟡 **Amber**: Excused Leave
  - Complete historical log with filtering by course
- **Notifications & Warning Desk**:
  - Real-time teacher notices categorized by urgency
  - 1-click **Acknowledge Warning** action with custom response notes

### 3. Teacher Portal
- **Live Command Telemetry**:
  - Total Active Students
  - Total Courses
  - Class-wide Average Attendance Rate
  - Class-wide Average Course Completion Rate
  - Students Flagged At Risk
  - Status Distribution Chart (Recharts Pie & Bar analytics)
- **Student Roster Management**:
  - Multi-parameter search (Name, ID, Email)
  - Filters by Course, Attendance status (<75%, >=75%), Completion percentage, and Risk category
  - Deep-dive student profiles comparing individual metrics against class cohort benchmarks
- **Interactive Attendance Marking**:
  - Course and date selection (defaults to current date)
  - Radio toggle for Present, Absent, and Leave per student
  - **Duplicate Prevention Guarantee**: Compound unique index (`student + course + date`) prevents duplicate entries
  - 1-click **Mark All Present** batch action
- **Academic Warning System**:
  - Warning categories: *Low Attendance*, *Low Course Completion*, *Inactive Student*, *Missing Lessons*, *General Warning*
  - Priority levels: *High*, *Medium*, *Low*
  - Direct dispatch to student notification feeds
  - Registry of dispatched warnings with status tracking (*active*, *acknowledged*, *resolved*)
- **Course & Lesson Curriculum Manager**:
  - Create and edit courses with custom thumbnails and metadata
  - Add video lessons and modules with duration and order
  - Immediate enrollment tracking
- **Configurable Risk Identification Engine**:
  - Customizable thresholds for automatic early warnings:
    - Attendance threshold (default: 75%)
    - Course completion threshold (default: 40%)
    - Inactivity threshold (default: 7 days)
- **Reports & Exporting**:
  - Interactive monthly attendance trend area chart
  - Course completion comparison bar charts
  - One-click **Export to CSV** for registrar spreadsheets
  - Audit-ready printable layout

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React Icons, Recharts, Axios, React Router 6, React Hot Toast |
| **Backend** | Node.js, Express.js, REST APIs, Multer (file upload), CORS, Dotenv |
| **Database** | MongoDB with Mongoose (with built-in high-performance zero-config persistent JSON storage fallback) |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs password hashing, Role-based route guards |

---

## 📋 Demo Credentials

The database comes pre-seeded with realistic educational data:

| Role | Name | Email | Password | Identifier | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Faculty / Teacher** | Dr. Sarah Jenkins | `teacher@epms.edu` | `Password123!` | `TCH-1001` | Active Faculty |
| **Student (High Achiever)** | Alex Rivera | `student1@epms.edu` | `Password123!` | `STU-2001` | On Track (90% Completion, 95% Att) |
| **Student (Consistent)** | Priya Sharma | `student2@epms.edu` | `Password123!` | `STU-2002` | On Track (100% Completion, 100% Att) |
| **Student (Moderate)** | Marcus Johnson | `student5@epms.edu` | `Password123!` | `STU-2005` | Needs Attention (55% Completion, 78% Att) |
| **Student (Declining)** | Sophia Taylor | `student6@epms.edu` | `Password123!` | `STU-2006` | Needs Attention (45% Completion, 76% Att) |
| **Student (At Risk)** | Daniel Martinez | `student7@epms.edu` | `Password123!` | `STU-2007` | **At Risk** (20% Completion, 55% Att, 9d Inactive) |
| **Student (At Risk)** | Olivia Brown | `student8@epms.edu` | `Password123!` | `STU-2008` | **At Risk** (25% Completion, 60% Att, 12d Inactive) |
| **Student (At Risk)** | Noah Wilson | `student9@epms.edu` | `Password123!` | `STU-2009` | **At Risk** (30% Completion, 50% Att, 8d Inactive) |
| **Student (Active)** | Ava Davis | `student10@epms.edu` | `Password123!` | `STU-2010` | Needs Attention (50% Completion, 80% Att) |

*Quick login tip: On the login page, 1-click demo buttons are provided to instantly populate credentials!*

---

## 🚀 Quick Start (1-Click Automated Launchers)

For Windows, double-click either launcher in the project root:
- **`start-epms.bat`** *(Recommended)* or **`start-epms.exe`**: Automatically checks Node.js/npm, installs any missing dependencies, terminates stale port locks, boots the Express backend (Port 5000), boots the Vite React frontend (Port 5173), waits until ready, and opens `http://localhost:5173` in your default browser.
- **`stop-epms.bat`**: 1-click clean shutdown script that frees ports 5000 and 5173.
- **`create-desktop-shortcut.bat`**: Creates an `EPMS` shortcut directly on your Windows Desktop for instant launching.

---

## 💻 Manual Installation & Running Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Optional: MongoDB instance (or MongoDB Atlas connection string). If no MongoDB server is detected, EPMS automatically operates using its built-in persistent datastore in `/backend/data/`.

### 1. Setup Backend
```bash
cd backend
npm install
node seed/seedData.js
npm start
```
The backend starts at `http://localhost:5000`.

### 2. Setup Frontend
```bash
cd ../epms-frontend
npm install
npm run dev
```
The frontend starts at `http://localhost:5173`.

### 3. Run End-to-End Test Suite
To verify all 12 key system workflows:
```bash
cd backend
node test/workflowTest.js
```

---

## 🌐 API Documentation Reference

### Authentication Endpoints
- `POST /api/auth/register`: Register new student or teacher
- `POST /api/auth/login`: Authenticate user and receive JWT bearer token
- `GET /api/auth/me`: Get active session user details (Protected)
- `POST /api/auth/forgot-password`: Generate password recovery instructions

### Student Portal Endpoints
- `GET /api/student/dashboard`: Full student metrics, enrolled courses, attendance overview, and recent activity
- `GET /api/attendance/my-attendance`: Personal attendance history and calendar data
- `GET /api/warnings/my-warnings`: Academic notices issued to the student
- `PUT /api/warnings/:id/acknowledge`: Acknowledge warning with optional student note

### Teacher Portal Endpoints
- `GET /api/teacher/dashboard`: Overview cards, cohort distribution, and quick at-risk list
- `GET /api/teacher/students`: Searchable, filterable student management roster
- `GET /api/teacher/students/:studentId`: Comprehensive student deep-dive with cohort benchmarks
- `GET /api/teacher/settings`: Fetch automated risk identification rules
- `PUT /api/teacher/settings`: Configure risk thresholds (attendance %, completion %, inactivity days)

### Course & Video Learning Endpoints
- `GET /api/courses`: List courses with enrollment and completion telemetry
- `GET /api/courses/:id`: Course details with modules, lessons, and student progress
- `POST /api/courses`: Create a new course (Teacher only)
- `PUT /api/courses/:id`: Update course information (Teacher only)
- `DELETE /api/courses/:id`: Delete course and associated records (Teacher only)
- `GET /api/lessons/:id`: Fetch lesson video stream and last watch position
- `POST /api/lessons/:id/heartbeat`: Update video watching progress in real time
- `POST /api/lessons/:id/complete`: Mark lesson completed and recalculate course percentage

### Attendance Endpoints
- `GET /api/attendance/course/:courseId`: Retrieve date-specific course attendance roster
- `POST /api/attendance/mark`: Save or update bulk attendance records (with duplicate prevention)

### Warnings & Notifications Endpoints
- `POST /api/warnings`: Issue formal warning to student
- `GET /api/warnings/teacher`: List all dispatched warnings and acknowledgment statuses
- `PUT /api/warnings/:id/resolve`: Mark an academic warning as resolved
- `GET /api/notifications`: Retrieve user notification feed with unread counter
- `PUT /api/notifications/:id/read`: Mark single notification as read
- `PUT /api/notifications/read-all`: Mark all notifications as read

### Reports & Export Endpoints
- `GET /api/reports/analytics`: Aggregated metrics for Recharts visual analytics
- `GET /api/reports/export/csv`: Stream downloadable CSV audit report

---

## 🔒 Security Implementation
1. **Password Hashing**: Bcrypt with salt factor 10.
2. **Stateless Authorization**: JWT signed tokens verified on every protected API call.
3. **Role Guards**: Strict validation checking `user.role === 'teacher'` or `'student'`.
4. **Duplicate Protection**: Unique index guarantees on student attendance records per date.
5. **Sanitized Input**: Input trimming, type coercion, and validation before persistence.
