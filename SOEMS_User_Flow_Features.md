# SOEMS - User Flow & Feature Documentation
## Comprehensive User Journey and Feature Breakdown

---

## Table of Contents

1. [User Flow Diagrams](#1-user-flow-diagrams)
2. [Detailed Feature Breakdown](#2-detailed-feature-breakdown)
3. [Component Interaction Flows](#3-component-interaction-flows)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [Proctoring System Workflow](#5-proctoring-system-workflow)

---

## 1. User Flow Diagrams

### 1.1 Student Exam Taking Flow

```mermaid
flowchart TD
    A[Student Login] --> B{Authentication<br/>Successful?}
    B -->|No| A
    B -->|Yes| C[Student Dashboard]
    C --> D[View Available Exams]
    D --> E{Select Exam}
    E --> F[View Exam Details]
    F --> G{Start Exam?}
    G -->|No| D
    G -->|Yes| H[Validate Eligibility]
    H --> I{Eligible?}
    I -->|No| J[Show Error Message]
    J --> D
    I -->|Yes| K[Create Exam Session]
    K --> L[Enable Fullscreen]
    L --> M[Start Timer]
    M --> N[Display Questions]
    N --> O[Answer Questions]
    O --> P{Time Remaining?}
    P -->|Yes| O
    P -->|No| Q[Auto Submit]
    O --> R{Manual Submit?}
    R -->|Yes| S[Submit Exam]
    Q --> S
    S --> T[Calculate Score]
    T --> U[Save Result]
    U --> V[Display Results]
    V --> W[Return to Dashboard]
    
    style A fill:#3B82F6,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#10B981,stroke:#333,stroke-width:2px,color:#fff
    style S fill:#F59E0B,stroke:#333,stroke-width:2px,color:#fff
    style V fill:#10B981,stroke:#333,stroke-width:2px,color:#fff
```

### 1.2 Teacher Exam Creation Flow

```mermaid
flowchart TD
    A[Teacher Login] --> B[Teacher Dashboard]
    B --> C{Action Choice}
    C -->|Create Exam| D[Exam Creation Wizard]
    C -->|Manage Questions| E[Question Bank]
    C -->|View Analytics| F[Analytics Dashboard]
    
    D --> G[Step 1: Basic Info]
    G --> H[Enter Title & Description]
    H --> I[Step 2: Select Questions]
    I --> J[Browse Question Bank]
    J --> K[Add Questions to Exam]
    K --> L[Step 3: Configuration]
    L --> M[Set Duration & Schedule]
    M --> N[Configure Proctoring]
    N --> O[Assign Groups/Subgroups]
    O --> P[Step 4: Review]
    P --> Q{Publish?}
    Q -->|Save as Draft| R[Save Draft]
    Q -->|Publish| S[Publish Exam]
    R --> B
    S --> T[Notify Students]
    T --> B
    
    E --> U[Create Question]
    E --> V[Import CSV]
    E --> W[Edit Question]
    E --> X[Delete Question]
    U --> E
    V --> E
    W --> E
    X --> E
    
    F --> Y[View Score Distribution]
    F --> Z[Question Analysis]
    F --> AA[Student Performance]
    F --> AB[Export Results]
    
    style A fill:#3B82F6,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#10B981,stroke:#333,stroke-width:2px,color:#fff
    style S fill:#F59E0B,stroke:#333,stroke-width:2px,color:#fff
```

### 1.3 Admin User Management Flow

```mermaid
flowchart TD
    A[Admin Login] --> B[Admin Dashboard]
    B --> C{Action Choice}
    C -->|User Management| D[User Management Page]
    C -->|Live Monitoring| E[Live Monitor]
    C -->|System Health| F[System Health Dashboard]
    C -->|Group Management| G[Group Management]
    
    D --> H{User Action}
    H -->|Create User| I[User Creation Form]
    H -->|Bulk Import| J[CSV Upload]
    H -->|Edit User| K[User Edit Form]
    H -->|Delete User| L[Confirm Deletion]
    
    I --> M[Enter User Details]
    M --> N[Assign Role]
    N --> O[Generate Credentials]
    O --> P[Save User]
    P --> D
    
    J --> Q[Upload CSV File]
    Q --> R[Validate Data]
    R --> S{Valid?}
    S -->|No| T[Show Errors]
    T --> J
    S -->|Yes| U[Batch Create Users]
    U --> V[Show Import Report]
    V --> D
    
    E --> W[View Active Sessions]
    E --> X[Monitor Violations]
    E --> Y[Real-time Alerts]
    
    F --> Z[Database Status]
    F --> AA[Server Metrics]
    F --> AB[Active Connections]
    
    G --> AC[Create Group]
    G --> AD[Create Subgroup]
    G --> AE[Assign Students]
    
    style A fill:#3B82F6,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#10B981,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#EF4444,stroke:#333,stroke-width:2px,color:#fff
```

### 1.4 Proctor Monitoring Flow

```mermaid
flowchart TD
    A[Proctor Login] --> B[Proctor Dashboard]
    B --> C[Join Global Proctor Room]
    C --> D[View Active Exams]
    D --> E[Monitor Student Activity]
    E --> F{Violation Detected?}
    F -->|No| E
    F -->|Yes| G[Receive Alert]
    G --> H[Display Violation Details]
    H --> I{Action Required?}
    I -->|No| E
    I -->|Yes| J[Review Student Session]
    J --> K{Suspend Student?}
    K -->|No| L[Log Violation]
    K -->|Yes| M[Suspend Exam Session]
    L --> E
    M --> N[Notify Student]
    N --> E
    
    style A fill:#3B82F6,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#10B981,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#EF4444,stroke:#333,stroke-width:2px,color:#fff
    style M fill:#F59E0B,stroke:#333,stroke-width:2px,color:#fff
```

---

## 2. Detailed Feature Breakdown

### 2.1 Authentication System

#### 2.1.1 User Registration
- **Email Validation**: Real-time email format checking
- **Password Strength**: Minimum 8 characters with complexity requirements
- **Role Selection**: Student, Teacher, Admin, Proctor
- **Unique Constraints**: Email uniqueness verification
- **Auto-hashing**: Bcrypt password hashing on save

#### 2.1.2 User Login
- **Credential Verification**: Email and password matching
- **JWT Generation**: 30-day token with user payload
- **Role-based Redirect**: Automatic routing to role-specific dashboard
- **Remember Me**: Optional persistent login
- **Error Handling**: Clear error messages for invalid credentials

#### 2.1.3 Password Recovery
- **Security Questions**: Pre-configured questions for verification
- **Answer Verification**: Bcrypt comparison for security
- **Password Reset**: Ability to set new password
- **Email Notification**: Optional email confirmation

### 2.2 Student Features

#### 2.2.1 Dashboard
- **Upcoming Exams**: List of scheduled exams with countdown
- **Past Exams**: History of completed exams
- **Recent Results**: Quick view of latest scores
- **Performance Metrics**: Overall statistics and trends
- **Notifications**: Exam reminders and announcements

#### 2.2.2 Exam Interface
- **Question Navigation**:
  - Previous/Next buttons
  - Question palette with status indicators
  - Jump to specific question
  - Flag questions for review
  
- **Timer Management**:
  - Countdown display
  - Auto-save every 30 seconds
  - Warning at 5 minutes remaining
  - Auto-submit on time expiry
  
- **Answer Selection**:
  - Single-choice radio buttons
  - Clear selection option
  - Visual feedback on selection
  - Confirmation before submit
  
- **Proctoring Features**:
  - Fullscreen enforcement
  - Tab switch detection
  - Copy/paste prevention
  - Webcam monitoring (if enabled)
  - Violation counter display

#### 2.2.3 Results View
- **Score Summary**: Total score and percentage
- **Question-wise Breakdown**: Correct/incorrect indicators
- **Time Analysis**: Time spent per question
- **Correct Answers**: Display of correct options
- **Performance Comparison**: Rank among peers
- **Download Certificate**: PDF certificate generation

#### 2.2.4 Profile Management
- **Personal Information**: Name, email, phone, address
- **Avatar Upload**: Profile picture management
- **Bio**: Personal description
- **Institution**: Educational institution details
- **Password Change**: Secure password update
- **Theme Preference**: Light/dark mode toggle

### 2.3 Teacher Features

#### 2.3.1 Question Bank Management
- **Create Question**:
  - Question text editor
  - Multiple options (2-4)
  - Correct answer selection
  - Subject categorization
  - Difficulty level (easy/medium/hard)
  
- **Edit Question**:
  - Modify existing questions
  - Update options and answers
  - Change difficulty level
  
- **Delete Question**:
  - Confirmation dialog
  - Check for exam associations
  - Cascade handling
  
- **Bulk Import**:
  - CSV template download
  - File upload and validation
  - Error reporting
  - Batch creation
  - Import summary

#### 2.3.2 Exam Creation
- **Basic Information**:
  - Exam title
  - Description
  - Subject/course
  
- **Question Selection**:
  - Browse question bank
  - Filter by subject/difficulty
  - Add/remove questions
  - Question preview
  - Randomize order option
  
- **Scheduling**:
  - Start date and time
  - End date and time
  - Duration in minutes
  - Timezone handling
  
- **Proctoring Configuration**:
  - Enable/disable tab lock
  - Enable/disable fullscreen
  - Enable/disable input lock
  - Set violation threshold
  - Webcam requirement
  
- **Student Assignment**:
  - Select groups
  - Select subgroups
  - Individual student selection
  - Exclusion list
  
- **Publishing Options**:
  - Save as draft
  - Publish immediately
  - Schedule publication
  - Results visibility settings

#### 2.3.3 Exam Management
- **View Exams**: List of all created exams
- **Filter & Search**: By status, date, subject
- **Edit Exam**: Modify draft exams
- **Delete Exam**: Remove exam with confirmations
- **Duplicate Exam**: Clone existing exam
- **Archive Exam**: Move to archive
- **Publish Results**: Make results visible to students

#### 2.3.4 Analytics Dashboard
- **Score Distribution**:
  - Histogram chart
  - Mean, median, mode
  - Standard deviation
  - Pass/fail percentage
  
- **Question Analysis**:
  - Correct response rate per question
  - Average time spent per question
  - Difficulty assessment
  - Discrimination index
  
- **Student Performance**:
  - Top performers list
  - Bottom performers list
  - Individual student details
  - Performance trends
  
- **Comparison Metrics**:
  - Group-wise comparison
  - Subject-wise comparison
  - Historical comparison

#### 2.3.5 Report Generation
- **CSV Export**:
  - Student details
  - Scores and percentages
  - Question-wise answers
  - Time spent
  - Violation records
  
- **PDF Reports**:
  - Summary report
  - Detailed analysis
  - Charts and graphs
  - Custom branding

### 2.4 Admin Features

#### 2.4.1 User Management
- **Create User**:
  - Manual entry form
  - All user types
  - Credential generation
  - Email notification
  
- **Bulk Import**:
  - CSV template
  - Validation rules
  - Error handling
  - Success report
  
- **Edit User**:
  - Update details
  - Change role
  - Reset password
  - Activate/deactivate
  
- **Delete User**:
  - Soft delete option
  - Cascade handling
  - Data retention policy
  - Confirmation required

#### 2.4.2 Group Management
- **Create Group**:
  - Group name
  - Description
  - Department/course
  
- **Create Subgroup**:
  - Parent group selection
  - Subgroup name
  - Section/batch
  
- **Assign Students**:
  - Bulk assignment
  - Individual assignment
  - Move between groups
  - Remove from group

#### 2.4.3 Live Monitoring
- **Active Sessions**:
  - Real-time session count
  - Student list
  - Exam details
  - Time remaining
  
- **Violation Tracking**:
  - Live violation feed
  - Violation type breakdown
  - Student-wise violations
  - Auto-suspension alerts
  
- **System Metrics**:
  - Active users
  - Database connections
  - Server load
  - Response times

#### 2.4.4 System Health
- **Database Status**:
  - Connection status
  - Database size
  - Collection counts
  - Query performance
  
- **Server Metrics**:
  - CPU usage
  - Memory usage
  - Disk space
  - Network traffic
  
- **Application Health**:
  - Uptime
  - Error rates
  - API response times
  - WebSocket connections

### 2.5 Proctor Features

#### 2.5.1 Live Monitoring Dashboard
- **Active Exams**: List of ongoing exams
- **Student Activity**: Real-time student actions
- **Violation Alerts**: Instant notifications
- **Session Details**: Individual student sessions
- **Quick Actions**: Suspend, flag, message

#### 2.5.2 Violation Management
- **Alert Types**:
  - Tab switch
  - Fullscreen exit
  - Multiple faces
  - No face detected
  - Copy/paste attempt
  
- **Alert Details**:
  - Student information
  - Timestamp
  - Violation count
  - Screenshot (if available)
  
- **Actions**:
  - Log violation
  - Send warning
  - Suspend session
  - Contact student

---

## 3. Component Interaction Flows

### 3.1 Exam Submission Flow

```mermaid
sequenceDiagram
    participant S as Student Browser
    participant F as Frontend
    participant B as Backend API
    participant DB as MongoDB
    participant WS as WebSocket Server
    
    S->>F: Click Submit Exam
    F->>F: Validate all questions answered
    F->>B: POST /api/exams/:id/submit
    B->>DB: Fetch Exam Session
    DB-->>B: Session Data
    B->>DB: Fetch Exam Questions
    DB-->>B: Questions with Answers
    B->>B: Calculate Score
    B->>DB: Create Result Document
    DB-->>B: Result Saved
    B->>DB: Update Session Status
    DB-->>B: Session Updated
    B->>WS: Emit exam-submit event
    WS-->>F: Broadcast to monitors
    B-->>F: Return Result
    F->>S: Display Score & Feedback
```

### 3.2 Real-time Proctoring Flow

```mermaid
sequenceDiagram
    participant S as Student Browser
    participant WS as WebSocket Client
    participant WSS as WebSocket Server
    participant P as Proctor Dashboard
    participant DB as MongoDB
    
    S->>WS: Detect Tab Switch
    WS->>WSS: Emit proctor-alert
    WSS->>DB: Log Violation
    DB-->>WSS: Violation Saved
    WSS->>P: Broadcast Alert
    P->>P: Display Notification
    WSS->>DB: Increment Violation Count
    DB-->>WSS: Count Updated
    WSS->>WSS: Check Threshold
    alt Threshold Exceeded
        WSS->>DB: Suspend Session
        DB-->>WSS: Session Suspended
        WSS->>S: Force Submit
        S->>S: Display Suspension Message
    end
```

### 3.3 Question Bank to Exam Flow

```mermaid
sequenceDiagram
    participant T as Teacher
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    
    T->>F: Create New Exam
    F->>B: GET /api/questions
    B->>DB: Fetch All Questions
    DB-->>B: Questions List
    B-->>F: Return Questions
    F->>T: Display Question Bank
    T->>F: Select Questions
    T->>F: Configure Exam Settings
    T->>F: Click Publish
    F->>B: POST /api/exams
    B->>DB: Create Exam Document
    DB-->>B: Exam Created
    B->>DB: Link Questions
    DB-->>B: Questions Linked
    B-->>F: Return Exam ID
    F->>T: Show Success Message
```

---

## 4. Data Flow Architecture

### 4.1 Authentication Data Flow

```mermaid
flowchart LR
    A[User Input] --> B[Frontend Validation]
    B --> C[API Request]
    C --> D[Backend Validation]
    D --> E[Database Query]
    E --> F{User Exists?}
    F -->|No| G[Error Response]
    F -->|Yes| H[Password Verification]
    H --> I{Match?}
    I -->|No| G
    I -->|Yes| J[Generate JWT]
    J --> K[Return Token]
    K --> L[Store in LocalStorage]
    L --> M[Redirect to Dashboard]
    
    style A fill:#3B82F6,stroke:#333,stroke-width:2px,color:#fff
    style M fill:#10B981,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#EF4444,stroke:#333,stroke-width:2px,color:#fff
```

### 4.2 Exam Data Flow

```mermaid
flowchart TB
    A[Teacher Creates Exam] --> B[Exam Document Created]
    B --> C[Questions Linked]
    C --> D[Groups Assigned]
    D --> E[Exam Published]
    E --> F[Students View Exam]
    F --> G[Student Starts Exam]
    G --> H[Session Created]
    H --> I[Answers Saved]
    I --> J[Real-time Sync]
    J --> K[Exam Submitted]
    K --> L[Result Calculated]
    L --> M[Result Stored]
    M --> N[Teacher Views Analytics]
    
    style A fill:#3B82F6,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#F59E0B,stroke:#333,stroke-width:2px,color:#fff
    style L fill:#10B981,stroke:#333,stroke-width:2px,color:#fff
```

---

## 5. Proctoring System Workflow

### 5.1 Violation Detection System

```mermaid
flowchart TD
    A[Student in Exam] --> B{Monitor Events}
    B --> C[Tab Visibility API]
    B --> D[Fullscreen API]
    B --> E[Clipboard API]
    B --> F[Webcam Stream]
    
    C --> G{Tab Hidden?}
    G -->|Yes| H[Trigger Tab Switch Alert]
    G -->|No| B
    
    D --> I{Fullscreen Exited?}
    I -->|Yes| J[Trigger Fullscreen Alert]
    I -->|No| B
    
    E --> K{Copy/Paste Detected?}
    K -->|Yes| L[Trigger Input Alert]
    K -->|No| B
    
    F --> M{Face Detection}
    M --> N{Multiple Faces?}
    N -->|Yes| O[Trigger Multiple Face Alert]
    N -->|No| P{No Face?}
    P -->|Yes| Q[Trigger No Face Alert]
    P -->|No| B
    
    H --> R[Log Violation]
    J --> R
    L --> R
    O --> R
    Q --> R
    
    R --> S[Increment Counter]
    S --> T{Threshold Reached?}
    T -->|Yes| U[Auto-suspend Session]
    T -->|No| V[Continue Monitoring]
    U --> W[Force Submit Exam]
    V --> B
    
    style A fill:#3B82F6,stroke:#333,stroke-width:2px,color:#fff
    style R fill:#EF4444,stroke:#333,stroke-width:2px,color:#fff
    style U fill:#F59E0B,stroke:#333,stroke-width:2px,color:#fff
```

### 5.2 Proctoring Configuration Matrix

| **Feature** | **Purpose** | **Detection Method** | **Action** |
|-------------|-------------|---------------------|------------|
| **Tab Lock** | Prevent tab switching | Visibility API | Log violation, warn student |
| **Fullscreen** | Ensure focused environment | Fullscreen API | Log violation, force fullscreen |
| **Input Lock** | Prevent copy/paste | Clipboard API | Block action, log violation |
| **Face Detection** | Verify student identity | Webcam + ML | Alert proctor, log violation |
| **Multiple Faces** | Detect cheating | Webcam + ML | Alert proctor, log violation |
| **Violation Threshold** | Auto-suspend cheaters | Counter check | Suspend session, force submit |

---

## Appendix: Feature Comparison Matrix

### Student vs Teacher vs Admin Features

| **Feature** | **Student** | **Teacher** | **Admin** | **Proctor** |
|-------------|-------------|-------------|-----------|-------------|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ |
| **Take Exams** | ✅ | ❌ | ❌ | ❌ |
| **View Results** | ✅ (Own) | ✅ (All) | ✅ (All) | ❌ |
| **Create Exams** | ❌ | ✅ | ❌ | ❌ |
| **Create Questions** | ❌ | ✅ | ❌ | ❌ |
| **User Management** | ❌ | ❌ | ✅ | ❌ |
| **Group Management** | ❌ | ❌ | ✅ | ❌ |
| **Live Monitoring** | ❌ | ✅ (Own Exams) | ✅ (All) | ✅ (All) |
| **Analytics** | ✅ (Own) | ✅ (Own Exams) | ✅ (All) | ❌ |
| **Export Reports** | ❌ | ✅ | ✅ | ❌ |
| **System Health** | ❌ | ❌ | ✅ | ❌ |
| **Bulk Import** | ❌ | ✅ (Questions) | ✅ (Users) | ❌ |
| **Profile Edit** | ✅ | ✅ | ✅ | ✅ |
| **Theme Toggle** | ✅ | ✅ | ✅ | ✅ |

---

**Document End**
