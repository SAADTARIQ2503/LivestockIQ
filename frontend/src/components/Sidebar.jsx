import {
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  Settings,
  Zap,
  ChevronLeft,
  Users,
  Bell,
  LogOut,
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ activePage, setActivePage, isOpen, setIsOpen }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          relative z-30 flex flex-col h-full bg-gray-950 border-r border-white/[0.06]
          transition-all duration-300 ease-in-out shrink-0
          ${isOpen ? "w-64" : "w-[70px]"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-fuchsia-500/30">
            <Zap size={18} className="text-white" fill="white" />
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
                Novex
              </span>
              <span className="text-xs text-fuchsia-400 block -mt-0.5 whitespace-nowrap">
                Pro Platform
              </span>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-10"
        >
          <ChevronLeft
            size={12}
            className={`transition-transform duration-300 ${!isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {isOpen && (
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-3">
              Main Menu
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group relative
                  ${isActive
                    ? "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/20 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-r-full" />
                )}
                <Icon
                  size={18}
                  className={`shrink-0 ${isActive ? "text-fuchsia-400" : "text-gray-500 group-hover:text-gray-300"}`}
                />
                {isOpen && (
                  <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                )}
                {isActive && isOpen && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                )}

                {/* Tooltip when collapsed */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-white/10">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/[0.06] pt-3">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all duration-200 group">
            <Bell size={18} className="shrink-0 text-gray-500 group-hover:text-gray-300" />
            {isOpen && <span>Notifications</span>}
          </button>
          {/* User Avatar */}
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              AK
            </div>
            {isOpen && (
              <div className="overflow-hidden flex-1">
                <p className="text-white text-sm font-medium whitespace-nowrap">Alex Kim</p>
                <p className="text-gray-500 text-xs whitespace-nowrap">alex@novex.io</p>
              </div>
            )}
            {isOpen && <LogOut size={14} className="text-gray-600 hover:text-gray-400 shrink-0" />}
          </div>
        </div>
      </aside>
    </>
  );
}
