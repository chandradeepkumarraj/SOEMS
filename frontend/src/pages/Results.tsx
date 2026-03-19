import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getResultById, getResultAnalysis } from '../services/resultService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CheckCircle, XCircle, ArrowLeft, Download, Target, TrendingUp, Award, ShieldAlert, Twitter, Linkedin, Layers } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAIStatus } from '../hooks/useAIStatus';

export default function Results() {
    const { id } = useParams();
    const { getModelDisplayName } = useAIStatus();
    const [result, setResult] = useState<any>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const handleDownloadPDF = async () => {
        setIsPrinting(true);
        const element = document.getElementById('result-report-content');
        if (!element) return;

        // Create a hidden clone for specialized PDF rendering
        const clone = element.cloneNode(true) as HTMLElement;
        document.body.appendChild(clone);

        // Force 'light' theme and specific styles on the clone
        clone.classList.remove('dark');
        clone.classList.add('bg-white', 'text-slate-900', 'p-10');
        clone.style.width = '1000px'; // Consistent width for capture
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0';

        // Add professional branding to the clone
        const branding = document.createElement('div');

        // Header Row
        const headerRow = document.createElement('div');
        headerRow.style.cssText = "display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 4px solid #2563eb; padding-bottom: 20px; margin-bottom: 40px;";

        const leftHeader = document.createElement('div');
        const logo = document.createElement('h1');
        logo.style.cssText = "font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -1px;";
        logo.textContent = "SOEMS";
        const subLogo = document.createElement('p');
        subLogo.style.cssText = "font-size: 12px; font-weight: 800; color: #2563eb; margin: 0; text-transform: uppercase; letter-spacing: 2px;";
        subLogo.textContent = "Secure Online Examination Management System";
        leftHeader.appendChild(logo);
        leftHeader.appendChild(subLogo);

        const rightHeader = document.createElement('div');
        rightHeader.style.textAlign = 'right';
        const title1 = document.createElement('p');
        title1.style.cssText = "font-size: 14px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase;";
        title1.textContent = "Official Result Registry";
        const title2 = document.createElement('p');
        title2.style.cssText = "font-size: 10px; font-weight: 700; color: #64748b; margin: 0;";
        title2.textContent = "Verified & Validated Report";
        rightHeader.appendChild(title1);
        rightHeader.appendChild(title2);

        headerRow.appendChild(leftHeader);
        headerRow.appendChild(rightHeader);
        branding.appendChild(headerRow);

        // Info Grid
        const infoGrid = document.createElement('div');
        infoGrid.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;";

        const candidateInfo = document.createElement('div');
        const candidateLabel = document.createElement('label');
        candidateLabel.style.cssText = "font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px;";
        candidateLabel.textContent = "Candidate Name";
        const candidateName = document.createElement('p');
        candidateName.style.cssText = "font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;";
        candidateName.textContent = result.studentId?.name || 'N/A';
        candidateInfo.appendChild(candidateLabel);
        candidateInfo.appendChild(candidateName);

        const subjectInfo = document.createElement('div');
        const subjectLabel = document.createElement('label');
        subjectLabel.style.cssText = "font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px;";
        subjectLabel.textContent = "Academic Subject";
        const subjectName = document.createElement('p');
        subjectName.style.cssText = "font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;";
        subjectName.textContent = result.examId?.title || 'Unknown';
        subjectInfo.appendChild(subjectLabel);
        subjectInfo.appendChild(subjectName);

        infoGrid.appendChild(candidateInfo);
        infoGrid.appendChild(subjectInfo);
        branding.appendChild(infoGrid);
        clone.insertBefore(branding, clone.firstChild);

        // Hide UI elements in the clone
        clone.querySelectorAll('.no-print, button').forEach(el => (el as HTMLElement).style.display = 'none');

        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Allow charts to re-render in clone

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 1000
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210;
            const pdfHeight = 297;
            const margin = 10;
            const imgWidth = pdfWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = margin;

            // Page 1
            pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - (margin * 2));

            // Multi-page handling
            while (heightLeft > 0) {
                position = heightLeft - imgHeight + margin;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - (margin * 2));
            }

            pdf.save(`SOEMS_Result_${result.studentId?.name || 'Student'}_${result.examId?.title || 'Exam'}.pdf`);
        } catch (err) {
            console.error('PDF Generation failed:', err);
            setError('Failed to generate PDF export');
        } finally {
            document.body.removeChild(clone);
            setIsPrinting(false);
        }
    };

    useEffect(() => {
        const fetchResult = async () => {
            if (!id) return;
            try {
                const [resultData, analysisData] = await Promise.all([
                    getResultById(id),
                    getResultAnalysis(id)
                ]);
                setResult(resultData);
                setAnalysis(analysisData);
            } catch (err: any) {
                console.error('Failed to fetch result:', err);
                setError(err.message || 'Failed to load result');
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-slate-400">Loading results...</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Result not found'}</p>
                    <Link to="/dashboard">
                        <Button>Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }


    const percentage = result.totalPoints > 0 ? (result.score / result.totalPoints) * 100 : 0;
    const correctAnswers = result.answers.filter((a: any) => a.isCorrect).length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto" id="result-report-content">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link to="/dashboard" className="no-print">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary dark:text-slate-400 dark:hover:text-primary">
                            <ArrowLeft className="h-5 w-5" /> Back to Dashboard
                        </Button>
                    </Link>
                    {!isPrinting && (
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                                onClick={handleDownloadPDF}
                                disabled={isPrinting}
                            >
                                <Download className="h-4 w-4" />
                                {isPrinting ? 'Generating PDF...' : 'Download PDF'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden mb-8"
                >
                    <div className="bg-primary/5 dark:bg-primary/10 p-8 text-center border-b border-gray-100 dark:border-slate-800">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{result.examId?.title || 'Exam Result'}</h1>
                        <p className="text-gray-500 dark:text-slate-400 mb-8">Submitted on {new Date(result.submittedAt).toLocaleString()}</p>

                        <div className="relative inline-flex items-center justify-center">
                            <svg className="w-40 h-40 transform -rotate-90">
                                <circle
                                    className="text-gray-200 dark:text-slate-800"
                                    strokeWidth="12"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="70"
                                    cx="80"
                                    cy="80"
                                />
                                <circle
                                    className="text-primary"
                                    strokeWidth="12"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * percentage) / 100}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="70"
                                    cx="80"
                                    cy="80"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">{result.score}</span>
                                <span className="text-sm text-gray-500 dark:text-slate-500">/ {result.totalPoints}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-8 mt-8 max-w-lg mx-auto">
                            <div className="text-center">
                                <p className="text-sm text-gray-500 dark:text-slate-500 mb-1">Correct</p>
                                <p className="text-xl font-bold text-success">{correctAnswers}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500 dark:text-slate-500 mb-1">Incorrect</p>
                                <p className="text-xl font-bold text-error">{result.answers.length - correctAnswers}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500 dark:text-slate-500 mb-1">Percentage</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</p>
                            </div>
                        </div>

                        {/* Proctoring AI Insight */}
                        {result.heiScore !== undefined && (
                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-left">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-4 flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-primary" />
                                    AI Proctoring Evaluation ({getModelDisplayName()})
                                </h3>
                                <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                                    <div className="flex-shrink-0">
                                        <div className="relative inline-flex items-center justify-center">
                                            <svg className="w-24 h-24 transform -rotate-90">
                                                <circle className="text-gray-100 dark:text-slate-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="48" cy="48" />
                                                <circle
                                                    className={result.heiScore >= 90 ? "text-success" : result.heiScore >= 50 ? "text-warning" : "text-error"}
                                                    strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * result.heiScore) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="48" cy="48"
                                                />
                                            </svg>
                                            <div className="absolute flex flex-col items-center">
                                                <span className="text-2xl font-black text-gray-900 dark:text-white">{result.heiScore}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-center mt-2 text-slate-500 tracking-wider">HEI Index</p>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                            "{result.heiSummary || 'Behavioral telemetry processed and cleared.'}"
                                        </p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-2">
                                            {result.heiScore >= 90 ? 'Session Secure - No Action Required' : result.heiScore >= 50 ? 'Moderate Risk - Manual Review Advised' : 'High Risk - Suspension Recommended'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Badge Showcase */}
                {result.badges && result.badges.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-6 flex items-center gap-2">
                                <Award className="h-4 w-4 text-primary" />
                                Milestone Achievements
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {result.badges.map((badge: any, bIdx: number) => (
                                    <div key={bIdx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                                        <div className="w-16 h-16 flex-shrink-0 bg-white dark:bg-slate-900 rounded-lg p-2 shadow-sm border border-slate-100 dark:border-slate-800">
                                            <img
                                                src={`/badges/${badge.icon}.png`}
                                                alt={badge.label}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/190/190411.png';
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{badge.label}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{badge.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Social Sharing */}
                            {!isPrinting && (
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Celebrate Your Success</p>
                                    <div className="flex justify-center flex-wrap gap-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 rounded-full px-6 dark:border-slate-800 dark:hover:bg-slate-800"
                                            onClick={() => {
                                                const studentName = result.studentId?.name || 'A student';
                                                const text = `${studentName} just earned the ${result.badges[0].label} badge in ${result.examId?.title} on SOEMS! 🚀 #SOEMS #Education #Achievement`;
                                                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                                            }}
                                        >
                                            <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                                            Share Achievement
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 rounded-full px-6 dark:border-slate-800 dark:hover:bg-slate-800"
                                            onClick={() => {
                                                const studentName = result.studentId?.name || 'A student';
                                                const title = `${studentName} achieved a milestone on SOEMS!`;
                                                const summary = `I successfully completed the ${result.examId?.title} with a ${Math.round(percentage)}% score and earned the ${result.badges[0].label} badge!`;
                                                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`, '_blank');
                                            }}
                                        >
                                            <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                                            Post to LinkedIn
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Insights Section */}
                {analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Topic Performance */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800"
                        >
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" /> Topic Analysis
                            </h3>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analysis.topicPerformance}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="topic" />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                        <Radar
                                            name="Accuracy"
                                            dataKey="accuracy"
                                            stroke="#4F46E5"
                                            fill="#4F46E5"
                                            fillOpacity={0.6}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value: any) => [`${parseFloat(value).toFixed(1)}%`, 'Accuracy']}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Peer Comparison */}
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Award className="h-8 w-8 text-indigo-200" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
                                        {analysis.isInsightsAvailable ? 'Final Rank' : 'Progress Rank'}
                                    </span>
                                </div>

                                {analysis.isInsightsAvailable ? (
                                    <>
                                        <h4 className="text-sm font-medium text-indigo-100 mb-1">Class Rank</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black">#{analysis.classRank}</span>
                                            <span className="text-sm text-indigo-200">of {analysis.totalParticipants}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="text-sm font-medium text-indigo-100 mb-1">Percentile</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black">{analysis.percentile}th</span>
                                            <span className="text-sm text-indigo-200">percentile</span>
                                        </div>
                                    </>
                                )}

                                <p className="text-xs text-indigo-100 mt-4 leading-relaxed">
                                    {analysis.isInsightsAvailable
                                        ? `You performed better than ${analysis.percentile}% of students.`
                                        : 'Final rankings will be available after the exam closes.'}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-success">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Class Average</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{analysis.examAverage.toFixed(1)}</span>
                                            <span className="text-sm text-gray-400 dark:text-slate-500">/ {result.totalPoints}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-success transition-all duration-1000"
                                        style={{ width: `${(analysis.examAverage / result.totalPoints) * 100}%` }}
                                    ></div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Peer Gap Analysis Section */}
                {analysis?.isInsightsAvailable && analysis?.peerGapQuestions?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 p-6"
                    >
                        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-amber-600" /> Growth Opportunities
                        </h3>
                        <p className="text-sm text-amber-800 dark:text-amber-400 mb-6">
                            Most students got these questions right. Reviewing these topics could significantly improve your performance next time!
                        </p>
                        <div className="space-y-3">
                            {analysis.peerGapQuestions.map((q: any, idx: number) => (
                                <div key={idx} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/50 flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 line-clamp-1">{q.text}</p>
                                        <p className="text-xs text-amber-600 font-medium">{q.globalAccuracy.toFixed(0)}% of peers correct</p>
                                    </div>
                                    <div className="text-amber-500 font-bold text-xs uppercase tracking-wider">
                                        Review Needed
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Adaptive Insights Section */}
                {analysis?.isAdaptive && analysis?.adaptiveStats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 p-6"
                    >
                        <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 mb-4 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-indigo-600" /> Adaptive Difficulty Curve
                        </h3>
                        <p className="text-sm text-indigo-800 dark:text-indigo-400 mb-6 flex justify-between items-center">
                            <span>This exam adjusted difficulty dynamically. Here is your performance across difficulty tiers.</span>
                        </p>

                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                <BarChart
                                    data={[
                                        { name: 'Easy', correct: analysis.adaptiveStats.easy.correct, incorrect: analysis.adaptiveStats.easy.total - analysis.adaptiveStats.easy.correct },
                                        { name: 'Medium', correct: analysis.adaptiveStats.medium.correct, incorrect: analysis.adaptiveStats.medium.total - analysis.adaptiveStats.medium.correct },
                                        { name: 'Hard', correct: analysis.adaptiveStats.hard.correct, incorrect: analysis.adaptiveStats.hard.total - analysis.adaptiveStats.hard.correct }
                                    ]}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                                    <YAxis tick={{ fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="correct" stackId="a" fill="#10b981" name="Correct" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="incorrect" stackId="a" fill="#ef4444" name="Incorrect" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}

                {/* Detailed Analysis */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detailed Analysis</h2>
                    {result.answers.map((answer: any, idx: number) => (
                        <motion.div
                            key={answer.questionId?._id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`bg-white dark:bg-slate-900 rounded-xl border p-6 ${answer.isCorrect ? 'border-gray-200 dark:border-slate-800' : 'border-red-100 bg-red-50/10 dark:border-red-900/20 dark:bg-red-900/5'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${answer.isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-success' : 'bg-red-100 dark:bg-red-900/30 text-error'
                                    }`}>
                                    {answer.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                                        <span className="text-gray-500 dark:text-slate-500 mr-2">Q{idx + 1}.</span>
                                        {answer.questionId?.text || 'Question'}
                                    </h3>

                                    <div className="grid md:grid-cols-1 gap-4 text-sm">
                                        {answer.questionId?.type === 'descriptive' ? (
                                            <div className="space-y-4">
                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                                    <p className="text-xs font-black uppercase text-slate-500 mb-2">Your Submission</p>
                                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic select-text">
                                                        {answer.textAnswer || 'No answer provided.'}
                                                    </p>
                                                </div>

                                                {answer.missingConcepts?.length > 0 && (
                                                    <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/30">
                                                        <p className="text-xs font-black uppercase text-red-600 dark:text-red-400 mb-2">Missing Key Concepts</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {answer.missingConcepts.map((concept: string, cIdx: number) => (
                                                                <span key={cIdx} className="px-2 py-1 bg-white dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-xs font-bold border border-red-100 dark:border-red-800/30">
                                                                    {concept}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {answer.remediationSteps?.length > 0 && (
                                                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                                        <p className="text-xs font-black uppercase text-primary dark:text-blue-400 mb-2">AI Remediation Roadmap</p>
                                                        <ul className="space-y-2">
                                                            {answer.remediationSteps.map((step: string, sIdx: number) => (
                                                                <li key={sIdx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                                                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                                                    {step}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/30">
                                                    <p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1">AI Evaluator Feedback</p>
                                                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 italic">
                                                        "{answer.aiFeedback}"
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className={`p-3 rounded-lg ${answer.isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30' : 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30'
                                                    }`}>
                                                    <p className="text-xs text-gray-500 dark:text-slate-500 mb-1">Your Answer</p>
                                                    <p className={`font-medium ${answer.isCorrect ? 'text-success' : 'text-error'}`}>
                                                        {answer.questionId?.options?.[answer.selectedOption] || `Option ${answer.selectedOption + 1}`}
                                                    </p>
                                                </div>
                                                {!answer.isCorrect && (
                                                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                                                        <p className="text-xs text-gray-500 dark:text-slate-500 mb-1">Correct Answer</p>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {answer.questionId?.options?.[answer.questionId.correctAnswer] || `Option ${answer.questionId?.correctAnswer + 1}`}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Print-only CSS */}
            {/* Removed print-only CSS as we are using html2canvas */}
        </div>
    );
}
