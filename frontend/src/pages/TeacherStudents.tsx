import { useEffect, useState } from 'react';
import { Search, Mail, BookOpen } from 'lucide-react';
import { getMyStudents } from '../services/userService';

export default function TeacherStudents() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const data = await getMyStudents();
                setStudents(data);
            } catch (error) {
                console.error('Failed to fetch students:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
                <p className="text-gray-500">Students who have taken your exams.</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">All Candidates</h2>
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="px-6 py-4 font-medium">Student</th>
                                <th className="px-6 py-4 font-medium">Contact</th>
                                <th className="px-6 py-4 font-medium">Exams Taken</th>
                                <th className="px-6 py-4 font-medium">Avg. Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading students...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No candidates found.</td></tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={student.avatarUrl || `https://ui-avatars.com/api/?name=${student.name}&background=random`}
                                                    alt={student.name}
                                                    className="h-10 w-10 rounded-full object-cover bg-gray-200"
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900">{student.name}</div>
                                                    <div className="text-xs text-gray-500">ID: #{student._id.slice(-4)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                {student.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-blue-500" />
                                                <span className="font-medium">{student.examsTaken}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.avgScore >= 80 ? 'bg-green-100 text-green-800' :
                                                    student.avgScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {student.avgScore}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
