import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import Dashboard from './pages/Dashboard';
import StudentExams from './pages/StudentExams';
import StudentResultsList from './pages/StudentResultsList';
import Profile from './pages/Profile';
import ExamInterface from './pages/ExamInterface';
import Results from './pages/Results';
import StudentLayout from './components/layout/StudentLayout';

// Teacher Pages
import TeacherDashboard from './pages/TeacherDashboard';
import CreateExam from './pages/CreateExam';
import ExamAnalytics from './pages/ExamAnalytics';
import MyExams from './pages/MyExams';
import TeacherStudents from './pages/TeacherStudents';
import TeacherLayout from './components/layout/TeacherLayout';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import LiveMonitor from './pages/LiveMonitor';
import UserManagement from './components/admin/UserManagement';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public & Auth */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Student Routes (Wrapped in Layout) */}
                <Route element={<StudentLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/student/exams" element={<StudentExams />} />
                    <Route path="/student/results" element={<StudentResultsList />} />
                    <Route path="/results/:examId" element={<Results />} />
                </Route>

                {/* Exam Interface (Full Screen, No Layout) */}
                <Route path="/exam/:examId" element={<ExamInterface />} />

                {/* Teacher Routes */}
                <Route path="/teacher/create-exam" element={<CreateExam />} />
                <Route path="/teacher" element={<TeacherLayout />}>
                    <Route path="dashboard" element={<TeacherDashboard />} />
                    <Route path="exams" element={<MyExams />} />
                    <Route path="students" element={<TeacherStudents />} />
                    <Route path="analytics/:examId" element={<ExamAnalytics />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/monitor" element={<LiveMonitor />} />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
