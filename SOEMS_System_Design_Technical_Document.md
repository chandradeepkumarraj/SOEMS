# 📐 SOEMS SYSTEM DESIGN & TECHNICAL ARCHITECTURE DOCUMENT

## **Serverless Online Examination Management System**
### Complete System Design Flow + UI/UX Architecture
### Version 1.0 | December 2025

---

## 📖 TABLE OF CONTENTS

1. Executive Summary
2. System Architecture Overview
3. Technical Stack & Technology Selection
4. System Design Patterns
5. Database Design & Schema
6. API Architecture & Endpoints
7. UI/UX Flow Diagrams
8. User Journey Maps
9. Data Flow Diagrams (Detailed)
10. Security & Compliance Architecture
11. Deployment Architecture
12. Performance & Scalability Strategy
13. Integration Points
14. Error Handling & Recovery
15. Monitoring & Observability

---

## 1. EXECUTIVE SUMMARY

**SOEMS** is a **Serverless Online Examination Management System** designed to support:
- ✅ 1000+ concurrent users
- ✅ Real-time AI-powered proctoring
- ✅ Multi-role management (Student, Teacher, Admin, Proctor)
- ✅ Automated grading & analytics
- ✅ Immutable audit logging
- ✅ 99.99% uptime SLA
- ✅ Sub-200ms API response times
- ✅ Zero infrastructure management (Serverless-first)

**Key Technology Stack:**
- **Frontend:** React + TypeScript + Redux
- **Backend:** Python FastAPI + Serverless (AWS Lambda/Azure Functions)
- **Database:** PostgreSQL + MongoDB + Redis
- **Messaging:** RabbitMQ / AWS SNS-SQS
- **Media:** WebRTC + AWS S3
- **AI/ML:** OpenCV, MediaPipe, TensorFlow Lite

---

## 2. SYSTEM ARCHITECTURE OVERVIEW

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                             │
│  ┌──────────────────┬──────────────────┬──────────────────┐    │
│  │ Student Portal   │ Teacher Dashboard │ Proctor Monitor  │    │
│  │ (React SPA)      │ (React SPA)       │ (React SPA)      │    │
│  │                  │                  │                  │    │
│  │ - Exam Taking    │ - Exam Creation  │ - Live Monitoring│    │
│  │ - Auto-save      │ - Grading UI     │ - Alerts         │    │
│  │ - Proctoring     │ - Analytics      │ - Video Feeds    │    │
│  └──────────────────┴──────────────────┴──────────────────┘    │
│                              ↑                                   │
│                        HTTPS/WebSocket                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ - Authentication & Authorization (JWT)                 │   │
│  │ - Rate Limiting & DDoS Protection                       │   │
│  │ - Request Validation & Routing                          │   │
│  │ - CORS & Security Headers                               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SERVERLESS FUNCTION LAYER                    │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │   Auth Svc   │   Exam Svc   │   Answer Svc │ Analytics Svc│  │
│  │              │              │              │              │  │
│  │ - Login      │ - Create     │ - Submit     │ - Grade Data │  │
│  │ - Register   │ - Retrieve   │ - Auto-save  │ - Reports    │  │
│  │ - Refresh    │ - Publish    │ - Validate   │ - Dashboards │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │ Proctor Svc  │Notif. Svc    │  Grade Svc   │  Audit Svc   │  │
│  │              │              │              │              │  │
│  │ - Events     │ - Email      │ - Manual     │ - Log Events │  │
│  │ - Flags      │ - SMS        │ - Auto-grade │ - Compliance │  │
│  │ - Actions    │ - Push       │ - Feedback   │ - Export     │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 AI/ML PROCTORING SERVICES                       │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │Face Recog.   │ Gaze Tracking│ Multi-Person │Screen Monitor│  │
│  │ - Match      │ - Eyes       │ - YOLO       │ - Tab Detect │  │
│  │ - Confidence │ - Attention  │ - Detection  │ - Activity   │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
│  ┌──────────────┬──────────────┐                               │  │
│  │Audio Analysis│ Event Logger │                               │  │
│  │ - Voices     │ - ProctorEvent│                              │  │
│  │ - Noise      │ - Confidence │                              │  │
│  └──────────────┴──────────────┘                               │  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DATA PERSISTENCE LAYER                     │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │ PostgreSQL   │   MongoDB    │    Redis     │   S3 Storage │  │
│  │              │              │              │              │  │
│  │ - Users      │ - Exams      │ - Session    │ - Videos     │  │
│  │ - Questions  │ - Submissions│ - Cache      │ - Screenshots│  │
│  │ - Audit Logs │ - Events     │ - Locks      │ - PDFs       │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGE QUEUE / EVENT BUS                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ RabbitMQ / AWS SQS / Apache Kafka                      │    │
│  │ - Async processing (notifications, analytics)         │    │
│  │ - Event streaming (proctoring events, logs)            │    │
│  │ - Dead letter queue for failures                       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING & OBSERVABILITY                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ CloudWatch / ELK / Prometheus + Grafana               │    │
│  │ - Real-time metrics & alerts                          │    │
│  │ - Distributed tracing (X-Ray / Jaeger)               │    │
│  │ - Centralized logging                                 │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 System Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 18, TypeScript, Redux, Material-UI | User interfaces for all roles |
| **API Gateway** | AWS API Gateway / Kong | Route, validate, authenticate requests |
| **Compute** | AWS Lambda / Azure Functions | Serverless function execution |
| **Auth** | JWT + OAuth2 / OIDC | Secure authentication |
| **Primary DB** | PostgreSQL | Relational data (users, questions, results) |
| **Document DB** | MongoDB | Non-relational (exams, submissions, events) |
| **Cache** | Redis | Session, rate-limit, real-time data |
| **Object Storage** | AWS S3 / Azure Blob | Videos, images, documents |
| **Messaging** | RabbitMQ / SQS | Async communication |
| **Real-time** | WebSocket / WebRTC | Live updates, video streaming |
| **AI/ML** | OpenCV, MediaPipe, YOLO | Proctoring, face/gaze detection |
| **Monitoring** | CloudWatch, DataDog, Prometheus | Observability |

