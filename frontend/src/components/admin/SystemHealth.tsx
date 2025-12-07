import React, { useEffect, useState } from 'react';
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
                <h3 className="text-lg font-semibold">System Health Monitor</h3>
                <Button onClick={fetchStats} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Server className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Server Uptime</p>
                        <p className="text-2xl font-bold">{stats ? Math.floor(stats.uptime / 60) + ' min' : '-'}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stats?.dbStatus === 'Connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        <Database className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Database Status</p>
                        <p className="text-2xl font-bold">{stats?.dbStatus || '-'}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Activity className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Memory Usage</p>
                        <p className="text-2xl font-bold">{stats?.memory?.rss || '-'}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2">Administrative Actions</h4>
                <div className="flex gap-4">
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => alert('Restart feature requires PM2 or Docker integration.')}>
                        Restart Server
                    </Button>
                </div>
            </div>
        </div>
    );
}
