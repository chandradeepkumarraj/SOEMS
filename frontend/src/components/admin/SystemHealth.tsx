import { useEffect, useState } from 'react';
import { getSystemStats } from '../../services/adminService';
import { Server, Database, Activity, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function SystemHealth() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await getSystemStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch system stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) return <div className="p-8 text-center">Loading system health...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">System Health Monitor</h3>
                <Button onClick={fetchStats} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-2xl flex items-center gap-4 transition-all hover:border-blue-500">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg">
                        <Server className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">Server Uptime</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{stats ? Math.floor(stats.uptime / 60) + ' min' : '-'}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-2xl flex items-center gap-4 transition-all hover:border-green-500">
                    <div className={`p-3 rounded-lg ${stats?.dbStatus === 'Connected' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                        <Database className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">Database Status</p>
                        <p className={`text-2xl font-black uppercase tracking-tighter ${stats?.dbStatus === 'Connected' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{stats?.dbStatus || '-'}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-2xl flex items-center gap-4 transition-all hover:border-purple-500">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg">
                        <Activity className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">Memory Usage</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{stats?.memory?.rss || '-'}</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-200 dark:bg-slate-800 p-8 rounded-[2rem] border-2 border-slate-400 dark:border-slate-600 shadow-inner-premium mt-8">
                <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-6">Administrative Actions</h4>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        className="bg-white dark:bg-slate-900 text-red-700 dark:text-red-400 border-2 border-red-500 dark:border-red-500 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white font-black uppercase tracking-widest text-[11px] px-8 h-12 shadow-xl"
                        onClick={() => alert('Restart feature requires PM2 or Docker integration.')}
                    >
                        Restart Server
                    </Button>
                </div>
            </div>
        </div>
    );
}