---

## 3. TECHNICAL STACK & TECHNOLOGY SELECTION

### 3.1 Frontend Stack

```
Framework:    React 18 (TSX)
Language:     TypeScript (strict mode)
State Mgmt:   Redux Toolkit
UI Library:   Material-UI / Chakra UI
Router:       React Router v6
HTTP Client:  Axios with interceptors
WebSocket:    Socket.io
Real-time:    WebRTC (peerjs/mediasoup)
Build Tool:   Vite / create-react-app
Testing:      Jest + React Testing Library
Linting:      ESLint + Prettier
Deployment:   CloudFront / Netlify
```

### 3.2 Backend Stack

```
Framework:    Python FastAPI
Language:     Python 3.11+
Runtime:      AWS Lambda / Azure Functions
Web Server:   Uvicorn (serverless)
Database ORM: SQLAlchemy
Validation:   Pydantic
Auth:         PyJWT + python-jose
Async:        asyncio + aiohttp
Testing:      pytest + pytest-asyncio
Linting:      black + flake8 + mypy
Package Mgmt: Poetry / pip
```

### 3.3 Data Stack

```
Relational:   PostgreSQL 14+
Document DB:  MongoDB 5.0+
Cache:        Redis 7.0+
Search:       Elasticsearch (optional)
Time-Series:  InfluxDB (metrics)
Backup:       AWS Backup / Vault
```

### 3.4 DevOps & Infrastructure

```
IaC:          Terraform / CloudFormation
Container:    Docker + Docker Compose
Orchestration: Kubernetes (optional) / ECS Fargate
CI/CD:        GitHub Actions / Jenkins
Monitoring:   Prometheus + Grafana + Datadog
Logging:      ELK Stack / CloudWatch
Tracing:      Jaeger / AWS X-Ray
```

---

## 4. SYSTEM DESIGN PATTERNS

### 4.1 Architectural Patterns

```
Pattern                 Application
─────────────────────────────────────────────────────────
Serverless              All compute via Lambda/Functions
Event-Driven            Proctoring events, notifications
CQRS                    Separate read/write models for analytics
Microservices           Decoupled services by domain
API-First               All features via documented APIs
Strangler Pattern       Gradual migration from monolith
Circuit Breaker         Fault tolerance in cascading calls
Saga                    Distributed transactions (exam workflow)
```

### 4.2 Design Patterns in Code

```python
# Service Locator Pattern
class ServiceContainer:
    _services = {}
    
    @classmethod
    def register(cls, name, service):
        cls._services[name] = service
    
    @classmethod
    def get(cls, name):
        return cls._services[name]

# Dependency Injection
async def get_exam_service(db: Session = Depends(get_db)):
    return ExamService(db)

# Repository Pattern
class ExamRepository:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_by_id(self, exam_id: str):
        return self.db.query(Exam).filter(Exam.id == exam_id).first()

# Observer Pattern for Events
class ProctorEventEmitter:
    def __init__(self):
        self.subscribers = []
    
    def subscribe(self, handler):
        self.subscribers.append(handler)
    
    async def emit(self, event: ProctorEvent):
        for handler in self.subscribers:
            await handler(event)
```

---

## 5. DATABASE DESIGN & SCHEMA

### 5.1 PostgreSQL Schema (Relational Data)

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin', 'proctor') NOT NULL,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
);

-- Questions Table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    type ENUM('MCQ', 'short_answer', 'long_answer', 'coding') NOT NULL,
    options JSONB, -- {"A": "...", "B": "...", ...}
    correct_answer VARCHAR(255),
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    tags JSONB, -- ["math", "algebra"]
    media_url VARCHAR(2048),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,
    INDEX idx_created_by (created_by),
    INDEX idx_type (type),
    INDEX idx_difficulty (difficulty)
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL, -- 'exam_started', 'answer_submitted', etc.
    resource_type VARCHAR(50), -- 'exam', 'submission', 'user'
    resource_id UUID,
    details JSONB, -- Additional context
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_id_created_at (user_id, created_at),
    INDEX idx_action_created_at (action, created_at),
    INDEX idx_resource_type_id (resource_type, resource_id)
);

