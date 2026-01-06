import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // No Link needed if using Button navigate
import { getExams } from '../services/examService';
import { Search, Clock, Calendar, ArrowRight, FileText } from 'lucide-react';
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
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">Exam Hall</h1>
                    <p className="text-slate-900 dark:text-slate-400 font-bold italic">Secure terminal for real-time academic assessments.</p>
                </div>
                <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Scan for active sessions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border-2 border-slate-300 dark:border-slate-800 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full md:w-64 font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-600 transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredExams.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed">
                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-200 dark:border-slate-700">
                        <FileText className="h-8 w-8 text-slate-900 dark:text-slate-100" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Terminal Clear</h3>
                    <p className="text-slate-900 dark:text-slate-400 font-bold italic">No active assessment cycles detected in your registry.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((exam, index) => (
                        <motion.div
                            key={exam._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-slate-800 hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col"
                        >
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform duration-300">
                                        {exam.title.charAt(0)}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${exam.studentStatus === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        exam.studentStatus === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            new Date() < new Date(exam.startTime) ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                new Date() > new Date(exam.endTime) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                        {exam.studentStatus === 'completed' ? 'Completed' :
                                            exam.studentStatus === 'in-progress' ? 'In Progress' :
                                                new Date() < new Date(exam.startTime) ? 'Upcoming' :
                                                    new Date() > new Date(exam.endTime) ? 'Expired' :
                                                        'Active'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-2 group-hover:text-primary transition-colors uppercase tracking-tight">
                                    {exam.title}
                                </h3>
                                <p className="text-sm text-slate-900 dark:text-slate-400 font-bold leading-relaxed line-clamp-2 mb-4">
                                    {exam.description || 'Secure session: No additional metadata provided.'}
                                </p>

                                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center text-xs text-slate-900 dark:text-slate-300 font-black uppercase tracking-widest">
                                        <Clock className="h-4 w-4 mr-2 text-primary" />
                                        Duration: {exam.duration} Minutes
                                    </div>
                                    <div className="flex items-center text-xs text-slate-900 dark:text-slate-300 font-black uppercase tracking-widest">
                                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                                        Launch: {new Date(exam.startTime).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800">
                                {exam.studentStatus === 'completed' ? (
                                    <Button
                                        className="w-full justify-center bg-green-600 hover:bg-green-700"
                                        onClick={() => navigate(`/results/${exam._id}`)}
                                        disabled={!exam.resultsPublished}
                                    >
                                        {exam.resultsPublished ? 'View Results' : 'Results Pending'}
                                    </Button>
                                ) : (
                                    <Button
                                        className={`w-full justify-center border-none shadow-lg transition-all ${exam.studentStatus === 'in-progress'
                                            ? 'bg-primary hover:bg-primary-dark shadow-primary/20'
                                            : 'bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-black dark:hover:bg-white shadow-slate-900/10'
                                            }`}
                                        onClick={() => navigate(`/exam/${exam._id}`)}
                                        disabled={new Date() > new Date(exam.endTime)}
                                    >
                                        {exam.studentStatus === 'in-progress' ? 'Resume Exam' : 'Start Exam'}
                                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

