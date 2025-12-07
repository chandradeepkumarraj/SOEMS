import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyResults } from '../services/resultService';
import { Search, Trophy, Calendar, CheckCircle2, ChevronRight, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentResultsList() {
    const navigate = useNavigate();
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const data = await getMyResults();
                setResults(data);
            } catch (error) {
                console.error('Failed to fetch results:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const filteredResults = results.filter(r =>
        (r.examId?.title || 'Unknown Exam').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Performance History</h1>
                    <p className="text-gray-500">Track your progress and review past exam results.</p>
                </div>
                <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full md:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredResults.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                    <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No Results Yet</h3>
                    <p className="text-gray-500">Complete an exam to see your performance metrics here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredResults.map((result, index) => {
                        const percentage = (result.score / result.totalPoints) * 100;
                        const isPass = percentage >= 60; // Assuming 60% pass

                        return (
                            <motion.div
                                key={result._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => navigate(`/results/${result._id}`)}
                                className="group bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:border-primary/50 hover:shadow-md cursor-pointer transition-all duration-300"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center border-4 ${isPass ? 'border-green-100 bg-green-50 text-green-600' : 'border-red-100 bg-red-50 text-red-600'
                                            }`}>
                                            <span className="text-sm font-bold">{Math.round(percentage)}%</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                {result.examId?.title || 'Unknown Exam'}
                                            </h3>
                                            <div className="flex items-center text-sm text-gray-500 gap-4 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(result.submittedAt).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Trophy className="h-3 w-3" />
                                                    {result.score} / {result.totalPoints} pts
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6">
                                        <div className="text-right hidden sm:block">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {isPass ? 'Pass' : 'Needs Improvement'}
                                            </span>
                                        </div>
                                        <div className="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all">
                                            <ChevronRight className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
