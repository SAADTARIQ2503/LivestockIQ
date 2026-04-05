import { Bell, Menu, Moon, Sun, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useState, useRef, useEffect } from 'react';
import { useAlertNotifications } from '@/hooks/useAlertNotifications';

const SEVERITY_STYLES = {
  critical: { dot: 'bg-red-500',    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',    Icon: AlertTriangle, iconColor: 'text-red-500'    },
  warning:  { dot: 'bg-yellow-500', badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', Icon: AlertTriangle, iconColor: 'text-yellow-500' },
  info:     { dot: 'bg-blue-500',   badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',   Icon: Info,           iconColor: 'text-blue-500'   },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)           return 'just now';
  if (diff < 3600)         return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)        return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Navbar() {
  const { user }                                          = useAuthStore();
  const { theme, toggleTheme, toggleSidebar, toggleMobileMenu } = useUIStore();
  const [showNotifications, setShowNotifications]         = useState(false);
  const notificationsRef                                  = useRef(null);

  // Single hook — polls alerts, fires browser push + toast on new arrivals
  const { activeAlerts, activeCount } = useAlertNotifications();

  // Separate critical count for the badge colour
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;

  // Show max 8 in the dropdown
  const visibleAlerts = activeAlerts.slice(0, 8);

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

          {/* Notification Bell */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative text-gray-700 dark:text-gray-200"
              aria-label="Notifications"
            >
              {/* Bell — animate when there are critical alerts */}
              <Bell
                size={20}
                className={criticalCount > 0 ? 'animate-[wiggle_0.6s_ease-in-out_infinite]' : ''}
              />

              {/* Badge */}
              {activeCount > 0 && (
                <span className={`
                  absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center
                  text-white text-[10px] font-bold rounded-full
                  ${criticalCount > 0 ? 'bg-red-500' : 'bg-yellow-500'}
                `}>
                  {activeCount > 9 ? '9+' : activeCount}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">

                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-gray-500 dark:text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Active Alerts</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {criticalCount > 0 && (
                      <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold">
                        {criticalCount} critical
                      </span>
                    )}
                    {activeCount > 0 && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                        {activeCount} total
                      </span>
                    )}
                  </div>
                </div>

                {/* Alert list */}
                <div className="max-h-[28rem] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
                  {visibleAlerts.length === 0 ? (
                    <div className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                      <CheckCircle size={32} className="mx-auto mb-2 text-green-400 opacity-60" />
                      <p className="text-sm font-medium">All clear!</p>
                      <p className="text-xs mt-1 opacity-70">No active alerts right now</p>
                    </div>
                  ) : (
                    visibleAlerts.map(alert => {
                      const s = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
                      return (
                        <div
                          key={alert.id}
                          className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {/* Severity icon */}
                            <div className={`mt-0.5 shrink-0 ${s.iconColor}`}>
                              <s.Icon size={15} />
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Title + severity badge */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                                  {alert.title}
                                </p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${s.badge}`}>
                                  {alert.severity}
                                </span>
                              </div>

                              {/* Message */}
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {alert.message}
                              </p>

                              {/* Time */}
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                {timeAgo(alert.created_at)}
                              </p>
                            </div>

                            {/* Dot indicator */}
                            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                  <NavLink
                    to="/alerts"
                    onClick={() => setShowNotifications(false)}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    View all alerts →
                  </NavLink>
                  {activeCount > 8 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      +{activeCount - 8} more
                    </span>
                  )}
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
