import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateExam from './pages/CreateExam';
import ExamAnalytics from './pages/ExamAnalytics';
import AdminDashboard from './pages/AdminDashboard';
import LiveMonitor from './pages/LiveMonitor';
import ProctorDetail from './pages/ProctorDetail';
import ExamInterface from './pages/ExamInterface';
import Results from './pages/Results';
import Profile from './pages/Profile';
import MyExams from './pages/MyExams';
import TeacherStudents from './pages/TeacherStudents';
import TeacherLayout from './components/layout/TeacherLayout';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/teacher/create-exam" element={<CreateExam />} />
                <Route path="/teacher" element={<TeacherLayout />}>
                    <Route path="dashboard" element={<TeacherDashboard />} />
                    <Route path="exams" element={<MyExams />} />
                    <Route path="students" element={<TeacherStudents />} />
                    <Route path="analytics/:examId" element={<ExamAnalytics />} />
                </Route>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/monitor" element={<LiveMonitor />} />
                <Route path="/admin/monitor/:studentId" element={<ProctorDetail />} />
                <Route path="/exam/:examId" element={<ExamInterface />} />
                <Route path="/results/:examId" element={<Results />} />
            </Routes>
        </Router>
    );
}

export default App;