-- Indexes for Performance
CREATE INDEX idx_exam_submissions ON submissions(exam_id, student_id);
CREATE INDEX idx_submission_status ON submissions(status);
CREATE INDEX idx_answer_submission ON answers(submission_id);
```

### 5.2 MongoDB Schema (Document Data)

```javascript
// Exams Collection
db.exams.insertOne({
    _id: ObjectId(),
    title: "Introduction to Mathematics",
    description: "Semester 1 Final Exam",
    duration_minutes: 120,
    scheduled_start: ISODate("2025-01-15T10:00:00Z"),
    scheduled_end: ISODate("2025-01-15T12:00:00Z"),
    created_by: ObjectId("user_id"),
    status: "published", // draft, published, live, completed
    instructions: "Please read carefully...",
    allow_late_entry: false,
    total_attempts: 1,
    questions: [
        {
            question_id: ObjectId("question_id"),
            order: 1,
            points: 10,
            randomize: false
        }
    ],
    created_at: ISODate("2024-12-01T10:00:00Z"),
    updated_at: ISODate("2024-12-01T10:00:00Z")
});

// Submissions Collection
db.submissions.insertOne({
    _id: ObjectId(),
    exam_id: ObjectId("exam_id"),
    student_id: ObjectId("student_id"),
    status: "submitted", // not_started, in_progress, submitted, graded
    start_time: ISODate("2025-01-15T10:00:00Z"),
    end_time: ISODate("2025-01-15T11:45:00Z"),
    total_score: 85,
    percentage: 85,
    grade: "A",
    answers: [
        {
            question_id: ObjectId("question_id"),
            response: "Option B",
            score: 10,
            submitted_at: ISODate("2025-01-15T10:05:00Z")
        }
    ],
    proctoring_events: [
        {
            event_type: "face_verification",
            confidence: 0.95,
            timestamp: ISODate("2025-01-15T10:00:00Z"),
            severity: "normal"
        }
    ],
    created_at: ISODate("2025-01-15T10:00:00Z"),
    updated_at: ISODate("2025-01-15T11:45:00Z")
});

// Proctoring Events Collection
db.proctoring_events.insertOne({
    _id: ObjectId(),
    submission_id: ObjectId("submission_id"),
    student_id: ObjectId("student_id"),
    event_type: "gaze_anomaly", // face_verification, multiple_faces, gaze_anomaly, etc.
    confidence: 0.87,
    severity: "medium", // low, medium, high
    description: "Candidate looking away for >5 seconds",
    action_taken: "flagged", // flagged, auto_paused, auto_blocked
    proctor_notes: "Manual review pending",
    media_url: "s3://bucket/events/event_123.mp4",
    timestamp: ISODate("2025-01-15T10:05:30Z")
});

// Create indexes for performance
db.exams.createIndex({ status: 1, scheduled_start: 1 });
db.submissions.createIndex({ exam_id: 1, student_id: 1 });
db.submissions.createIndex({ status: 1, updated_at: -1 });
db.proctoring_events.createIndex({ submission_id: 1, timestamp: -1 });
```

---

## 6. API ARCHITECTURE & ENDPOINTS

### 6.1 API Structure

```
Base URL: https://api.soems.com/v1
Authentication: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### 6.2 Authentication APIs

```
POST   /auth/register
       Request:  { email, password, name, role }
       Response: { access_token, refresh_token, user }

POST   /auth/login
       Request:  { email, password }
       Response: { access_token, refresh_token, user, expires_in }

POST   /auth/refresh
       Request:  { refresh_token }
       Response: { access_token, expires_in }

POST   /auth/logout
       Request:  {}
       Response: { message: "Logged out successfully" }

GET    /auth/me
       Response: { user }

PUT    /auth/me
       Request:  { name, password_current, password_new }
       Response: { user }
```

### 6.3 Exam APIs

```
POST   /exams
       Request:  { title, description, duration_minutes, scheduled_start, questions }
       Response: { exam_id, status: "draft" }

GET    /exams
       Query:    ?status=published&sort=scheduled_start
       Response: { exams: [...], total_count }

GET    /exams/{exam_id}
       Response: { exam }

PUT    /exams/{exam_id}
       Request:  { title, description, ... }
       Response: { exam }

DELETE /exams/{exam_id}
       Response: { message: "Exam deleted" }

POST   /exams/{exam_id}/publish
       Response: { exam, status: "published" }

POST   /exams/{exam_id}/assign
       Request:  { student_ids: [...] }
       Response: { assignments_created: 25 }

GET    /exams/{exam_id}/assignments
       Response: { assignments: [...] }

POST   /exams/{exam_id}/start
       Response: { submission_id, session_token, questions: [...] }

POST   /exams/{exam_id}/import-questions
       Request:  { csv_file }
       Response: { imported: 50, failed: 2 }
```

### 6.4 Answer APIs

```
POST   /submissions/{submission_id}/answers
       Request:  { question_id, response }
       Response: { answer_id, auto_saved: true }

GET    /submissions/{submission_id}/answers
       Response: { answers: [...] }

PUT    /submissions/{submission_id}/answers/{answer_id}
       Request:  { response }
       Response: { answer }

POST   /submissions/{submission_id}/submit
       Request:  {}
       Response: { submission_id, status: "submitted", message: "Exam submitted successfully" }
```

