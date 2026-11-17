# Educational Progress Monitoring System (EPMS)
## Comprehensive Technical Architecture & Viva Examination Guide

---

## 1. Executive Summary & Project Overview

### 1.1 Project Title
**Educational Progress Monitoring System (EPMS)** — An Autonomous Dual-Role Academic Analytics, Attendance Tracking & Early Intervention Platform.

### 1.2 Problem Statement
In traditional higher education institutions:
- Student academic distress (low attendance, lagging lecture completion, disengagement) is often discovered **too late**—typically after semester mid-terms or final exams.
- Attendance records, lecture progression, and academic interventions are managed in fragmented spreadsheets or manual paper registers, resulting in human error and data latency.
- Faculty lack a centralized, real-time telemetry dashboard that highlights which students need intervention and enables immediate early warnings with acknowledgment loops.

### 1.3 Proposed Solution
EPMS provides an integrated, full-stack educational monitoring platform featuring:
1. **Real-Time Telemetry & Progress Engine:** Automatically recalculates course completion rates as students watch and complete video modules.
2. **Attendance Management System:** Daily session tracking with automatic duplicate prevention and aggregate metric calculations.
3. **Automated Risk Engine:** Continuously analyzes student attendance, module completion, and activity metrics to classify students into **On Track (🟢)**, **Needs Attention (🟡)**, or **At Risk (🔴)**.
4. **Early Warning & Intervention Protocol:** Allows teachers to dispatch structured warnings directly to students with mandatory feedback and acknowledgment tracking.
5. **Role-Based Access Control (RBAC):** Strict isolation between Teacher and Student dashboards and API routes using JSON Web Tokens (JWT).

---

## 2. Complete Technology Stack & Architecture

### 2.1 Technology Stack Matrix

| Layer | Technology | Version | Engineering Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React** with **TypeScript** | React 18 / TS 5.x | Type safety, reusable component lifecycle, virtual DOM for instant UI updates, and zero runtime type errors. |
| **Frontend Tooling** | **Vite** | 5.4.x | Instant Hot Module Replacement (HMR) powered by native ES modules; rapid build times compared to Webpack. |
| **Styling & Design System** | **Tailwind CSS** + **Lucide React** | Tailwind 3.4.x | Utility-first CSS ensuring strict visual consistency, zero stylesheet bloat, dark/light theme support, and anti-slop institutional palette. |
| **Animation & Transitions** | **Framer Motion** | 11.x | Declarative, GPU-accelerated layout and entry animations for menus, drawers, and modal overlays. |
| **Data Visualization** | **Recharts** | 2.13.x | SVG-based responsive data charting (bar charts, area trends, donut gauges) optimized for React component trees. |
| **Backend Runtime** | **Node.js** | 18+ / 20+ LTS | Event-driven, non-blocking asynchronous I/O engine ideal for concurrent telemetry and API requests. |
| **Web Server Framework** | **Express.js** | 4.19.x | Minimal, battle-tested REST API middleware pipeline providing modular routing, error handling, and request lifecycle management. |
| **Authentication & Security** | **JSON Web Tokens (JWT)** & **bcryptjs** | JWT 9.x / Bcrypt 2.4.x | Stateless authentication with signed cryptographic payloads and salted bcrypt hashing (work factor 10) for passwords. |
| **File Upload Handling** | **Multer** | 1.4.5 | Multipart form-data handling with disk storage destination, custom filename hashing, and image MIME-type validation. |
| **Persistence Engine** | **Dual Engine:** MongoDB (Mongoose) + Local Persistent JSON Datastore (`storeEngine.js`) | Mongoose 8.x + Custom Engine | Seamless production deployment to MongoDB Atlas while enabling zero-configuration offline demonstration via persistent file-based JSON storage. |

---

