import { useState } from 'react';
import Papa from 'papaparse';
import { AlertCircle, CheckCircle2, FileUp, X, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { importUsersCode } from '../../../services/adminService';

interface BulkImportWizardProps {
    onClose: () => void;
    onSuccess: () => void;
    groups: any[];
    subgroups: any[];
}

interface CSVRow {
    name: string;
    email: string;
    rollNo: string;
    phoneNumber: string;
    password?: string;
    role?: string;
}

interface ValidationResult {
    row: CSVRow;
    isValid: boolean;
    errors: string[];
    index: number;
}

export default function BulkImportWizard({ onClose, onSuccess, groups, subgroups }: BulkImportWizardProps) {
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview

    const [parsedData, setParsedData] = useState<ValidationResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedSubgroup, setSelectedSubgroup] = useState('');
    const [filteredSubgroups, setFilteredSubgroups] = useState<any[]>([]);
    const [defaultPassword, setDefaultPassword] = useState('exam123');

    const handleGroupChange = (groupId: string) => {
        setSelectedGroup(groupId);
        // Handle both populated object and string ID for groupId
        setFilteredSubgroups(subgroups.filter(s => {
            const sGroupId = typeof s.groupId === 'object' && s.groupId !== null ? s.groupId._id : s.groupId;
            return sGroupId === groupId;
        }));
        setSelectedSubgroup('');
    };

    const normalizeHeader = (header: string): string => {
        const h = header.toLowerCase().trim();
        if (['name', 'fullname', 'full name', 'student name'].includes(h)) return 'name';
        if (['email', 'e-mail', 'mail'].includes(h)) return 'email';
        if (['roll', 'rollno', 'roll number', 'roll_no'].includes(h)) return 'rollNo';
        if (['phone', 'phonenumber', 'mobile', 'contact'].includes(h)) return 'phoneNumber';
        if (['password', 'pass'].includes(h)) return 'password';
        if (['role', 'type'].includes(h)) return 'role';
        return header; // Return original if no match
    };

    const validateRow = (row: any, index: number): ValidationResult => {
        const errors: string[] = [];

        // Normalize keys for this row
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
            normalizedRow[normalizeHeader(key)] = row[key];
        });

        // Required Fields
        if (!normalizedRow.name || normalizedRow.name.trim().length < 2) errors.push('Name is required');
        if (!normalizedRow.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRow.email)) errors.push('Invalid email');

        // Check for 13 digit roll number
        if (!normalizedRow.rollNo || !/^\d{13}$/.test(String(normalizedRow.rollNo))) errors.push('Roll No must be 13 digits');

        // Check for 10 digit phone
        if (!normalizedRow.phoneNumber || !/^\d{10}$/.test(String(normalizedRow.phoneNumber))) errors.push('Phone must be 10 digits');

        // Logic: Default Password
        if (!normalizedRow.password || String(normalizedRow.password).trim() === '') {
            normalizedRow.password = defaultPassword;
        }

        // Hardcode Role: Bulk import is for students only
        normalizedRow.role = 'student';

        return {
            row: normalizedRow as CSVRow,
            isValid: errors.length === 0,
            errors,
            index: index + 1
        };
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;



        Papa.parse(uploadedFile, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(), // Trim whitespace from headers
            complete: (results) => {
                const validated = results.data.map((row: any, index: number) => validateRow(row, index));
                setParsedData(validated);
                setStep(2);
            },
            error: (err) => {
                alert('Failed to parse CSV: ' + err.message);
            }
        });
    };

    const handleImport = async () => {
        const validRows = parsedData.filter(d => d.isValid).map(d => d.row);
        if (validRows.length === 0) return;

        setLoading(true);
        try {
            // Create a new CSV file from valid rows with standardized headers
            const csv = Papa.unparse(validRows);
            const blob = new Blob([csv], { type: 'text/csv' });
            const finalFile = new File([blob], 'validated_users.csv', { type: 'text/csv' });

            const formData = new FormData();
            formData.append('file', finalFile);
            if (selectedGroup) formData.append('groupId', selectedGroup);
            if (selectedSubgroup) formData.append('subgroupId', selectedSubgroup);

            const res = await importUsersCode(formData);

            if (res.errors) {
                alert(`Imported with some server-side errors: ${res.errors.length} failed.`);
            } else {
                alert(`Successfully imported ${validRows.length} users!`);
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            alert('Import failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const validCount = parsedData.filter(d => d.isValid).length;
    const invalidCount = parsedData.length - validCount;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Student Bulk Import Wizard</h2>
                        <p className="text-sm text-gray-500">Step {step} of 2: {step === 1 ? 'Upload & Settings' : 'Preview & Validate Students'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 && (
                        <div className="space-y-8 max-w-xl mx-auto mt-8">
                            {/* Group Selection */}
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-4">
                                <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" /> Import Settings
                                </h3>

                                {/* Group & Subgroup */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-800 mb-1">Target Group</label>
                                        <select
                                            className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={selectedGroup}
                                            onChange={e => handleGroupChange(e.target.value)}
                                        >
                                            <option value="">Select Group...</option>
                                            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-800 mb-1">Target Subgroup</label>
                                        <select
                                            className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={selectedSubgroup}
                                            disabled={!selectedGroup}
                                            onChange={e => setSelectedSubgroup(e.target.value)}
                                        >
                                            <option value="">Select Session...</option>
                                            {filteredSubgroups.map(s => <option key={s._id} value={s._id}>{s.name} ({s.academicYear})</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Defaults */}
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-200">
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-blue-800 mb-1">Default Password</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={defaultPassword}
                                            onChange={e => setDefaultPassword(e.target.value)}
                                            placeholder="Default Password"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dropzone */}
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                    <FileUp className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Click or Drag Student CSV here</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    Columns: name, email, rollNo, phoneNumber<br />
                                    (Password defaults to '{defaultPassword}' if empty)
                                </p>
                            </div>

                            <div className="flex justify-center">
                                <a href="/student_import_template.csv" download="student_import_template.csv" className="text-primary text-sm font-medium hover:underline">
                                    Download Sample Template
                                </a>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                                    <p className="text-sm text-gray-500 uppercase font-bold">Total Rows</p>
                                    <p className="text-2xl font-black text-gray-900">{parsedData.length}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                                    <p className="text-sm text-green-600 uppercase font-bold">Valid</p>
                                    <p className="text-2xl font-black text-green-700">{validCount}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
                                    <p className="text-sm text-red-600 uppercase font-bold">Invalid</p>
                                    <p className="text-2xl font-black text-red-700">{invalidCount}</p>
                                </div>
                            </div>

                            {/* Alert for password */}
                            <div className="bg-yellow-50 p-4 rounded-lg flex items-center gap-3 text-yellow-800 text-sm">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <p>Note: Users without a password in the CSV will automatically be set to <strong>'{defaultPassword}'</strong>.</p>
                            </div>

                            {/* Table */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto max-h-[400px]">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10">
                                            <tr>
                                                <th className="p-3 font-bold">Row</th>
                                                <th className="p-3 font-bold">Status</th>
                                                <th className="p-3 font-bold">Name</th>
                                                <th className="p-3 font-bold">Email</th>
                                                <th className="p-3 font-bold">Roll No</th>
                                                <th className="p-3 font-bold">Phone</th>
                                                <th className="p-3 font-bold w-1/3">Errors</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {parsedData.map((data, i) => (
                                                <tr key={i} className={`hover:bg-gray-50 ${!data.isValid ? 'bg-red-50/30' : ''}`}>
                                                    <td className="p-3 text-gray-500 font-mono">{data.index}</td>
                                                    <td className="p-3">
                                                        {data.isValid ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">
                                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Valid
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">
                                                                <X className="h-3 w-3 mr-1" /> Invalid
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 font-medium">{data.row.name}</td>
                                                    <td className="p-3 text-gray-600">{data.row.email}</td>
                                                    <td className="p-3 font-mono text-gray-600">{data.row.rollNo}</td>
                                                    <td className="p-3 text-gray-600">{data.row.phoneNumber}</td>
                                                    <td className="p-3">
                                                        {data.errors.length > 0 && (
                                                            <ul className="list-disc list-inside text-xs text-red-600">
                                                                {data.errors.map((e, idx) => <li key={idx}>{e}</li>)}
                                                            </ul>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center">
                    {step === 2 ? (
                        <Button variant="ghost" onClick={() => setStep(1)}>Back to Upload</Button>
                    ) : (
                        <div />
                    )}

                    {step === 2 && (
                        <div className="flex gap-3">
                            <span className="text-sm text-gray-500 self-center">
                                Importing {validCount} valid users
                            </span>
                            <Button onClick={handleImport} disabled={loading || validCount === 0}>
                                {loading ? 'Importing...' : 'Finalize Import'}
                                {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
