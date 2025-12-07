# SOEMS - Online Examination Management System

An advanced, full-stack **Online Examination Management System** built with the **MERN Stack** (MongoDB, Express.js, React, Node.js) and **TypeScript**. Designed to facilitate secure, real-time, and efficient online assessments with dedicated portals for Students, Teachers, and Administrators.

## 🚀 Features

### 🎓 Student Portal
- **Dashboard**: View upcoming and past exams.
- **Secure Exam Interface**: Real-time timer, auto-submission, and full-screen enforcement.
- **Instant Results**: Immediate scoring and performance feedback (if enabled).
- **Profile Management**: Manage personal details and track progress.

### 👩‍🏫 Teacher Portal
- **Dashboard**: Comprehensive overview of created exams and student statistics.
- **Exam Management**: 
    - Create and Edit exams with a rich question builder.
    - Support for multiple question types (MCQ, etc.).
    - Set exam duration, date, and time.
- **Analytics & Insights**:
    - Real-time AI-powered insights on student performance.
    - Detailed question-level analysis (difficulty, correct response rate).
    - Score distribution charts.
- **Student Tracking**: View list of candidates and their individual performance.
- **Reports**: Download detailed exam reports in CSV format.

### 🛡️ Admin Portal
- **Live Monitoring**: Real-time proctoring of active exams (socket.io integration).
- **User Management**: Manage student and teacher accounts.
- **System Health**: Monitor server status and database connectivity.

## 🛠️ Tech Stack

- **Frontend**: React.js, TypeScript, Tailwind CSS, Framer Motion, Lucide React (Icons).
- **Backend**: Node.js, Express.js, TypeScript.
- **Database**: MongoDB (Mongoose ODM).
- **Real-time**: Socket.io (for live proctoring and notifications).
- **Authentication**: JWT (JSON Web Tokens) with role-based access control.

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local or Atlas connection string)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/chandradeepkumarraj/SOEMS.git
cd SOEMS
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
msg=Welcome to SOEMS API
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the development server:
```bash
npm run dev
```

The application should now be running at `http://localhost:5173`.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and create a pull request for any feature enhancements or bug fixes.

## 📄 License

This project is licensed under the ISC License.