### 2.2 System Architecture Diagram

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                        |
|  +---------------------------------------------------------------------------------+  |
|  |                 Vite + React 18 + TypeScript Application (Port 5173)             |  |
|  |  +-----------------------------------+   +------------------------------------+  |  |
|  |  |         Student Portal            |   |          Teacher Portal            |  |  |
|  |  |  * Course Player & Video Progress |   |  * Cohort Directory & Search       |  |  |
|  |  |  * Attendance Log History         |   |  * Attendance Marking Matrix       |  |  |
|  |  |  * Warning Acknowledgment Feed    |   |  * Early Risk Intervention Panel   |  |  |
|  |  |  * Avatar & Profile Management    |   |  * Course & Lesson Studio          |  |  |
|  |  +-----------------------------------+   +------------------------------------+  |  |
|  +---------------------------------------------------------------------------------+  |
+-------------------------------------------|-------------------------------------------+
                                            | HTTP REST API Requests (Axios + JWT)
                                            v
+---------------------------------------------------------------------------------------+
|                                    BACKEND TIER                                       |
|  +---------------------------------------------------------------------------------+  |
|  |                        Express.js Server (Port 5000)                            |  |
|  |  [Security Headers] -> [Rate Limiter] -> [CORS] -> [Static /uploads File Server] |  |
|  |                                                                                 |  |
|  |  +---------------------------------------------------------------------------+  |  |
|  |  |                               Middleware                                 |  |  |
|  |  |  * authMiddleware (JWT verify) | roleMiddleware (RBAC) | multer (Uploads)  |  |  |
|  |  +---------------------------------------------------------------------------+  |  |
|  |                                                                                 |  |
|  |  +---------------------------------------------------------------------------+  |  |
|  |  |                               Controllers                                 |  |  |
|  |  |  * authController        * courseController       * lessonController     |  |  |
|  |  |  * attendanceController  * warningController      * reportController     |  |  |
|  |  |  * teacherController (Risk Telemetry Engine)     * studentController    |  |  |
|  |  +---------------------------------------------------------------------------+  |  |
|  +---------------------------------------------------------------------------------+  |
+-------------------------------------------|-------------------------------------------+
                                            | Data Abstraction Layer
                                            v
