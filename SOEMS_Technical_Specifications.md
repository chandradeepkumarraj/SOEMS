# SOEMS - Technical Specifications & Implementation Guide
## Part 2: Technology Stack, API Documentation, and Security

---

## 6. Technology Stack

### 6.1 Backend Technologies

#### 6.1.1 Core Framework
- **Node.js** (v18+): JavaScript runtime environment
- **Express.js** (v4.18.2): Web application framework
- **TypeScript** (v5.3.3): Type-safe JavaScript

#### 6.1.2 Database
- **MongoDB** (v8.0.3): NoSQL document database
- **Mongoose** (v8.0.3): ODM for MongoDB

#### 6.1.3 Authentication & Security
- **jsonwebtoken** (v9.0.2): JWT implementation
- **bcryptjs** (v2.4.3): Password hashing
- **helmet** (v7.1.0): Security headers
- **cors** (v2.8.5): Cross-origin resource sharing

#### 6.1.4 Real-time Communication
- **socket.io** (v4.8.1): WebSocket library

#### 6.1.5 File Processing
- **multer** (v1.4.5-lts.1): File upload middleware
- **csv-parser** (v3.0.0): CSV parsing
- **json2csv** (v6.0.0-alpha.2): JSON to CSV conversion

#### 6.1.6 Validation
- **zod** (v3.22.4): Schema validation

#### 6.1.7 Development Tools
- **nodemon** (v3.0.2): Auto-restart on file changes
- **ts-node** (v10.9.2): TypeScript execution
- **eslint** (v8.56.0): Code linting
- **prettier** (v3.1.1): Code formatting

### 6.2 Frontend Technologies

#### 6.2.1 Core Framework
- **React** (v18.3.1): UI library
- **TypeScript** (v5.6.2): Type-safe JavaScript
- **Vite** (v6.0.1): Build tool and dev server

#### 6.2.2 Routing
- **react-router-dom** (v6.28.0): Client-side routing

#### 6.2.3 Styling
- **Tailwind CSS** (v3.4.16): Utility-first CSS framework
- **PostCSS** (v8.4.49): CSS processing
- **Autoprefixer** (v10.4.20): CSS vendor prefixing
- **tailwind-merge** (v2.5.5): Tailwind class merging
- **clsx** (v2.1.1): Conditional class names

#### 6.2.4 UI Components & Icons
- **lucide-react** (v0.468.0): Icon library
- **react-icons** (v5.5.0): Additional icons
- **framer-motion** (v11.13.1): Animation library

#### 6.2.5 Data Visualization
- **recharts** (v3.6.0): Chart library

#### 6.2.6 3D Graphics
- **three** (v0.182.0): 3D library for particle effects

#### 6.2.7 Form Management
- **react-hook-form** (v7.70.0): Form state management
- **@hookform/resolvers** (v5.2.2): Form validation resolvers

#### 6.2.8 HTTP Client
- **axios** (v1.13.2): HTTP client

#### 6.2.9 Real-time Communication
- **socket.io-client** (v4.8.1): WebSocket client

#### 6.2.10 File Processing
- **papaparse** (v5.5.3): CSV parsing
- **jspdf** (v4.0.0): PDF generation
- **html2canvas** (v1.4.1): HTML to canvas conversion

#### 6.2.11 Validation
- **zod** (v4.3.5): Schema validation

#### 6.2.12 Development Tools
- **ESLint** (v9.15.0): Code linting
- **@vitejs/plugin-react** (v4.3.4): React plugin for Vite

### 6.3 DevOps & Deployment

#### 6.3.1 Containerization
- **Docker**: Container platform
- **Docker Compose**: Multi-container orchestration

#### 6.3.2 Web Server
- **Nginx**: Reverse proxy and static file serving

#### 6.3.3 Environment Management
- **dotenv** (v16.3.1): Environment variable management

---

## 7. API Endpoints

