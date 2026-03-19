import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { getMe } from './services/authService';

// Public & Auth
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

// Student Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentExams = lazy(() => import('./pages/StudentExams'));
const StudentResultsList = lazy(() => import('./pages/StudentResultsList'));
const Profile = lazy(() => import('./pages/Profile'));
const ExamInterface = lazy(() => import('./pages/ExamInterface'));
const Results = lazy(() => import('./pages/Results'));
const StudentLayout = lazy(() => import('./components/layout/StudentLayout'));

// Teacher Pages
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const CreateExam = lazy(() => import('./pages/CreateExam'));
const ExamAnalytics = lazy(() => import('./pages/ExamAnalytics'));
const MyExams = lazy(() => import('./pages/MyExams'));
const TeacherStudents = lazy(() => import('./pages/TeacherStudents'));
const TeacherLayout = lazy(() => import('./components/layout/TeacherLayout'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const AIControlPanel = lazy(() => import('./pages/admin/AIControlPanel'));
const LiveMonitor = lazy(() => import('./pages/LiveMonitor'));
const ProctorDashboard = lazy(() => import('./pages/ProctorDashboard'));
const ProctorDetail = lazy(() => import('./pages/ProctorDetail'));
const ProctorLayout = lazy(() => import('./components/layout/ProctorLayout'));
const Maintenance = lazy(() => import('./pages/Maintenance'));

import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import { ThemeProvider } from './context/ThemeContext';

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
);

function App() {
    useEffect(() => {
        const validateSession = async () => {
            const user = localStorage.getItem('user');
            if (user) {
                try {
                    await getMe();
                } catch (error) {
                    console.error('Session validation failed:', error);
                }
            }
        };
        validateSession();
    }, []);

    return (
        <ThemeProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* Public & Auth */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/maintenance" element={<Maintenance />} />

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
                                <Route path="/admin/monitor/:examId/:studentId" element={<ProctorDetail />} />
                                <Route path="/admin/ai-settings" element={<AIControlPanel />} />
                                <Route path="/admin/profile" element={<Profile />} />
                            </Route>
                        </Route>

                        {/* Proctor Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['proctor']} />}>
                            <Route element={<ProctorLayout />}>
                                <Route path="/proctor/dashboard" element={<ProctorDashboard />} />
                                <Route path="/proctor/monitor/:examId/:studentId" element={<ProctorDetail />} />
                                <Route path="/proctor/profile" element={<Profile />} />
                            </Route>
                        </Route>

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </Router>
        </ThemeProvider>
    );
}

export default App;
