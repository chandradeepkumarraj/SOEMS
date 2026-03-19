import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Mic, Video, Monitor, Shield, MessageSquare, Ban, AlertTriangle, Camera, Clock } from 'lucide-react';
import { getStudentViolations } from '../services/examService';
import { emitIntercomMessage } from '../services/socket';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';
import { DeviceStatus } from '../components/proctor/DeviceStatus';

export default function ProctorDetail() {
    const { t } = useTranslation();
    const { examId, studentId } = useParams();
    const [violations, setViolations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<any>({
        name: 'Loading...',
        id: studentId?.slice(-8).toUpperCase(),
        exam: 'Loading...',
        status: 'Monitoring',
        confidence: 100,
        device: { webcam: true, mic: true, screen: true }
    });

    const [isIntercomOpen, setIsIntercomOpen] = useState(false);
    const [intercomText, setIntercomText] = useState('');
    const [intercomMessages, setIntercomMessages] = useState<{ text: string; time: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!examId || !studentId) return;
            try {
                const data = await getStudentViolations(examId, studentId);
                setViolations(data);

                // If violations exist, use the first one to get student/exam info
                if (data.length > 0) {
                    const first = data[0];
                    setStudent((prev: any) => ({
                        ...prev,
                        name: first.studentId?.name || 'Student',
                        exam: first.examId?.title || 'Exam',
                        status: data.length > 5 ? 'Suspicious' : 'Normal',
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch proctor details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [examId, studentId]);

    // Prepare timeline data
    const timelineData = violations.map((v) => {
        const time = new Date(v.timestamp);

        let yValue = 1;
        let severity = 'Info';
        const typeLower = v.type.toLowerCase();

        if (typeLower.includes('face') || typeLower.includes('gaze')) {
            yValue = 2; // Critical
            severity = 'Critical';
        } else if (typeLower.includes('tab') || typeLower.includes('switch') || typeLower.includes('voice') || typeLower.includes('audio')) {
            yValue = 1; // Warning
            severity = 'Warning';
        }

        return {
            x: time.getTime(),
            y: yValue,
            type: v.type,
            severity,
            message: v.message,
            timeStr: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
    });

    const getViolationColor = (type: string) => {
        if (type.toLowerCase().includes('tab') || type.toLowerCase().includes('switch')) return '#fbbf24'; // Brighter amber
        if (type.toLowerCase().includes('face') || type.toLowerCase().includes('gaze')) return '#f87171'; // Brighter red
        return '#818cf8'; // Brighter indigo
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col h-screen overflow-hidden font-sans">
            {/* Header */}
            <header className="bg-slate-900 border-b border-slate-800 h-20 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-6">
                    <Link to={window.location.pathname.startsWith('/admin') ? "/admin/monitor" : "/proctor/dashboard"}>
                        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800 gap-2 border border-slate-800">
                            <ArrowLeft className="h-5 w-5" /> {t('proctor_detail.live_grid')}
                        </Button>
                    </Link>
                    <div className="h-10 w-px bg-slate-800" />
                    <div>
                        <h1 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
                            {student.name}
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${student.status === 'Suspicious' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'}`}>
                                {student.status}
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">ID: {student.id} • {student.exam}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-black uppercase tracking-tighter">{t('proctor_detail.ai_active')}</span>
                    </div>
                    <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 gap-2 font-black rounded-xl">
                        <Ban className="h-4 w-4" /> {t('proctor_detail.terminate')}
                    </Button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Left Panel: Intelligence & Timeline */}
                <div className="flex-1 bg-slate-900 p-8 overflow-y-auto space-y-8 custom-scrollbar">
                    {/* Visual Timeline Section */}
                    <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 p-8 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tight uppercase">{t('proctor_detail.timeline')}</h3>
                                <p className="text-slate-500 text-sm font-bold tracking-tight">{t('proctor_detail.timeline_desc')}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500" />
                                    <span className="text-[10px] font-black uppercase text-slate-400">{t('proctor_detail.critical')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                                    <span className="text-[10px] font-black uppercase text-slate-400">{t('proctor_detail.warning')}</span>
                                </div>
                            </div>
                        </div>

                        {violations.length > 0 ? (
                            <div className="h-64 w-full mt-6">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                                        <XAxis
                                            type="number"
                                            dataKey="x"
                                            domain={['dataMin - 60000', 'dataMax + 60000']}
                                            tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            stroke="#64748b"
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                                            tickLine={false}
                                            axisLine={{ stroke: '#334155' }}
                                        />
                                        <YAxis
                                            type="number"
                                            dataKey="y"
                                            domain={[0.5, 2.5]}
                                            ticks={[1, 2]}
                                            tickFormatter={(val) => val === 2 ? 'CRITICAL' : 'WARNING'}
                                            stroke="#64748b"
                                            tick={{ fill: '#475569', fontSize: 9, fontWeight: 900, textAnchor: 'end', dx: -10 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <ZAxis type="number" range={[400, 800]} />
                                        <Tooltip
                                            cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1', strokeWidth: 1 }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-xl bg-opacity-90">
                                                            <div className={`absolute top-0 left-0 w-1 h-full ${data.severity === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{data.timeStr}</p>
                                                            <p className="text-white font-black text-sm mb-1 uppercase tracking-tight">{data.type}</p>
                                                            <p className="text-slate-400 text-xs w-48 leading-relaxed">{data.message}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Scatter data={timelineData} className="cursor-pointer hover:opacity-80 transition-opacity">
                                            {timelineData.map((entry, index) => (
                                                <Cell key={index} fill={getViolationColor(entry.type)} className="hover:scale-125 origin-center transition-transform duration-300" />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center border border-dashed border-slate-800 rounded-3xl">
                                <div className="text-center">
                                    <Shield className="h-8 w-8 text-slate-800 mx-auto mb-3" />
                                    <p className="text-slate-600 font-black uppercase text-xs">{t('proctor_detail.no_incidents')}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Device Health */}
                        <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-xl">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">{t('proctor_detail.device_integrity')}</h3>
                            <div className="space-y-6">
                                <DeviceStatus label={t('proctor_detail.webcam')} icon={Video} active={!violations.some(v => v.type === 'camera_off')} />
                                <DeviceStatus label={t('proctor_detail.mic')} icon={Mic} active={!violations.some(v => v.type === 'mic_off')} />
                                <DeviceStatus label={t('proctor_detail.screen')} icon={Monitor} active={!violations.some(v => v.type === 'screen_off')} />
                            </div>
                        </div>

                        {/* Proctoring Log */}
                        <div className="bg-slate-800 p-1 rounded-[2.5rem] border border-slate-700 shadow-xl flex flex-col overflow-hidden max-h-[400px]">
                            <div className="p-6 pb-2">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('proctor_detail.incident_log')}</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 thin-scrollbar">
                                {violations.map((violation, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="flex flex-col items-center gap-1 shrink-0">
                                            <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${getViolationColor(violation.type) === '#f87171' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                            <div className="w-[1px] flex-1 bg-slate-800 group-last:bg-transparent" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight">{violation.type}</span>
                                                <span className="text-[9px] font-mono text-slate-600">{new Date(violation.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium leading-relaxed">{violation.message}</p>
                                            {/* Evidence Snapshot */}
                                            {violation.snapshot && (
                                                <div className="mt-2 bg-slate-800/50 rounded-xl p-2.5 border border-blue-500/20">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Camera className="h-3 w-3 text-blue-400" />
                                                        <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Evidence</span>
                                                    </div>
                                                    <img
                                                        src={violation.snapshot}
                                                        alt={`Evidence: ${violation.type}`}
                                                        className="w-full max-w-[200px] rounded-lg border border-slate-700 shadow-md"
                                                    />
                                                </div>
                                            )}
                                            {/* Voice Transcript Evidence */}
                                            {violation.transcript && (
                                                <div className="mt-2 bg-amber-900/20 rounded-xl p-2.5 border border-amber-500/20">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <MessageSquare className="h-3 w-3 text-amber-400" />
                                                        <span className="text-[7px] font-black text-amber-400 uppercase tracking-widest">Voice Transcript</span>
                                                    </div>
                                                    <p className="text-[10px] text-amber-300 font-medium italic leading-relaxed">"{violation.transcript}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {violations.length === 0 && (
                                    <div className="py-12 text-center opacity-30">
                                        <Clock className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase">{t('proctor_detail.monitoring')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Controls & Chat */}
                <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
                    <div className="p-8 border-b border-slate-800">
                        <div className="mb-8">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('proctor_detail.question_depth')}</span>
                                <span className="text-xl font-black text-white italic">20%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-indigo-500 w-1/5 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 relative">
                            <Button
                                onClick={() => setIsIntercomOpen(!isIntercomOpen)}
                                className={`w-full ${isIntercomOpen ? 'bg-indigo-700' : 'bg-indigo-600'} hover:bg-indigo-700 text-white font-black rounded-2xl h-14 uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95 transition-all`}
                            >
                                <MessageSquare className="h-5 w-5" /> {t('proctor_detail.intercom')}
                            </Button>

                            {/* Intercom Panel */}
                            {isIntercomOpen && (
                                <div className="absolute top-[110%] left-0 w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Direct Message</span>
                                        <button onClick={() => setIsIntercomOpen(false)} className="text-slate-500 hover:text-white">✕</button>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto space-y-2 thin-scrollbar">
                                        {intercomMessages.length === 0 ? (
                                            <p className="text-[10px] text-slate-500 italic text-center py-2">No messages sent yet.</p>
                                        ) : (
                                            intercomMessages.map((msg, idx) => (
                                                <div key={idx} className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-lg">
                                                    <p className="text-[9px] text-indigo-400 font-mono mb-0.5">{msg.time}</p>
                                                    <p className="text-xs text-slate-300">{msg.text}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={intercomText}
                                            onChange={(e) => setIntercomText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && intercomText.trim() && examId && studentId) {
                                                    emitIntercomMessage(examId, studentId, intercomText.trim(), 'Proctor');
                                                    setIntercomMessages(prev => [...prev, { text: intercomText.trim(), time: new Date().toLocaleTimeString() }]);
                                                    setIntercomText('');
                                                }
                                            }}
                                            placeholder="Type warning..."
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                        />
                                        <Button
                                            onClick={() => {
                                                if (intercomText.trim() && examId && studentId) {
                                                    emitIntercomMessage(examId, studentId, intercomText.trim(), 'Proctor');
                                                    setIntercomMessages(prev => [...prev, { text: intercomText.trim(), time: new Date().toLocaleTimeString() }]);
                                                    setIntercomText('');
                                                }
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-700 px-3 rounded-xl shadow-lg"
                                        >
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 p-8 bg-slate-950/30 flex flex-col justify-center text-center">
                        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl">
                            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                            <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">{t('proctor_detail.security_enforcement')}</h4>
                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-6">
                                {t('proctor_detail.enforcement_desc')}
                            </p>
                            <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-10 text-[10px] uppercase">
                                {t('proctor_detail.suspend')}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
