import { ReactNode } from 'react';

interface DashboardShellProps {
    sidebar: ReactNode;
    topbar: ReactNode;
    children: ReactNode;
}

export default function DashboardShell({ sidebar, topbar, children }: DashboardShellProps) {
    return (
        <div className="flex min-h-screen bg-[var(--bg-main)] transition-colors duration-300">
            {/* Sidebar */}
            {sidebar}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                {topbar}

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto thin-scrollbar">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