### 6.5 Grading APIs

```
GET    /submissions/{submission_id}/grades
       Response: { grades: [...], auto_graded: true, manual_grading_status }

PUT    /submissions/{submission_id}/grades/{answer_id}
       Request:  { score, feedback }
       Response: { grade }

POST   /submissions/{submission_id}/publish-results
       Request:  {}
       Response: { submission_id, results_published: true }
```

### 6.6 Analytics APIs

```
GET    /analytics/exams/{exam_id}
       Response: { avg_score, grade_distribution, pass_rate, time_distribution }

GET    /analytics/questions/{question_id}
       Response: { pass_rate, avg_time, discrimination_index }

GET    /analytics/student/{student_id}
       Response: { exams_attempted, avg_score, trends: [...] }
```

### 6.7 Proctoring APIs

```
GET    /proctoring/sessions/active
       Response: { sessions: [...], total: 150 }

GET    /proctoring/sessions/{submission_id}
       Response: { session, events: [...], video_url }

PUT    /proctoring/sessions/{submission_id}/flag
       Request:  { event_type, severity, notes }
       Response: { event_id, flagged: true }

POST   /proctoring/sessions/{submission_id}/actions
       Request:  { action: "pause|block|message", data }
       Response: { action_taken: true }

WebSocket /ws/proctoring/{submission_id}
       Message: { event_type, data, timestamp }
```

---

## 7. UI/UX FLOW DIAGRAMS

### 7.1 Student Journey Flow

```
┌──────────────┐
│   Landing    │
│     Page     │
└──────┬───────┘
       │
       ├─→ [Login] ─→ ┌──────────────┐
       │               │ Auth Check   │
       │               └──────┬───────┘
       │                      │ JWT Valid
       │                      ↓
       │              ┌───────────────────┐
       │              │ Student Dashboard │
       │              │ - Upcoming Exams  │
       │              │ - Past Results    │
       │              │ - Notifications   │
       │              └────────┬──────────┘
       │                       │
       │                    [Start Exam]
       │                       │
       │                       ↓
       │            ┌──────────────────────┐
       │            │  System Check Modal  │
       │            │ - Browser Check      │
       │            │ - Webcam Test        │
       │            │ - Microphone Test    │
       │            │ - Download Speed     │
       │            └──────────┬───────────┘
       │                       │
       │                    [Proceed]
       │                       │
       │                       ↓
       │            ┌──────────────────────┐
       │            │ Face Verification    │
       │            │ (Face Recognition)   │
       │            │ - Capture Photo      │
       │            │ - Compare with ID    │
       │            │ - Confidence Score   │
       │            └──────────┬───────────┘
       │                       │
       │                    [OK/Retry]
       │                       │
       │                       ↓
       │            ┌──────────────────────┐
       │            │   Exam Interface     │
       │            │ - Question Display   │
       │            │ - Timer (MM:SS)      │
       │            │ - Question Nav Panel │
       │            │ - Submit Button      │
       │            │ - Auto-save Status   │
       │            └──────────┬───────────┘
       │                       │
       │             [Answer Q1→Q2→...→Qn]
       │                       │
       │                  [Submit Exam]
       │                       │
       │                       ↓
       │            ┌──────────────────────┐
       │            │ Submission Confirmed │
       │            │ - Score (if auto)    │
       │            │ - Submission Time    │
       │            │ - Thank You Message  │
       │            └──────────┬───────────┘
       │                       │
       │              [Return to Dashboard]
       │                       │
       └─────────────────→ [Exit]
```

### 7.2 Teacher Journey Flow

```
┌──────────────┐
│   Landing    │
│     Page     │
└──────┬───────┘
       │
       ├─→ [Login] ─→ ┌──────────────┐
       │               │ Auth Check   │
       │               └──────┬───────┘
       │                      │ JWT Valid
       │                      ↓
       │         ┌──────────────────────────┐
       │         │ Teacher Dashboard        │
       │         │ - My Exams (Published)   │
       │         │ - Drafts                 │
       │         │ - Question Banks         │
       │         │ - Create New Exam        │
       │         │ - Analytics              │
       │         └────────────┬─────────────┘
       │                      │
       │                 [Create Exam]
       │                      │
       │                      ↓
       │        ┌─────────────────────────────┐
       │        │ Exam Builder (Wizard)       │
       │        │ Step 1: Basic Info          │
       │        │ - Title                     │
       │        │ - Duration                  │
       │        │ - Instructions              │
       │        └────────────┬────────────────┘
       │                     │
       │                  [Next]
       │                     │
       │                     ↓
       │        ┌─────────────────────────────┐
       │        │ Step 2: Add Questions       │
       │        │ - Search Question Bank      │
       │        │ - Select Questions          │
       │        │ - Set Order / Randomize     │
       │        │ - Set Points per Question   │
       │        └────────────┬────────────────┘
       │                     │
       │                  [Next]
       │                     │
       │                     ↓
       │        ┌─────────────────────────────┐
       │        │ Step 3: Schedule & Assign   │
       │        │ - Start Date/Time           │
       │        │ - End Date/Time             │
       │        │ - Select Students           │
       │        │ - Send Notifications        │
       │        └────────────┬────────────────┘
       │                     │
       │                  [Review]
       │                     │
       │                     ↓
       │        ┌─────────────────────────────┐
       │        │ Step 4: Review & Publish    │
       │        │ - Preview Exam              │
       │        │ - Settings Summary          │
       │        │ - Publish Button            │
       │        └────────────┬────────────────┘
       │                     │
       │                 [Publish]
       │                     │
       │        ┌────────────────────────────┐
       │        │ Exam Published              │
       │        │ - Live & Monitoring Ready   │
       │        │ - Share Link with Students  │
       │        └────────────┬────────────────┘
       │                     │
       │         [View Exam Analytics]
       │                     │
       │                     ↓
       │        ┌────────────────────────────┐
       │        │ Analytics Dashboard        │
       │        │ - Submissions Counter      │
       │        │ - Grade Distribution       │
       │        │ - Question Performance     │
       │        │ - Time Distribution        │
       │        │ - Export Reports           │
       │        └────────────┬────────────────┘
       │                     │
       └─────────────────────→ [Exit]
```

