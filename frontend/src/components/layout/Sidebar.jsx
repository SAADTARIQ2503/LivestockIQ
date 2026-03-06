import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Beef,
  Syringe,
  Cloud,
  Bell,
  Calculator,
  X,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import { useQuery } from '@tanstack/react-query';
import { animalsAPI } from '@/api/animals';
import { healthAPI } from '@/api/health';

/**
 * Sidebar Component
 * Main navigation sidebar with live badge counts.
 * Does NOT import alertsAPI — uses overdue vaccinations for the Alerts badge instead.
 */
export default function Sidebar() {
  const { sidebarOpen, mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: () => animalsAPI.getAll({}),
    staleTime: 2 * 60 * 1000,
  });

  const { data: upcomingData } = useQuery({
    queryKey: ['health', 'upcoming'],
    queryFn: healthAPI.getUpcoming,
    staleTime: 2 * 60 * 1000,
  });

  const { data: overdueData } = useQuery({
    queryKey: ['health', 'overdue'],
    queryFn: healthAPI.getOverdue,
    staleTime: 2 * 60 * 1000,
  });

  const allAnimals = animalsData?.data?.results ?? animalsData?.data ?? [];
  const animalsCount = Array.isArray(allAnimals) ? allAnimals.length : 0;

  const upcoming = upcomingData?.data?.results ?? upcomingData?.data ?? [];
  const upcomingCount = Array.isArray(upcoming) ? upcoming.length : 0;

  const overdue = overdueData?.data?.results ?? overdueData?.data ?? [];
  const overdueCount = Array.isArray(overdue) ? overdue.length : 0;

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      badge: null,
    },
    {
      title: 'Animals',
      icon: Beef,
      path: '/animals',
      badge: animalsCount > 0 ? animalsCount : null,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      title: 'Vaccinations',
      icon: Syringe,
      path: '/vaccinations',
      badge: upcomingCount > 0 ? upcomingCount : null,
      badgeColor: 'bg-yellow-500 text-white',
    },
    {
      title: 'Environment',
      icon: Cloud,
      path: '/environment',
      badge: null,
    },
    {
      title: 'Alerts',
      icon: Bell,
      path: '/alerts',
      badge: overdueCount > 0 ? overdueCount : null,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      title: 'Cost Calculator',
      icon: Calculator,
      path: '/costs',
      badge: null,
    },
  ];

  const NavItems = ({ onItemClick }) => (
    <nav className="p-4 space-y-1">
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onItemClick}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )
          }
        >
          <item.icon size={20} className="shrink-0" />
          <span className="flex-1 text-sm font-medium">{item.title}</span>
          {item.badge != null && (
            <span
              className={cn(
                'px-2 py-0.5 text-xs rounded-full font-semibold min-w-[20px] text-center',
                item.badgeColor ?? 'bg-yellow-500 text-white'
              )}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-30 overflow-hidden',
          sidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        {sidebarOpen && <NavItems />}
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 z-50 shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-primary">LivestockIQ</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <NavItems onItemClick={() => setMobileMenuOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}