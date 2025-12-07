import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // No Link needed if using Button navigate
import { getExams } from '../services/examService';
import { Search, Clock, Calendar, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';

export default function StudentExams() {
    const navigate = useNavigate();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const data = await getExams();
                // Filter for published regular exams
                setExams(data.filter((e: any) => e.status === 'published'));
            } catch (error) {
                console.error('Failed to fetch exams:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Exam Hall</h1>
                    <p className="text-gray-500">View and take your scheduled examinations.</p>
                </div>
                <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Find an exam..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full md:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredExams.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                    <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No Exams Available</h3>
                    <p className="text-gray-500">You're all caught up! Check back later for new assignments.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((exam, index) => (
                        <motion.div
                            key={exam._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col"
                        >
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform duration-300">
                                        {exam.title.charAt(0)}
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        Active
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                                    {exam.title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                    {exam.description || 'No description provided.'}
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                        {exam.duration} Minutes
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                        {new Date(exam.startTime).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <Button
                                    className="w-full justify-center group-hover:bg-primary group-hover:text-white"
                                    onClick={() => navigate(`/exam/${exam._id}`)}
                                >
                                    Start Exam <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Icon helper
function FileText({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
    )
}
