import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Beef, 
  Syringe, 
  Cloud, 
  Bell, 
  Calculator,
  X
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

/**
 * Sidebar Component
 * Main navigation sidebar with menu items
 */
export default function Sidebar() {
  const { sidebarOpen, mobileMenuOpen, setMobileMenuOpen } = useUIStore();

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
      badge: null,
    },
    {
      title: 'Vaccinations',
      icon: Syringe,
      path: '/vaccinations',
      badge: 5, // Example: upcoming vaccinations count
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
      badge: 3, // Example: unacknowledged alerts
      badgeColor: 'bg-red-500',
    },
    {
      title: 'Cost Calculator',
      icon: Calculator,
      path: '/costs',
      badge: null,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 z-30',
          sidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        {sidebarOpen && (
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                <item.icon size={20} />
                <span className="flex-1">{item.title}</span>
                {item.badge !== null && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full',
                      item.badgeColor || 'bg-yellow-500 text-white'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        )}
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Menu */}
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white z-50 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-primary">LivestockIQ</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 hover:bg-gray-100'
                    )
                  }
                >
                  <item.icon size={20} />
                  <span className="flex-1">{item.title}</span>
                  {item.badge !== null && (
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        item.badgeColor || 'bg-yellow-500 text-white'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
