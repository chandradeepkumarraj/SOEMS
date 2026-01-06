import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

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
import UserManagementPage from './pages/admin/UserManagementPage';
import LiveMonitor from './pages/LiveMonitor';
import ProctorDashboard from './pages/ProctorDashboard';
import ProctorLayout from './components/layout/ProctorLayout';


import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    {/* Public & Auth */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Student Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                        <Route element={<StudentLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/student/exams" element={<StudentExams />} />
                            <Route path="/student/results" element={<StudentResultsList />} />
                            <Route path="/results/:id" element={<Results />} />
                        </Route>
                        {/* Exam Interface (Full Screen) */}
                        <Route path="/exam/:examId" element={<ExamInterface />} />
                    </Route>

                    {/* Teacher Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                        <Route path="/teacher/create-exam" element={<CreateExam />} />
                        <Route path="/teacher" element={<TeacherLayout />}>
                            <Route path="dashboard" element={<TeacherDashboard />} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="exams" element={<MyExams />} />
                            <Route path="students" element={<TeacherStudents />} />
                            <Route path="analytics/:examId" element={<ExamAnalytics />} />
                        </Route>
                    </Route>

                    {/* Admin Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/users" element={<UserManagementPage />} />
                            <Route path="/admin/monitor" element={<LiveMonitor />} />
                            <Route path="/admin/profile" element={<Profile />} />
                        </Route>
                    </Route>

                    {/* Proctor Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['proctor']} />}>
                        <Route element={<ProctorLayout />}>
                            <Route path="/proctor/dashboard" element={<ProctorDashboard />} />
                            <Route path="/proctor/profile" element={<Profile />} />
                        </Route>
                    </Route>

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
