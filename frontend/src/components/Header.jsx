import { Menu, Search, Bell, Plus, Command } from "lucide-react";

const pageTitles = {
  dashboard: { title: "Dashboard", subtitle: "Welcome back, Alex 👋" },
  analytics: { title: "Analytics", subtitle: "Track your growth metrics" },
  projects: { title: "Projects", subtitle: "Manage your active work" },
  team: { title: "Team", subtitle: "Collaborate with your crew" },
  settings: { title: "Settings", subtitle: "Configure your workspace" },
};

export default function Header({ activePage, toggleSidebar }) {
  const { title, subtitle } = pageTitles[activePage] || pageTitles.dashboard;

  return (
    <header className="shrink-0 h-16 bg-gray-950/80 backdrop-blur-sm border-b border-white/[0.06] flex items-center px-6 gap-4">
      {/* Mobile menu toggle */}
      <button
        onClick={toggleSidebar}
        className="text-gray-400 hover:text-white transition-colors lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-white font-bold text-lg leading-none">{title}</h1>
        <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-gray-500 hover:border-white/20 transition-colors cursor-pointer group w-52">
        <Search size={14} />
        <span className="flex-1 text-xs">Search anything...</span>
        <div className="flex items-center gap-0.5 text-[10px] text-gray-600">
          <Command size={10} />
          <span>K</span>
        </div>
      </div>

      {/* Actions */}
      <button className="relative text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/[0.05] rounded-lg">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-fuchsia-500 rounded-full" />
      </button>

      <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:scale-[1.02] active:scale-[0.98]">
        <Plus size={16} />
        <span className="hidden sm:inline">New Project</span>
      </button>
    </header>
  );
}
