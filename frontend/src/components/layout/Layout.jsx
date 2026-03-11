import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

/**
 * Layout Component
 * Main layout wrapper with Navbar and Sidebar
 * Used for all protected pages
 */
export default function Layout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <Navbar />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
