import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useNotifications } from '@/hooks/useNotifications';
import { Toaster } from '@/components/ui/sonner';

export function Layout() {
    useNotifications();

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Toaster position="top-right" />
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