### 7.3 Proctor Journey Flow

```
┌──────────────┐
│   Landing    │
│     Page     │
└──────┬───────┘
       │
       ├─→ [Login] ─→ ┌──────────────┐
       │               │ Auth Check   │
       │               └──────┬───────┘
       │                      │ JWT Valid
       │                      ↓
       │         ┌───────────────────────────┐
       │         │ Proctor Dashboard         │
       │         │ - Active Exams Count      │
       │         │ - Active Sessions (87)    │
       │         │ - Alerts Count (3)        │
       │         │ - Select Exam to Monitor  │
       │         └────────────┬──────────────┘
       │                      │
       │                [Monitor Exam]
       │                      │
       │                      ↓
       │         ┌───────────────────────────┐
       │         │ Live Monitor Dashboard    │
       │         │ - Session Grid (6+ visible)
       │         │ - Student Status Cards    │
       │         │ - Alert Log               │
       │         │ - Control Panel           │
       │         └────────────┬──────────────┘
       │                      │
       │              [Select Student]
       │                      │
       │                      ↓
       │         ┌───────────────────────────┐
       │         │ Student Detail View       │
       │         │ - Live Video Feed         │
       │         │ - Screen Share            │
       │         │ - Question Progress       │
       │         │ - Proctoring Events Log   │
       │         │ - Action Buttons          │
       │         │  * Send Message           │
       │         │  * Request Webcam         │
       │         │  * Pause Exam             │
       │         │  * Flag Activity          │
       │         │  * Block Student          │
       │         └────────────┬──────────────┘
       │                      │
       │           [Event Flagged - HIGH]
       │                      │
       │                      ↓
       │         ┌───────────────────────────┐
       │         │ Incident Modal            │
       │         │ - Event Type              │
       │         │ - Screenshot              │
       │         │ - Confidence Score        │
       │         │ - Action Options          │
       │         │ - Notes Field             │
       │         └────────────┬──────────────┘
       │                      │
       │              [Take Action]
       │                      │
       │                      ↓
       │         ┌───────────────────────────┐
       │         │ Action Confirmation       │
       │         │ - Action: "Flagged"       │
       │         │ - Logged at: 10:45 AM     │
       │         │ - Return to Monitor       │
       │         └────────────┬──────────────┘
       │                      │
       └─────────────────────→ [Exit]
```

### 7.4 Admin Journey Flow

```
┌──────────────┐
│   Landing    │
│     Page     │
└──────┬───────┘
       │
       ├─→ [Login] ─→ ┌──────────────┐
       │               │ Auth Check   │
       │               └──────┬───────┘
       │                      │ JWT Valid
       │                      ↓
       │         ┌───────────────────────────┐
       │         │ Admin Dashboard           │
       │         │ - System Health Metrics   │
       │         │  * Uptime: 99.9%          │
       │         │  * Active Users: 1,245    │
       │         │  * Avg Response: 156ms    │
       │         │ - Menu Options            │
       │         │  * Users Management       │
       │         │  * System Configuration   │
       │         │  * Audit Logs             │
       │         │  * Reports                │
       │         └────────────┬──────────────┘
       │                      │
       │         [Users Management]
       │                      │
       │                      ↓
       │         ┌───────────────────────────┐
       │         │ Users List                │
       │         │ - Search/Filter Users     │
       │         │ - Edit User Details       │
       │         │ - Change Role             │
       │         │ - Disable Account         │
       │         │ - Create New User         │
       │         │ - Bulk Import             │
       │         └────────────┬──────────────┘
       │                      │
       │         [Audit Logs]
       │                      │
       │                      ↓
       │         ┌───────────────────────────┐
       │         │ Audit Log Viewer          │
       │         │ - Filter by User/Action   │
       │         │ - Search by Date/IP       │
       │         │ - View Details            │
       │         │ - Export CSV              │
       │         │ - Archive Records         │
       │         └────────────┬──────────────┘
       │                      │
       │         [System Configuration]
       │                      │
       │                      ↓
       │         ┌───────────────────────────┐
       │         │ Configuration Settings    │
       │         │ - Institution Info        │
       │         │ - Email/SMS Providers     │
       │         │ - Security Policies       │
       │         │ - Notification Rules      │
       │         │ - API Keys                │
       │         │ - Save Configuration      │
       │         └────────────┬──────────────┘
       │                      │
       └─────────────────────→ [Exit]
```

