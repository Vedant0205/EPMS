# System Architecture & Technical Specifications

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer (Browser)"
        ReactUI["React 18 + Vite SPA"]
        Recharts["Recharts Visualization Engine"]
        Axios["Axios with JWT Interceptor"]
        ReactUI --> Recharts
        ReactUI --> Axios
    end

    subgraph "Reverse Proxy / Web Server"
        Nginx["Nginx Reverse Proxy (Port 80)"]
    end

    subgraph "Application Layer (Spring Boot 3.2.0)"
        Security["Spring Security (JWT Filter & BCrypt)"]
        Controllers["REST API Controllers"]
        Services["Domain Services (Analytics, Attendance, Exams)"]
        JPA["Spring Data JPA / Hibernate"]
        ReportEngines["Reporting (OpenPDF & Apache POI)"]
        
        Security --> Controllers
        Controllers --> Services
        Services --> JPA
        Services --> ReportEngines
    end

    subgraph "Persistence Layer"
        MySQL[("MySQL 8.0 Database (Port 3306)")]
        JPA --> MySQL
    end

    Axios --> Nginx
    Nginx --> Security
```

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : belongs_to
    USERS ||--o| STUDENTS : profile
    USERS ||--o| TEACHERS : profile
    USERS ||--o| PARENTS : profile
    PARENTS ||--o{ PARENT_STUDENT : monitors
    STUDENTS ||--o{ PARENT_STUDENT : linked_to
    
    DEPARTMENTS ||--o{ CLASSES : contains
    DEPARTMENTS ||--o{ SUBJECTS : offers
    ACADEMIC_YEARS ||--o{ SEMESTERS : divided_into
    ACADEMIC_YEARS ||--o{ CLASSES : scheduled_for
    
    CLASSES ||--o{ ENROLLMENTS : registers
    STUDENTS ||--o{ ENROLLMENTS : enrolled_in
    CLASSES ||--o{ CLASS_SUBJECTS : includes
    SUBJECTS ||--o{ CLASS_SUBJECTS : included_in
    
    TEACHERS ||--o{ TEACHER_ASSIGNMENTS : assigned_to
    CLASSES ||--o{ TEACHER_ASSIGNMENTS : assigned_in
    SUBJECTS ||--o{ TEACHER_ASSIGNMENTS : teaches
    
    STUDENTS ||--o{ ATTENDANCE : logs
    SUBJECTS ||--o{ ATTENDANCE : during
    CLASSES ||--o{ ATTENDANCE : within
    
    SEMESTERS ||--o{ EXAMINATIONS : schedules
    SUBJECTS ||--o{ EXAMINATIONS : tests
    CLASSES ||--o{ EXAMINATIONS : for_class
    EXAMINATIONS ||--o{ EXAM_RESULTS : yields
    STUDENTS ||--o{ EXAM_RESULTS : scores
    
    TEACHERS ||--o{ ASSIGNMENTS : creates
    CLASSES ||--o{ ASSIGNMENTS : assigned_to
    SUBJECTS ||--o{ ASSIGNMENTS : subject_of
    ASSIGNMENTS ||--o{ ASSIGNMENT_SUBMISSIONS : receives
    STUDENTS ||--o{ ASSIGNMENT_SUBMISSIONS : submits
    
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ ANNOUNCEMENTS : publishes
    USERS ||--o{ AUDIT_LOGS : triggers
```

---

## 3. Use Case Diagram

```mermaid
flowchart LR
    subgraph Actors
        Admin((Super Admin))
        Teacher((Teacher))
        Student((Student))
        Parent((Parent))
    end

    subgraph System Features
        UC1[Manage Users & Structure]
        UC2[System Analytics & Audit]
        UC3[Roll Call & Attendance]
        UC4[Assessments & Grading]
        UC5[Coursework Assignments]
        UC6[View Academic Progress]
        UC7[Submit Coursework]
        UC8[Monitor Child Standing]
        UC9[Download PDF/Excel Reports]
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC9
    
    Teacher --> UC3
    Teacher --> UC4
    Teacher --> UC5
    Teacher --> UC9
    
    Student --> UC6
    Student --> UC7
    Student --> UC9
    
    Parent --> UC8
    Parent --> UC9
```

---

## 4. Data Flow Diagram (DFD Level 1)

```mermaid
flowchart TD
    User([User: Admin / Teacher / Student / Parent])
    
    subgraph Processes
        P1[1.0 Authenticate & Verify JWT]
        P2[2.0 Academic Records & Attendance]
        P3[3.0 Examination & Grading Engine]
        P4[4.0 Intelligent Analytics & Alerts]
        P5[5.0 Report Compilation Engine]
    end

    subgraph Data Stores
        D1[(User & Role Store)]
        D2[(Attendance & Exam Records)]
        D3[(Notification Store)]
    end

    User -->|Login Credentials| P1
    P1 -->|Query Credentials| D1
    P1 -->|JWT Bearer Token| User

    User -->|Mark Attendance / Enter Scores| P2
    P2 -->|Save Records| D2
    
    D2 -->|Raw Marks & Total Weights| P3
    P3 -->|Calculated Percentages & Grades| D2
    
    D2 -->|Aggregated Data| P4
    P4 -->|Trigger Low Attendance Warning| D3
    
    User -->|Request Transcript| P5
    D2 -->|Student Data Stream| P5
    P5 -->|Formatted PDF / Excel Stream| User
```
