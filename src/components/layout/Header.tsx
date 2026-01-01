import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/search/GlobalSearch';

export function Header() {
    return (
        <header className="h-16 border-b bg-primary text-primary-foreground flex items-center px-6 justify-between shadow-md">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-bold tracking-wide uppercase">NOOSE <span className="text-xs font-normal opacity-80 normal-case ml-2">National Office Of Homeland Security</span></h1>
            </div>

            <div className="flex-1 max-w-xl mx-8">
                <GlobalSearch />
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80 hover:text-white">
                    <Bell className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}