---

## 8. DATA FLOW DIAGRAMS (DETAILED)

### 8.1 Exam Taking Flow (Data Movement)

```
Client Browser          API Gateway          Backend Services        Data Stores
─────────────────       ──────────────      ──────────────────      ────────────

1. Student clicks
   "Start Exam"
   ↓
   POST /exams/{id}/start
   ─────────────────────→ 
                         ├─ Validate JWT
                         ├─ Check exam status
                         ├─ Create Submission
                         └─→ ExamService
                             ├─ Get exam
                             ├─ Get questions
                             └─ Create submission
                                            ├─→ PostgreSQL
                                            │   INSERT submissions
                                            │   INSERT answers (null)
                                            │
                                            └─→ MongoDB
                                                INSERT submissions doc

2. Display Exam Interface
   ← (Exam + Questions)
   ← ────────────────────

3. Student answers Q1
   POST /submissions/{id}/answers
   ─────────────────────→
                         ├─ Validate answer
                         ├─ Auto-save (Async)
                         └─→ AnswerService
                             ├─ Store answer
                             ├─ Update progress
                             └─→ Cache (Redis)
                                 SET submission:123:progress 20%

4. Proctoring Pipeline (Parallel)
   WebSocket stream (video)
   ─────────────────────→
                         └─→ ProctorService
                             ├─ Process frame
                             ├─ Face detect
                             ├─ Gaze detect
                             └─→ Flag events → MongoDB
                                 S3 (video archive)

5. Timer Fires (Submit)
   POST /submissions/{id}/submit
   ─────────────────────→
                         ├─ Final validation
                         ├─ Calculate score (auto MCQ)
                         ├─ Update status
                         └─→ GradeService
                             ├─ Auto-grade
                             ├─ Finalize score
                             └─→ PostgreSQL
                                 UPDATE submissions SET
                                 status='graded', total_score=...

6. Notification Event
   (Background Job)
   ← (Event → Queue → Worker)
   
                         └─→ NotificationService
                             ├─ Send email
                             ├─ Send SMS
                             └─→ SMTP, SMS Gateway

7. Analytics Updated
   (Async Aggregation)
   
                         └─→ AnalyticsService
                             ├─ Compute grade dist.
                             ├─ Calculate metrics
                             └─→ MongoDB
                                 UPDATE analytics doc
```

### 8.2 Proctoring Event Flow

```
WebRTC Stream (Video/Audio)
        │
        ↓
┌────────────────────────┐
│  Browser Media Capture │
│ (User Permission)      │
└────────┬───────────────┘
         │
         ├─ Video Stream (H.264)
         │
         ↓
┌────────────────────────────────────┐
│ API Gateway / WebSocket Connection │
└────────┬─────────────────────────┘
         │
         ├─ Proctoring Service
         │   (FastAPI + Lambda)
         │
         ├─→ Face Recognition
         │   ├─ Capture Frame
         │   ├─ Encode to embedding
         │   ├─ Compare with registered face
         │   └─ Confidence Score
         │
         ├─→ Gaze Tracking
         │   ├─ MediaPipe Landmarks
         │   ├─ Eye position
         │   ├─ Gaze direction
         │   └─ Alert if >5s away
         │
         ├─→ Person Detection (YOLO)
         │   ├─ Detect all persons
         │   ├─ Count faces
         │   └─ Alert if >1
         │
         ├─→ Screen Monitoring
         │   ├─ Detect tab switch
         │   ├─ Detect new apps
         │   └─ Alert on anomaly
         │
         └─→ Audio Analysis
             ├─ Speech detection
             ├─ Multiple voices
             └─ Background noise
         │
         ↓
┌────────────────────────────┐
│ Event Aggregation          │
│ {                          │
│  "event_type": "...",      │
│  "severity": "HIGH/MED/LOW"│
│  "confidence": 0.95,       │
│  "timestamp": "...",       │
│  "media_url": "s3://..."   │
│ }                          │
└────────┬───────────────────┘
         │
         ├─→ Store Event
         │   ├─ MongoDB ProctorEvent
         │   └─ S3 Media Archive
         │
         ├─→ Real-time Alert
         │   ├─ WebSocket to Proctor
         │   └─ Notification Service
         │
         └─→ Analytics Update
             └─ Aggregate flags
```

---

## 9. SECURITY & COMPLIANCE ARCHITECTURE

### 9.1 Security Layers

```
Layer 1: Network Security
├─ TLS 1.2+ (Encryption in Transit)
├─ WAF (Web Application Firewall)
├─ DDoS Protection (AWS Shield / Cloudflare)
└─ VPC Isolation

Layer 2: Authentication & Authorization
├─ JWT Tokens (Exp: 15 min access, 7 days refresh)
├─ OAuth2 / OIDC Support
├─ Multi-Factor Authentication (MFA)
└─ Role-Based Access Control (RBAC)

Layer 3: Data Protection
├─ AES-256 Encryption at Rest
├─ Field-level encryption (sensitive data)
├─ Encrypted database backups
└─ Secure key management (AWS KMS)

Layer 4: Application Security
├─ Input Validation & Sanitization
├─ SQL Injection Prevention (Parameterized queries)
├─ XSS Protection (Content Security Policy)
├─ CSRF Tokens
└─ Rate Limiting & Throttling

Layer 5: Audit & Compliance
├─ Immutable Audit Logs
├─ User consent tracking
├─ Data retention policies
└─ Incident response procedures
```