### 7.1 Authentication Routes (`/api/auth`)

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/forgot-password` | Reset password | No |
| GET | `/me` | Get current user | Yes |

### 7.2 User Routes (`/api/users`)

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| GET | `/` | Get all users | Yes (Admin) |
| GET | `/:id` | Get user by ID | Yes |
| PUT | `/:id` | Update user | Yes |
| DELETE | `/:id` | Delete user | Yes (Admin) |

### 7.3 Question Routes (`/api/questions`)

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| POST | `/` | Create question | Yes (Teacher) |
| GET | `/` | Get all questions | Yes (Teacher) |
| GET | `/:id` | Get question by ID | Yes (Teacher) |
| PUT | `/:id` | Update question | Yes (Teacher) |
| DELETE | `/:id` | Delete question | Yes (Teacher) |
| POST | `/bulk-import` | Bulk import questions | Yes (Teacher) |

### 7.4 Exam Routes (`/api/exams`)

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| POST | `/` | Create exam | Yes (Teacher) |
| GET | `/` | Get all exams | Yes |
| GET | `/teacher/:teacherId` | Get teacher's exams | Yes (Teacher) |
| GET | `/student/available` | Get available exams for student | Yes (Student) |
| GET | `/:id` | Get exam by ID | Yes |
| PUT | `/:id` | Update exam | Yes (Teacher) |
| DELETE | `/:id` | Delete exam | Yes (Teacher) |
| POST | `/:id/start` | Start exam session | Yes (Student) |
| POST | `/:id/submit` | Submit exam | Yes (Student) |
| POST | `/:id/submit-answer` | Submit single answer | Yes (Student) |
| GET | `/:id/session` | Get exam session | Yes (Student) |
| GET | `/:id/analytics` | Get exam analytics | Yes (Teacher) |
| POST | `/:id/violation` | Record violation | Yes (Student) |
| PUT | `/:id/publish-results` | Publish exam results | Yes (Teacher) |

### 7.5 Result Routes (`/api/results`)

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| GET | `/student/:studentId` | Get student results | Yes (Student) |
| GET | `/exam/:examId` | Get exam results | Yes (Teacher) |
| GET | `/exam/:examId/export` | Export results to CSV | Yes (Teacher) |
| GET | `/:id` | Get result by ID | Yes |

### 7.6 Admin Routes (`/api/admin`)

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| POST | `/users` | Create user | Yes (Admin) |
| PUT | `/users/:id` | Update user | Yes (Admin) |
| DELETE | `/users/:id` | Delete user | Yes (Admin) |
| POST | `/users/bulk-import` | Bulk import users | Yes (Admin) |
| GET | `/health` | Get system health | Yes (Admin) |
| GET | `/active-sessions` | Get active exam sessions | Yes (Admin) |
| GET | `/stats` | Get system statistics | Yes (Admin) |

### 7.7 Group Routes (`/api/groups`)

| **Method** | **Endpoint** | **Description** | **Auth Required** |
|------------|--------------|-----------------|-------------------|
| POST | `/` | Create group | Yes (Admin) |
| GET | `/` | Get all groups | Yes |
| GET | `/:id` | Get group by ID | Yes |
| PUT | `/:id` | Update group | Yes (Admin) |
| DELETE | `/:id` | Delete group | Yes (Admin) |
| POST | `/:id/subgroups` | Create subgroup | Yes (Admin) |
| GET | `/:id/subgroups` | Get group subgroups | Yes |
| PUT | `/:id/assign-students` | Assign students to group | Yes (Admin) |

---

## 8. Security Features

### 8.1 Authentication Security

#### 8.1.1 Password Security
- **Hashing Algorithm**: bcrypt with salt rounds = 10
- **Password Storage**: Never stored in plain text
- **Password Validation**: Enforced on client and server side

#### 8.1.2 JWT Implementation
- **Token Generation**: On successful login
- **Token Expiry**: 30 days
- **Token Storage**: Client-side (localStorage)
- **Token Verification**: Middleware on protected routes
- **Payload**: User ID and role

### 8.2 Authorization

#### 8.2.1 Role-Based Access Control (RBAC)
- **Roles**: Student, Teacher, Admin, Proctor
- **Middleware**: `authMiddleware` with role checking
- **Route Protection**: Role-specific route guards

#### 8.2.2 Resource Ownership
- **Validation**: Users can only access their own resources
- **Teacher Resources**: Can only modify their own exams/questions
- **Student Resources**: Can only view their own results

### 8.3 API Security

#### 8.3.1 Helmet.js
- **Purpose**: Set security-related HTTP headers
- **Features**:
  - XSS protection
  - Content Security Policy
  - HSTS (HTTP Strict Transport Security)
  - Frame protection

#### 8.3.2 CORS Configuration
- **Allowed Origins**: Configurable via environment
- **Methods**: GET, POST, PUT, DELETE
- **Credentials**: Enabled for authenticated requests

### 8.4 Input Validation

#### 8.4.1 Schema Validation
- **Library**: Zod
- **Application**: Request body validation
- **Error Handling**: Detailed validation errors

#### 8.4.2 Database Validation
- **Mongoose Schemas**: Built-in validation
- **Custom Validators**: Email, phone, roll number
- **Unique Constraints**: Email, roll number

### 8.5 Exam Security

#### 8.5.1 Proctoring Features
- **Tab Lock**: Detect tab switching
- **Fullscreen Enforcement**: Require fullscreen mode
- **Input Lock**: Prevent copy/paste
- **Violation Threshold**: Auto-suspend after limit

#### 8.5.2 Session Management
- **Unique Sessions**: One session per student per exam
- **Session Expiry**: Auto-expire after exam end time
- **Real-time Sync**: Prevent data loss

---

## 9. Real-time Features

### 9.1 Socket.io Implementation

#### 9.1.1 Server Configuration
- **File**: `backend/src/socket.ts`
- **CORS**: Configured for frontend URL
- **Connection Handling**: Automatic reconnection

#### 9.1.2 Event Types

##### Student Events
- **`exam-start`**: Emitted when student starts exam
  - **Data**: `{ examId, studentId }`
  - **Broadcast**: To exam room and global proctor room
  
- **`exam-submit`**: Emitted when student submits exam
  - **Data**: `{ examId, studentId }`
  - **Broadcast**: To exam room and global proctor room
  
- **`proctor-alert`**: Emitted on violation detection
  - **Data**: `{ examId, studentId, studentName, studentRollNo, type, message }`
  - **Broadcast**: To exam room and global proctor room

##### Room Management
- **`join-room`**: Join specific exam or proctor room
  - **Data**: `{ roomId }`
  
- **`leave-room`**: Leave specific room
  - **Data**: `{ roomId }`

#### 9.1.3 Room Structure
- **Exam Rooms**: `examId` - All monitors for specific exam
- **Global Proctor Room**: `global-proctor-room` - All proctors

### 9.2 Live Monitoring Dashboard

#### 9.2.1 Features
- Real-time student activity feed
- Violation alerts with severity levels
- Active session count
- Student status indicators

#### 9.2.2 Alert Types
- **Tab Switch**: Student switched browser tab
- **Fullscreen Exit**: Student exited fullscreen
- **Multiple Faces**: Multiple faces detected in webcam
- **No Face**: No face detected in webcam
- **Copy/Paste**: Attempted copy or paste operation

---

## 10. User Interfaces

### 10.1 Design System

#### 10.1.1 Color Palette
- **Primary**: Blue (#3B82F6)
- **Secondary**: Slate (#64748B)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)
- **Background**: White/Dark mode support

#### 10.1.2 Typography
- **Font Family**: System fonts with fallbacks
- **Headings**: Bold, varying sizes
- **Body**: Regular weight, 16px base

#### 10.1.3 Components
- **Buttons**: Primary, secondary, ghost variants
- **Inputs**: Text, password, select, textarea
- **Cards**: Elevated with shadows
- **Modals**: Centered overlays
- **Alerts**: Color-coded notifications

### 10.2 Responsive Design
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Approach**: Mobile-first with Tailwind breakpoints

### 10.3 Theme Support
- **Light Mode**: Default
- **Dark Mode**: Toggle-based
- **Persistence**: localStorage
- **Context**: ThemeContext provider

### 10.4 Animations
- **Library**: Framer Motion
- **Usage**: Page transitions, card hover effects
- **3D Effects**: Three.js particle system on landing page

---

## Appendix A: File Structure

### Backend Structure
```
backend/
├── src/
│   ├── config/
│   │   └── db.ts                 # MongoDB connection
│   ├── controllers/
│   │   ├── adminController.ts    # Admin operations
│   │   ├── authController.ts     # Authentication
│   │   ├── examController.ts     # Exam management
│   │   ├── examStatsController.ts # Analytics
│   │   ├── groupController.ts    # Group management
│   │   ├── questionController.ts # Question bank
│   │   ├── resultController.ts   # Result processing
│   │   └── userController.ts     # User management
│   ├── middleware/
│   │   └── authMiddleware.ts     # JWT verification
│   ├── models/
│   │   ├── Exam.ts              # Exam schema
│   │   ├── ExamSession.ts       # Session tracking
│   │   ├── Group.ts             # Group schema
│   │   ├── Question.ts          # Question schema
│   │   ├── Result.ts            # Result schema
│   │   ├── Subgroup.ts          # Subgroup schema
│   │   ├── User.ts              # User schema with discriminators
│   │   └── Violation.ts         # Violation schema
│   ├── routes/
│   │   ├── adminRoutes.ts       # Admin endpoints
│   │   ├── authRoutes.ts        # Auth endpoints
│   │   ├── examRoutes.ts        # Exam endpoints
│   │   ├── groupRoutes.ts       # Group endpoints
│   │   ├── questionRoutes.ts    # Question endpoints
│   │   ├── resultRoutes.ts      # Result endpoints
│   │   └── userRoutes.ts        # User endpoints
│   ├── utils/
│   │   ├── examWorker.ts        # Background job for exam expiry
│   │   └── seeder.ts            # Database seeding
│   ├── server.ts                # Express server setup
│   └── socket.ts                # Socket.io configuration
├── uploads/                     # File upload directory
├── package.json
├── tsconfig.json
└── Dockerfile
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── SystemHealth.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   └── users/
│   │   │       ├── BulkImportWizard.tsx
│   │   │       └── UserList.tsx
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── landing/
│   │   │   ├── AnalyticsSection.tsx
│   │   │   ├── FeatureCards.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── ParticleSystem.tsx
│   │   │   └── ProctoringSection.tsx
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── ProctorLayout.tsx
│   │   │   ├── StudentLayout.tsx
│   │   │   └── TeacherLayout.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Input.tsx
│   ├── context/
│   │   └── ThemeContext.tsx
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── ProctorDashboard.tsx
│   │   │   └── UserManagementPage.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── CreateExam.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ExamAnalytics.tsx
│   │   ├── ExamInterface.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── Landing.tsx
│   │   ├── LandingPage.tsx
│   │   ├── LiveMonitor.tsx
│   │   ├── Login.tsx
│   │   ├── MyExams.tsx
│   │   ├── ProctorDashboard.tsx
│   │   ├── ProctorDetail.tsx
│   │   ├── Profile.tsx
│   │   ├── Register.tsx
│   │   ├── Results.tsx
│   │   ├── StudentExams.tsx
│   │   ├── StudentResultsList.tsx
│   │   ├── TeacherDashboard.tsx
│   │   └── TeacherStudents.tsx
│   ├── services/
│   │   ├── adminService.ts
│   │   ├── authService.ts
│   │   ├── examService.ts
│   │   ├── questionService.ts
│   │   ├── resultService.ts
│   │   ├── socket.ts
│   │   └── userService.ts
│   ├── utils/
│   │   └── cn.ts
│   ├── App.tsx                  # Route configuration
│   ├── config.ts                # API configuration
│   ├── index.css                # Global styles
│   └── main.tsx                 # React entry point
├── public/
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

---

## Appendix B: Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/soems
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

---

**Document End**