+---------------------------------------------------------------------------------------+
|                                     DATA TIER                                         |
|  +---------------------------------------------+-----------------------------------+  |
|  |           Production Mode                   |        Offline Demo Mode          |  |
|  |        MongoDB Database Engine              |    JSON File Datastore Engine     |  |
|  |         (Mongoose ODM Schemas)              |     (backend/data/*.json Store)   |  |
|  +---------------------------------------------+-----------------------------------+  |
+---------------------------------------------------------------------------------------+
```

---

## 3. Core Methodologies & Business Logic Algorithms

### 3.1 Dynamic Course Completion Algorithm
Unlike naive systems that merely check if an enrollment exists, EPMS tracks progress at the granular lesson level:
1. When a student opens a video lesson, the client emits heartbeat updates to `POST /api/lessons/:id/progress`, storing `watchedSeconds`, `totalDuration`, and `lastPosition`.
2. When the student reaches the completion criteria or marks the lesson complete:
   $$\text{Lesson Status} = \text{"completed"}$$
3. The server immediately queries all lessons belonging to that course:
   $$\text{Total Lessons} = N$$
   $$\text{Completed Lessons} = C$$
   $$\text{Course Progress Percentage} = \min\left(100, \left\lfloor \frac{C}{N} \times 100 \right\rfloor\right)$$
4. The calculated percentage is persisted directly into the student's `Enrollment` document (`completionPercentage`), making cohort analytics instantaneously fast without expensive joins on every read.

---

### 3.2 Attendance Duplicate Prevention & Session Integrity
A frequent real-world bug in academic portals is duplicate attendance marking for the same date:
- **Database Guarantee:** A compound unique index is enforced on `(student, course, date)`.
- **Controller Logic:** In `attendanceController.js`, batch attendance records use an **upsert strategy**:
  ```javascript
  // If record exists for (student + course + date), UPDATE status and remarks.
  // Otherwise, CREATE a new attendance entry.
  ```
- **Result:** Faculty can safely re-open and adjust attendance for a past date without corrupting student attendance totals or inflating day counts.

---

### 3.3 Multi-Factor Academic Risk Detection Engine
The risk telemetry engine runs in `teacherController.js` and assesses students across three objective educational dimensions:

1. **Attendance Benchmark:**
   $$\text{Attendance Rate} = \frac{\text{Present Days} + 0.5 \times \text{Leave Days}}{\text{Total Sessions}} \times 100$$
   - If $\text{Attendance Rate} < 75\% \implies \text{Flag: Low Attendance (< 75\%)}$

2. **Module Progression Benchmark:**
   $$\text{Average Course Completion} = \frac{\sum_{i=1}^{M} \text{Completion}_i}{M}$$
   - If $\text{Average Course Completion} < 60\% \implies \text{Flag: Low Completion (< 60\%)}$

3. **Inactivity / Disengagement Benchmark:**
   $$\Delta t = \text{Current Date} - \text{Student Last Active Date}$$
   - If $\Delta t > 14 \text{ days} \implies \text{Flag: Inactive for over 14 days}$

**Classification Rules:**
- **At Risk (🔴):** Any critical failure (Attendance $<65\%$, Completion $<40\%$, or $\ge 2$ risk flags).
- **Needs Attention (🟡):** Borderline indicators (Attendance between $65\%\text{--}74\%$, Completion between $40\%\text{--}59\%$).
- **On Track (🟢):** All benchmarks satisfied (Attendance $\ge 75\%$, Completion $\ge 60\%$).

---

### 3.4 Early Warning & Acknowledgment Workflow
```
[Teacher Identifies Risk]
         |
         v
[Dispatches Warning] ---> Category: "Low Attendance" | Priority: "High" | Note: "Meet me post class"
         |
         +--------------> Creates Warning Document & In-App Notification
                                 |
                                 v
                     [Student Dashboard Feed Alert]
                                 |
                                 v
                     [Student Submits Acknowledgment] ---> "I was ill; medical certificate attached"
                                 |
                                 v
                     [Status: Acknowledged] (Audit trail visible to both parties)
```

---

## 4. Database Schema Design & Relationships

### 4.1 Entities Overview

1. **User:**
   - Fields: `_id`, `name`, `email`, `identifier` (e.g. `STU-2001`, `TCH-1001`), `password` (bcrypt hash), `role` (`'student'` | `'teacher'`), `department`, `avatar`, `phone`, `lastActive`.
2. **Course:**
   - Fields: `_id`, `title`, `code`, `description`, `department`, `semester`, `teacher` (ObjectId $\to$ User), `teacherName`, `thumbnail`, `isPublished`.
3. **Lesson:**
   - Fields: `_id`, `course` (ObjectId $\to$ Course), `title`, `description`, `videoUrl`, `duration` (seconds), `order`, `resources`.
4. **Enrollment:**
   - Fields: `_id`, `student` (ObjectId $\to$ User), `course` (ObjectId $\to$ Course), `enrolledAt`, `completionPercentage`, `status`.
5. **LessonProgress:**
   - Fields: `_id`, `student` (ObjectId $\to$ User), `lesson` (ObjectId $\to$ Lesson), `course` (ObjectId $\to$ Course), `isCompleted`, `watchedSeconds`, `totalDuration`, `lastPosition`, `updatedAt`.
6. **Attendance:**
   - Fields: `_id`, `student` (ObjectId $\to$ User), `course` (ObjectId $\to$ Course), `date` (YYYY-MM-DD), `status` (`'present'` | `'absent'` | `'leave'`), `markedBy` (ObjectId $\to$ Teacher), `remarks`.
7. **Warning:**
   - Fields: `_id`, `student` (ObjectId $\to$ User), `course` (ObjectId $\to$ Course), `teacher` (ObjectId $\to$ User), `category`, `priority` (`'High'` | `'Medium'` | `'Low'`), `message`, `status` (`'sent'` | `'read'` | `'acknowledged'`), `studentResponse`.
8. **Notification:**
   - Fields: `_id`, `recipient` (ObjectId $\to$ User), `title`, `message`, `type`, `read`, `createdAt`.

---

## 5. Security Architecture & Best Practices

1. **Password Protection:**
   - Bcrypt with **salt rounds = 10**. Plain-text passwords never touch logs, storage, or API responses (`select: -password`).
2. **Stateless JWT Authorization:**
   - Authorization header format: `Bearer <token>`.
   - Token payload contains `{ id, role }`. Signed with secret key and expires after 24 hours.
3. **Role-Based Access Control (RBAC):**
   - Middleware `roleMiddleware(['teacher'])` prevents students from accessing attendance marking, course authoring, or warning dispatch routes.
4. **Security HTTP Headers:**
   - `X-Content-Type-Options: nosniff` (prevents MIME sniffing).
   - `X-Frame-Options: DENY` (prevents clickjacking attacks).
   - `X-XSS-Protection: 1; mode=block` (mitigates reflected cross-site scripting).
5. **In-Memory Rate Limiting:**
   - Auth endpoints are protected against brute-force password guessing by capping requests per IP to 60/min.
6. **Safe File Upload Pipeline:**
   - Profile photos (avatars) are restricted to JPEG, PNG, WEBP, and GIF formats with file size capped at 5 MB. Files are stored with timestamp-salted names in `uploads/avatars/`.

---

## 6. Official Active Personnel Roster

All accounts share the secure demo password: **`Password123!`**

### 6.1 Faculty Accounts (Teachers)
| Name | Identifier | Email | Department |
| :--- | :--- | :--- | :--- |
| **Prof. Anjali Kulkarni** | `TCH-1001` | `prof.anjali@epms.edu` | Computer Science & Engineering |
| **Prof. Yash Vyas** | `TCH-1002` | `prof.yash@epms.edu` | Data Science & Artificial Intelligence |
| **Prof. Annirudh Chavan** | `TCH-1003` | `prof.annirudh@epms.edu` | Software Engineering & Cloud Systems |
| **Prof. Pratibha Jadhav** | `TCH-1004` | `prof.pratibha@epms.edu` | Cybersecurity & Cryptography |
| **Prof. Sabir Bagwan** | `TCH-1005` | `prof.sabir@epms.edu` | Embedded Systems & IoT Engineering |

### 6.2 Student Accounts
| Name | Identifier | Email | Department |
| :--- | :--- | :--- | :--- |
| **Aayush Auti** | `STU-2001` | `aayush@epms.edu` | Computer Science & Engineering |
| **Ayush Koshti** | `STU-2002` | `ayush@epms.edu` | Software Engineering |
| **Atharva Pose** | `STU-2003` | `atharvap@epms.edu` | Data Science & Artificial Intelligence |
| **Atharva Raut** | `STU-2004` | `atharvar@epms.edu` | Information Technology |
| **Siddhesh Durgude** | `STU-2005` | `siddhesh@epms.edu` | Computer Science & Engineering |

---

## 7. Viva Examination Questions & Model Answers

### Category A: General & Architectural Questions

#### Q1: What is EPMS, and what was the motivation behind developing it?
> **Answer:** EPMS stands for **Educational Progress Monitoring System**. The motivation was to solve the critical problem of delayed intervention in academic institutions. Often, faculty discover student learning difficulties or attendance shortages only at the end of a semester when it is too late to remediate. EPMS provides an automated, real-time platform that tracks daily attendance, lecture completion, and video engagement, feeds this data into a multi-factor risk engine, and enables faculty to dispatch actionable early warnings with student acknowledgment tracking.

#### Q2: What architectural style did you choose for EPMS and why?
> **Answer:** We implemented a **Client-Server RESTful Architecture** using a 3-tier model:
> 1. **Client Tier:** React + TypeScript Single Page Application (SPA).
> 2. **Application Tier:** Node.js + Express REST API with modular controllers, routes, and middleware.
> 3. **Data Tier:** Dual-mode persistence engine (MongoDB Mongoose ODM with fallback to a persistent JSON document store).
> 
> *Why this choice?* A RESTful SPA decouples UI presentation from business logic. The backend can serve mobile applications or third-party academic LMS integrations in the future without modifying core logic.

#### Q3: What is the difference between monolithic and microservices architecture, and where does EPMS fit?
> **Answer:** EPMS is currently engineered as a **Modular Monolith**. In a pure microservices architecture, attendance, notifications, and auth would run in independent processes with separate databases, adding network overhead, distributed transaction complexity, and deployment friction. A modular monolith gives us cohesive code organization, direct database transactions, and easy zero-config deployment, while remaining clean enough that individual modules (e.g., Notification Service or Analytics Service) can be extracted into microservices if institutional scale requires it.

---

### Category B: Frontend Engineering (React, Vite, TypeScript)

#### Q4: Why did you choose React over vanilla HTML/JavaScript or Angular?
> **Answer:** React's component-based architecture, virtual DOM reconciliation, and unidirectional data flow make it optimal for dashboards with frequently updating telemetry. Features like real-time video progress updates, interactive cohort filters, and responsive charts require fast, declarative re-rendering without full page reloads.

#### Q5: What benefits did TypeScript provide in this project?
> **Answer:** TypeScript provides compile-time type safety. In EPMS, we defined strict interfaces for `User`, `Course`, `AttendanceRecord`, `RiskMetric`, and `Warning`. This prevented runtime errors such as `undefined` property access, mismatched API response structures, or passing incorrect parameter types between components.

#### Q6: Why Vite instead of Create React App (CRA)?
> **Answer:** Create React App is officially deprecated and relies on Webpack, which bundles the entire application before starting the dev server. Vite uses native ES Modules (ESM) and esbuild (written in Go), enabling cold server starts in under 300ms and near-instant Hot Module Replacement (HMR) regardless of application size.

#### Q7: How does authentication state persist across page reloads on the frontend?
> **Answer:** We use an `AuthContext` provider that wraps the entire React component tree. When a user logs in, the JWT token and user profile are stored in browser `localStorage`. On application mount or page refresh, `AuthContext` reads `localStorage`, verifies the token expiration, sets the default Axios `Authorization: Bearer <token>` header, and restores the logged-in state before child routes render.

#### Q8: How did you implement Protected Routes in React Router?
> **Answer:** We created a `<ProtectedRoute>` wrapper component that checks two conditions:
> 1. `isAuthenticated`: If false, the user is redirected to `/login` with the current location saved in route state.
> 2. `allowedRoles`: If the route requires `'teacher'` and the current user has `'student'`, they are redirected to their authorized dashboard (`/student/dashboard`), enforcing frontend route-level RBAC.

---

### Category C: Backend Engineering (Node.js, Express, REST APIs)

#### Q9: What is Express middleware, and how is it used in EPMS?
> **Answer:** In Express, middleware functions have access to the request (`req`), response (`res`), and the `next` function in the application's request-response cycle. In EPMS, middleware is used for:
> - **Security headers:** Setting nosniff, frame-options, and XSS headers.
> - **Rate limiting:** Throttling authentication requests per IP.
> - **Authentication (`authMiddleware`):** Extracting and verifying the JWT bearer token.
> - **Authorization (`roleMiddleware`):** Restricting route access to specific roles (`teacher` vs `student`).
> - **File uploads (`multer`):** Handling multipart/form-data for avatars.

#### Q10: How do you handle asynchronous operations in Node.js?
> **Answer:** We use modern ES6+ `async/await` syntax with structured `try/catch` blocks. Under the hood, Node.js uses libuv's event loop to handle non-blocking asynchronous operations (file I/O, database queries), allowing the server to handle concurrent user traffic without blocking the main execution thread.

#### Q11: Explain how the attendance duplicate prevention works in the code.
> **Answer:** In `attendanceController.js`, we use an upsert strategy. When marking attendance for a class, the system queries whether a record already exists with the matching `(student, course, date)` tuple. If found, it updates the existing record (`status` and `remarks`); if not found, it creates a new record. This guarantees that attendance totals and day counts remain accurate even if a teacher clicks submit multiple times.

---

### Category D: Database & Data Modeling

#### Q12: Why did you design the system with a dual persistence engine?
> **Answer:** In production environments, EPMS connects to **MongoDB** using Mongoose schemas with indexing and validation. However, for academic evaluations, viva demonstrations, or offline testing, requiring MongoDB service installation often causes setup failures. We implemented a fallback `storeEngine.js` that mirrors Mongoose query syntax (`find`, `findOne`, `findByIdAndUpdate`, `save`) and persists records as formatted JSON files in `backend/data/`. This gives zero-config portability with zero external database dependencies.

#### Q13: What is the relationship between Course, Lesson, and LessonProgress?
> **Answer:**
> - **Course to Lesson:** One-to-Many ($1:N$). A single course has multiple ordered video lessons.
> - **Lesson to LessonProgress:** One-to-Many ($1:N$). Each student has their own unique `LessonProgress` record per lesson.
> - When `LessonProgress.isCompleted` is toggled, the parent `Enrollment` document is updated with the new overall percentage.

#### Q14: What is an index in MongoDB, and which indexes are critical in EPMS?
> **Answer:** An index is a data structure (B-tree) that improves the speed of data retrieval operations on a collection at the cost of additional write time and storage space.
> Critical indexes in EPMS:
> 1. `User.email` (Unique): Fast authentication lookups.
> 2. `Attendance(student, course, date)` (Compound Unique): Prevents duplicate attendance entries.
> 3. `Enrollment(student, course)` (Compound Unique): Ensures a student cannot be enrolled twice in the same course.

---

### Category E: Security & Authorization

#### Q15: How does JWT authentication work step-by-step?
> **Answer:**
> 1. **Login:** Student/Teacher posts email/identifier and password to `/api/auth/login`.
> 2. **Authentication:** Server finds user and verifies password with `bcrypt.compare()`.
> 3. **Token Issuance:** Server generates a signed JWT containing `{ id: user._id, role: user.role }` signed with a secret key and 24-hour expiration.
> 4. **Storage:** Client stores token in `localStorage`.
> 5. **Subsequent Requests:** Client attaches `Authorization: Bearer <token>` to request headers.
> 6. **Verification:** Backend `authMiddleware` intercepts request, calls `jwt.verify()`, and attaches `req.user` to the request object.

#### Q16: Why should passwords never be stored in plain text?
> **Answer:** If a database is breached or leaked, plain-text passwords immediately compromise user accounts across all services where they reuse credentials. By using **bcrypt** with a salt round of 10:
> - Every hash is unique due to the random salt (thwarting rainbow table attacks).
> - Bcrypt is an adaptive key derivation function that is computationally intensive, dramatically slowing down offline brute-force and dictionary attacks.

#### Q17: What is CORS, and why is it necessary?
> **Answer:** CORS stands for **Cross-Origin Resource Sharing**. Browsers enforce the Same-Origin Policy (SOP), which blocks web pages on one origin (e.g., `http://localhost:5173`) from making requests to a different origin (e.g., `http://localhost:5000`). By configuring CORS middleware on Express, the backend explicitly whitelists trusted origins, HTTP methods (`GET`, `POST`, `PUT`, `DELETE`), and headers (`Authorization`, `Content-Type`).

---

### Category F: System Evaluation & Edge Cases

#### Q18: What happens if a teacher deletes a lesson from a course? How is completion recalculated?
> **Answer:** If a lesson is deleted, the total lesson count ($N$) decreases. The system recalculates $C / N$ for all enrolled students so that completion percentages adjust dynamically and do not exceed 100%.

#### Q19: How does the system handle students who are absent on leave?
> **Answer:** In academic regulations, approved leaves should not severely penalize student attendance compared to unexcused absences. In our risk engine, attendance percentage is calculated as:
> $$\text{Score} = \frac{\text{Present Days} + 0.5 \times \text{Leave Days}}{\text{Total Sessions}} \times 100$$
> This provides a fair metric while clearly distinguishing between full presence, excused leave, and unexcused absence.

#### Q20: Can a student mark lessons complete without actually watching them?
> **Answer:** The client player sends heartbeat telemetry recording `watchedSeconds` and `lastPosition`. While students can mark a lesson complete, teachers can view the actual watch time (e.g., "Watched 12m out of 15m") directly in the Student Profile View telemetry, exposing any attempt to bypass video watching.

---

## 8. Step-by-Step Viva Demonstration Workflow

When presenting the project to examiners, execute this structured 5-minute demo:

1. **One-Click Launch:**
   - Double-click `start-epms.bat` (or `start-epms.exe`). Show the automated startup: checks Node.js, starts Backend (5000), starts Frontend (5173), and automatically opens the browser.
2. **Teacher Dashboard & Roster:**
   - Log in as **Prof. Anjali Kulkarni** (`prof.anjali@epms.edu` / `Password123!`).
   - Highlight the **Telemetry Stat Cards**: Total Students, Average Attendance, Average Course Completion, and Students at Risk count.
3. **Student Directory & Filtering:**
   - Open **Student Management**. Demonstrate multi-parameter filtering (by course, attendance $<75\%$, risk status).
   - Show that **Aayush Auti** or **Ayush Koshti** is flagged with actionable risk tags.
4. **Attendance Marking & Duplicate Check:**
   - Open **Attendance Marking**. Select course and date. Mark attendance for students. Submit.
   - Click submit again to demonstrate that the system updates existing records gracefully rather than creating duplicates.
5. **Issue Early Academic Warning:**
   - From the student table or profile view, click **Warn**. Dispatch a High-Priority "Low Attendance" warning with guidance notes.
6. **Student Verification & Acknowledgment:**
   - Log out and log in as the student (e.g. **Aayush Auti** / `aayush@epms.edu` / `Password123!`).
   - Open **Notifications**. Show the incoming early warning alert.
   - Click **Acknowledge**, enter a student response ("I will attend extra remedial sessions"), and submit.
   - Show that the warning status updates to "Acknowledged" for both student and faculty.
7. **Profile & Avatar Management:**
   - Navigate to Student/Teacher Profile. Show editing personal details and uploading a custom photo avatar.

---

## 9. Summary & Future Scope

### 9.1 Achievements
- Zero-config deployment with cross-platform desktop launch support.
- Fully operational end-to-end telemetry and dynamic progress calculation.
- Automated multi-factor early academic risk classification.
- Bidirectional warning-acknowledgment loop.
- Clean, accessible, institutional slate/navy design compliant with modern UX standards.

### 9.2 Future Enhancements
1. **SMS & Email Gateway Integration:** Twilio / SendGrid webhooks to dispatch SMS/Email alerts to parents/guardians when attendance drops below 70%.
2. **Automated Quiz & Knowledge Checks:** Video-embedded interactive checkpoints requiring 80% quiz score before marking lessons complete.
3. **Machine Learning Predictive Model:** Integrating a scikit-learn or TensorFlow.js model to predict end-semester GPA and dropout probability based on multi-week behavioral trends.

---
*Created for Educational Progress Monitoring System (EPMS) Viva Examination & Capstone Project Evaluation.*
