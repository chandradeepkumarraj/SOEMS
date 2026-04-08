import { ReactNode } from 'react';

interface DashboardShellProps {
    sidebar: ReactNode;
    topbar: ReactNode;
    children: ReactNode;
}

export default function DashboardShell({ sidebar, topbar, children }: DashboardShellProps) {
    return (
        <div className="flex min-h-screen bg-[var(--bg-main)] transition-colors duration-300">
            {/* Sidebar Shell - Fixed position handles its own width */}
            <div className="shrink-0">
                {sidebar}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
                {/* Header */}
                {topbar}

                {/* Main Content Dashboard */}
                <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto thin-scrollbar">
                    {/* Max width for large displays (projectors), centered */}
                    <div className="max-w-[1920px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

