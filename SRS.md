# Software Requirements Specification (SRS)
## Education Progress Monitoring System (EPMS)

### 1. Introduction
#### 1.1 Purpose
This document specifies the software requirements for the **Education Progress Monitoring System (EPMS)**. The system enables educational institutions to systematically track, evaluate, and enhance students' learning trajectories, attendance consistency, and developmental outcomes.

#### 1.2 Scope
EPMS includes:
- Role-based portals for Super Administrators, Teachers, Students, and Parents.
- Academic structure configuration (Departments, Classes, Semesters, Subjects).
- Attendance monitoring with customizable alert thresholds (default: 75%).
- Examination scheduling, marks recording, and automated grade calculations.
- Coursework assignment distribution, file uploads, and grading.
- Intelligent progress analytics engine computing performance indicators (`EXCELLENT`, `GOOD`, `AVERAGE`, `NEEDS_IMPROVEMENT`, `CRITICAL`).
- Exportable academic reports (PDF transcripts and Excel attendance sheets).
- In-app notification center.

---

### 2. Overall Description
#### 2.1 User Classes and Characteristics
1. **Super Administrator**: Complete administrative control over institution data, user registrations, academic structure, audit logs, and analytics.
2. **Teacher**: Manages assigned classes, conducts attendance roll-calls, schedules tests, grades coursework, and provides student evaluations.
3. **Student**: Accesses personal performance indicators, tracks attendance percentages, reviews test results, and uploads homework files.
4. **Parent**: Linked strictly to their children; observes academic standings, attendance logs, and receives institutional advisories.

#### 2.2 Operating Environment
- Client: Modern web browsers (Chrome 100+, Firefox 100+, Edge, Safari 15+).
- Server: Java 17 Runtime Environment, Linux/Windows containerized environments.
- Database: MySQL 8.0+.

---

### 3. Functional Requirements

#### FR-01: Authentication & Role Authorization
- System shall verify credentials using BCrypt password verification.
- System shall issue stateless JWT access tokens (15-minute validity) and refresh tokens (7-day validity).
- HTTP requests to protected endpoints must validate the Bearer token in the `Authorization` header.

#### FR-02: Institutional Structure Management
- Admin shall create, update, and archive Departments, Classes, and Subjects.
- System shall prevent duplicate departmental codes or class names within the same academic cohort.

#### FR-03: Attendance Tracking
- Teachers shall submit batch attendance records with statuses: `PRESENT`, `ABSENT`, `LATE`.
- System shall calculate student attendance percentages where `LATE` yields 0.5 weight.
- When a student's subject attendance drops below 75%, an automated in-app alert shall be dispatched.

#### FR-04: Examination & Grading
- Teachers shall schedule examinations with maximum marks and passing criteria.
- System shall automatically compute percentage scores and assign letter grades:
  - `A+` (>= 90%)
  - `A` (80% - 89%)
  - `B+` (70% - 79%)
  - `B` (60% - 69%)
  - `C` (50% - 59%)
  - `D` (40% - 49%)
  - `F` (< 40%)

#### FR-05: Coursework & Assignment Management
- Teachers shall upload assignment descriptions and attachments up to 10MB.
- Students shall upload completed coursework documents.
- The system shall automatically flag submissions made after the deadline as `LATE`.

#### FR-06: Intelligent Progress Analytics
- The analytics service shall compute composite learning performance:
  $$\text{Composite} = (0.25 \times \text{Attendance}) + (0.50 \times \text{Exam Average}) + (0.25 \times \text{Assignment Completion})$$
- The system shall assign an indicator from `EXCELLENT` down to `CRITICAL` based on this composite index.

#### FR-07: Report Generation
- System shall compile and stream certified PDF student progress transcripts using OpenPDF.
- System shall stream aggregated attendance workbooks in `.xlsx` format using Apache POI.

---

### 4. Non-Functional Requirements
- **Security**: Data protection via TLS/HTTPS, BCrypt password hashing, parameter-bound SQL queries preventing SQL injection, and granular Role-Based Access Control.
- **Performance**: Average API response time under 150ms for cached operations; report streaming under 2 seconds.
- **Availability**: 99.9% uptime with container health checks.
- **Usability**: Responsive SaaS dashboard UI following modern design systems with light/dark theme toggling.