### 9.2 Data Privacy Compliance

```
GDPR / CCPA
├─ Data minimization
├─ Purpose limitation
├─ User rights (access, deletion)
└─ Consent management

Indian IT Act 2000 & SPDI Rules
├─ Data residency (India)
├─ Sensitive personal data protection
├─ User consent documentation
└─ Breach notification (<72 hours)

WCAG 2.1 AA (Accessibility)
├─ Screen reader support
├─ Color contrast (4.5:1)
├─ Keyboard navigation
└─ Captions for media
```

---

## 10. DEPLOYMENT ARCHITECTURE

### 10.1 Cloud Deployment (AWS Example)

```
┌─────────────────────────────────────────────────────┐
│            CloudFront CDN                           │
│ (Static SPA distribution, caching)                  │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────────────────────────────────────┐
│         API Gateway                                │
│ - Authentication & Authorization                   │
│ - Rate Limiting                                    │
│ - Request Validation                               │
└────────────────┬───────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
┌─────────────────┐   ┌──────────────────┐
│  Lambda Funcs   │   │   ECS/Fargate    │
│ (Serverless)    │   │ (Container Apps) │
│                 │   │                  │
│ - Auth Svc      │   │ - Proctoring AI  │
│ - Exam Svc      │   │ - Analytics      │
│ - Answer Svc    │   │                  │
│ - Grade Svc     │   │                  │
└────────┬────────┘   └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────────────┐       ┌───────────────┐
│  RDS (SQL)    │       │ DynamoDB      │
│  PostgreSQL   │       │ (NoSQL)       │
│               │       │               │
│ - Users       │       │ - Exams       │
│ - Questions   │       │ - Submissions │
│ - Audit Logs  │       │ - Events      │
└───────────────┘       └───────────────┘
        │                       │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────────────────┐   ┌──────────────────┐
│  ElastiCache      │   │  S3 Storage      │
│  (Redis)          │   │  (Media)         │
│                   │   │                  │
│ - Sessions        │   │ - Videos         │
│ - Rate Limits     │   │ - Screenshots    │
│ - Real-time Data  │   │ - Documents      │
└───────────────────┘   └──────────────────┘
        │                       │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌──────────────────┐   ┌──────────────────┐
│  SQS/SNS         │   │  CloudWatch      │
│  (Messaging)     │   │  (Monitoring)    │
│                  │   │                  │
│ - Notifications  │   │ - Metrics        │
│ - Events         │   │ - Logs           │
│ - Async Jobs     │   │ - Alarms         │
└──────────────────┘   └──────────────────┘
```

### 10.2 CI/CD Pipeline

```
Developer Push
    │
    ├─→ GitHub
    │   └─→ GitHub Actions
    │       ├─ Run Tests
    │       ├─ Code Quality
    │       ├─ Security Scan
    │       ├─ Build Docker Image
    │       └─ Push to ECR
    │
    ├─→ Dev Environment
    │   ├─ Deploy Frontend
    │   ├─ Deploy Backend
    │   └─ Run Integration Tests
    │
    ├─→ Staging Environment
    │   ├─ Deploy with live DB
    │   ├─ Smoke Tests
    │   └─ Performance Tests
    │
    ├─→ Production Environment
    │   ├─ Blue-Green Deployment
    │   ├─ Canary Rollout
    │   ├─ Health Checks
    │   └─ Rollback Capability
```

---

## 11. PERFORMANCE & SCALABILITY STRATEGY

### 11.1 Horizontal Scalability

```
Problem: 1000+ concurrent users

Solution:
├─ Serverless Auto-scaling
│  └─ Lambda concurrent executions (reserved + provisioned)
│
├─ Database Scaling
│  ├─ Read Replicas (PostgreSQL)
│  ├─ Sharding (MongoDB)
│  └─ Connection pooling
│
├─ Caching Strategy
│  ├─ Redis (Session, User prefs)
│  ├─ CloudFront CDN (Static assets)
│  └─ App-level caching (Query results)
│
├─ Load Balancing
│  ├─ API Gateway distribution
│  ├─ Round-robin across functions
│  └─ Geographic routing
│
└─ Asynchronous Processing
   ├─ Offload grading to workers
   ├─ Batch analytics updates
   └─ Deferred notifications
```

### 11.2 Performance Targets

```
Metric                Target         Monitoring
─────────────────────────────────────────────────
API Response Time     <500ms (p95)   CloudWatch Metrics
UI Render             <200ms         Lighthouse / APM
Database Query        <100ms         RDS Enhanced Monitoring
WebSocket Latency     <2s            Custom Metrics
Concurrent Users      1000+          CloudWatch Metrics
Memory Utilization    <80%           Lambda Insights
Cost per Exam         Minimize       Cost Anomaly Detection
```

