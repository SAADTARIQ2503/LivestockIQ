import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Beef, Syringe, Cloud, Bell,
  Calculator, X, Tractor, User, LogOut, Scan, Skull,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import { useQuery } from '@tanstack/react-query';
import { animalsAPI } from '@/api/animals';
import { healthAPI } from '@/api/health';
import { farmsAPI } from '@/api/farms';
import { useAuthStore } from '@/store/authStore';

export default function Sidebar() {
  const { sidebarOpen, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

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

  const { data: farmsData } = useQuery({
    queryKey: ['farms'],
    queryFn: farmsAPI.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const allAnimals = animalsData?.data?.results ?? animalsData?.data ?? [];
  const animalsCount = Array.isArray(allAnimals) ? allAnimals.length : 0;

  const upcoming = upcomingData?.data?.results ?? upcomingData?.data ?? [];
  const upcomingCount = Array.isArray(upcoming) ? upcoming.length : 0;

  const overdue = overdueData?.data?.results ?? overdueData?.data ?? [];
  const overdueCount = Array.isArray(overdue) ? overdue.length : 0;

  const farms = farmsData?.data?.results ?? farmsData?.data ?? [];
  const farmsCount = Array.isArray(farms) ? farms.length : 0;

  const menuItems = [
    { title: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard',   badge: null },
    { title: 'Farms',           icon: Tractor,         path: '/farms',        badge: farmsCount > 0 ? farmsCount : null, badgeColor: 'bg-emerald-500 text-white' },
    { title: 'Animals',         icon: Beef,            path: '/animals',      badge: animalsCount > 0 ? animalsCount : null, badgeColor: 'bg-blue-500 text-white' },
    { title: 'Vaccinations',    icon: Syringe,         path: '/vaccinations', badge: upcomingCount > 0 ? upcomingCount : null, badgeColor: 'bg-yellow-500 text-white' },
    { title: 'Environment',     icon: Cloud,           path: '/environment',  badge: null },
    { title: 'AI Detection',    icon: Scan,            path: '/ai-detection', badge: null },
    { title: 'Alerts',          icon: Bell,            path: '/alerts',       badge: overdueCount > 0 ? overdueCount : null, badgeColor: 'bg-red-500 text-white' },
    { title: 'Mortality',       icon: Skull,           path: '/mortality',    badge: null },
    { title: 'Cost Calculator', icon: Calculator,      path: '/costs',        badge: null },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItems = ({ onItemClick }) => (
    <div className="flex flex-col h-full">
      <nav className="p-4 space-y-1 flex-1">
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
              <span className={cn('px-2 py-0.5 text-xs rounded-full font-semibold min-w-[20px] text-center', item.badgeColor ?? 'bg-yellow-500 text-white')}>
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Profile + Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <NavLink
          to="/profile"
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
          <User size={20} className="shrink-0" />
          <span className="text-sm font-medium">Profile</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} className="shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={cn(
        'hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-30 overflow-hidden',
        sidebarOpen ? 'w-64' : 'w-0'
      )}>
        {sidebarOpen && <NavItems />}
      </aside>

      {/* Mobile */}
      {mobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileMenuOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 z-50 shadow-lg flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-primary">LivestockIQ</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavItems onItemClick={() => setMobileMenuOpen(false)} />
            </div>
          </aside>
        </>
      )}
    </>
  );
}