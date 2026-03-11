import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { animalsAPI } from '@/api/animals';
import { healthAPI } from '@/api/health';

/**
 * Navbar Component
 * Dynamic notifications from real API data. No hardcoded counts.
 */
export default function Navbar() {
  const { user } = useAuthStore();
  const { theme, toggleTheme, toggleSidebar, toggleMobileMenu } = useUIStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  // Fetch live data for notifications
  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: () => animalsAPI.getAll({}),
    staleTime: 2 * 60 * 1000,
  });

  const { data: overdueData } = useQuery({
    queryKey: ['health', 'overdue'],
    queryFn: healthAPI.getOverdue,
    staleTime: 2 * 60 * 1000,
  });

  const { data: upcomingData } = useQuery({
    queryKey: ['health', 'upcoming'],
    queryFn: healthAPI.getUpcoming,
    staleTime: 2 * 60 * 1000,
  });

  // Build notification list from real data
  const allAnimals = animalsData?.data?.results ?? animalsData?.data ?? [];
  const unhealthyAnimals = Array.isArray(allAnimals)
    ? allAnimals.filter(a => !a.is_healthy)
    : [];

  const overdueList = overdueData?.data?.results ?? overdueData?.data ?? [];
  const upcomingList = upcomingData?.data?.results ?? upcomingData?.data ?? [];

  const notifications = [
    ...Array.isArray(overdueList) ? overdueList.slice(0, 3).map(v => ({
      id: `overdue-${v.id}`,
      title: 'Overdue Vaccination',
      message: `${v.vaccine_name} for ${v.is_group ? 'Group' : `Animal #${v.animal}`} is overdue`,
      time: 'Overdue',
      dot: 'bg-red-500',
    })) : [],
    ...Array.isArray(upcomingList) ? upcomingList.slice(0, 2).map(v => ({
      id: `upcoming-${v.id}`,
      title: 'Upcoming Vaccination',
      message: `${v.vaccine_name} scheduled for ${v.schedule_date}`,
      time: 'Upcoming',
      dot: 'bg-yellow-500',
    })) : [],
    ...unhealthyAnimals.slice(0, 2).map(a => ({
      id: `animal-${a.id}`,
      title: 'Animal Needs Attention',
      message: `${a.animal_type} #${a.id} requires: ${a.required_vaccine || 'check-up'}`,
      time: 'Action needed',
      dot: 'bg-blue-500',
    })),
  ];

  const notificationCount = notifications.length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-40 h-16">
      <div className="flex items-center justify-between h-full px-4">

        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            aria-label="Toggle mobile menu"
          >
            <Menu size={24} />
          </button>
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-primary">LivestockIQ</h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative text-gray-700 dark:text-gray-200"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {notificationCount > 0 && (
                    <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
                      {notificationCount} new
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <Bell size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">All clear — no new notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{n.message}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <NavLink
                    to="/alerts"
                    onClick={() => setShowNotifications(false)}
                    className="text-sm text-primary hover:underline"
                  >
                    View all alerts →
                  </NavLink>
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2 p-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}