---

## 12. ERROR HANDLING & RECOVERY

### 12.1 Error Handling Strategy

```python
# Global Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Log error with context
    logger.error(f"Unhandled error: {exc}", extra={
        "path": request.url.path,
        "user_id": request.user.id,
        "timestamp": datetime.utcnow()
    })
    
    # Determine user-facing message
    if isinstance(exc, ValidationError):
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid input", "details": exc.errors()}
        )
    elif isinstance(exc, NotFoundException):
        return JSONResponse(
            status_code=404,
            content={"error": "Resource not found"}
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )

# Circuit Breaker for external services
@circuit_breaker(failure_threshold=5, recovery_timeout=60)
async def call_external_service():
    pass
```

### 12.2 Recovery Mechanisms

```
Failure Scenario        Recovery Action
───────────────────────────────────────────────────
Database Down           → Read from replica
                        → Queue writes for replay
                        → Return cached response

Lambda Timeout          → Automatic retry (exponential backoff)
                        → Fall back to synchronous if async fails
                        → Log event for investigation

WebSocket Disconnect    → Client auto-reconnect
                        → Server maintains session state
                        → Resume submission from last checkpoint

API Failure             → Circuit breaker opens
                        → Failover to standby endpoint
                        → Graceful degradation

Proctoring Service Down → Accept exam without proctoring
                        → Flag for manual review later
                        → Notify admin
```

---

## 13. MONITORING & OBSERVABILITY

### 13.1 Metrics to Monitor

```
Category                Metrics
──────────────────────────────────────────────────
Request Performance     - API latency (p50, p95, p99)
                        - Error rate
                        - Request volume

System Health           - Lambda duration
                        - Cold start count
                        - Concurrent executions
                        - Memory usage

Database                - Query latency
                        - Connection pool utilization
                        - Transaction throughput
                        - Replication lag

User Experience         - Page load time
                        - Time to interactive
                        - Cumulative layout shift

Business Metrics        - Exams completed
                        - Auto-grading accuracy
                        - Cheating detection rate
                        - System availability
```

### 13.2 Alerting Strategy

```
Alert                           Threshold           Action
──────────────────────────────────────────────────────────────────
High Error Rate                 >5% in 5 min        Page on-call
API Latency (p95)               >1s                 Investigate
Lambda Throttling               Any                 Scale concurrency
Database CPU                    >80%                Auto-scale / Alert
Disk Space                      >85%                Alert / Cleanup
Memory Utilization              >85%                Alert
Unhandled Exceptions            Any                 Alert + Log
Failed Proctoring Analysis      >1%                 Investigate
Low Test Coverage               <80%                CI/CD block
Security Scan Issues            Critical            Block deployment
```

---

## 14. DEPLOYMENT CHECKLIST

### Pre-Deployment

```
☐ Code review completed
☐ All tests passing (unit, integration, e2e)
☐ Security scan passed (OWASP Top 10)
☐ Performance benchmarks met
☐ Database migrations prepared
☐ Rollback plan documented
☐ Monitoring alerts configured
☐ Load testing completed
☐ Disaster recovery tested
☐ Team trained on deployment
```

### Post-Deployment

```
☐ Health checks passing
☐ No error spikes
☐ Performance within SLA
☐ User feedback positive
☐ Monitoring dashboards active
☐ Logs aggregated correctly
☐ Analytics pipeline working
☐ Scheduled maintenance task completed
☐ Documentation updated
☐ Incident response team on standby
```

---

## 15. QUICK REFERENCE: KEY DESIGN DECISIONS

| Decision | Rationale | Alternative |
|----------|-----------|-------------|
| Serverless-first | Zero infrastructure management, auto-scaling | Traditional VMs |
| PostgreSQL + MongoDB | SQL for structured, NoSQL for documents | All SQL / All NoSQL |
| JWT tokens | Stateless, scalable, standard | Session-based |
| WebRTC for video | Browser-native, peer-to-peer capable | RTMP / HLS |
| Redis for caching | Sub-millisecond latency, in-memory | Memcached |
| S3 for media | Unlimited storage, CDN integration | NAS / Local disk |
| SQS for messaging | Managed, decoupled, scaling | RabbitMQ / Kafka |
| CloudFront CDN | Global distribution, low latency | No CDN |
| Terraform IaC | Version control, reproducibility | Manual setup |

---

## CONCLUSION

This comprehensive System Design Document provides a blueprint for implementing **SOEMS** with:

✅ **Scalability** → 1000+ concurrent users with serverless elasticity
✅ **Security** → Multi-layer protection with encryption, RBAC, audit logging
✅ **Performance** → Sub-200ms API responses with caching & optimization
✅ **Reliability** → 99.99% uptime with fault tolerance & recovery mechanisms
✅ **Observability** → Comprehensive monitoring, logging, and alerting
✅ **Developer Experience** → Clear architecture, API-first design, IaC templates

The modular, event-driven architecture enables rapid feature development, seamless scaling, and easy maintenance for production deployment.

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Next Review:** March 2026
**Status:** Ready for Implementation

---

**For PDF Export:** Use browser Print to PDF (Ctrl+P) or use a markdown-to-PDF converter
**For Updates:** Maintain this document with each major system change