import { useState } from "react";
import StatCard from "../components/StatCard";
import Card from "../components/Card";
import {
  DollarSign,
  Users,
  MousePointerClick,
  TrendingUp,
  ArrowRight,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Flame,
  Star,
} from "lucide-react";

const stats = [
  {
    label: "Total Revenue",
    value: "$84,230",
    change: "+12.5%",
    changeType: "up",
    icon: DollarSign,
    gradient: "bg-gradient-to-br from-violet-500 to-fuchsia-600",
  },
  {
    label: "Active Users",
    value: "12,840",
    change: "+8.2%",
    changeType: "up",
    icon: Users,
    gradient: "bg-gradient-to-br from-cyan-500 to-blue-600",
  },
  {
    label: "Conversion Rate",
    value: "3.64%",
    change: "-0.4%",
    changeType: "down",
    icon: MousePointerClick,
    gradient: "bg-gradient-to-br from-orange-500 to-rose-500",
  },
  {
    label: "Growth Score",
    value: "92.4",
    change: "+5.1%",
    changeType: "up",
    icon: TrendingUp,
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
];

const tasks = [
  { id: 1, title: "Finalize onboarding redesign", status: "done", priority: "high" },
  { id: 2, title: "Review Q3 analytics report", status: "progress", priority: "high" },
  { id: 3, title: "Set up CI/CD pipeline", status: "progress", priority: "medium" },
  { id: 4, title: "Integrate Stripe billing v2", status: "todo", priority: "high" },
  { id: 5, title: "Write API documentation", status: "todo", priority: "low" },
  { id: 6, title: "User interviews — 5 sessions", status: "todo", priority: "medium" },
];

const activity = [
  { user: "Sarah M.", action: "Deployed v2.4.1 to production", time: "2m ago", color: "from-violet-400 to-fuchsia-400" },
  { user: "James T.", action: "Closed 14 support tickets", time: "18m ago", color: "from-cyan-400 to-blue-400" },
  { user: "Priya K.", action: "Launched A/B test #12", time: "1h ago", color: "from-orange-400 to-rose-400" },
  { user: "Leo W.", action: "Merged feature/auth-v3", time: "3h ago", color: "from-emerald-400 to-teal-400" },
  { user: "Nina B.", action: "Updated pricing page copy", time: "5h ago", color: "from-amber-400 to-orange-400" },
];

const priorityColors = {
  high: "text-rose-400 bg-rose-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  low: "text-gray-400 bg-gray-500/10",
};

const statusIcons = {
  done: <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />,
  progress: <Clock size={15} className="text-fuchsia-400 shrink-0 animate-pulse" />,
  todo: <Circle size={15} className="text-gray-600 shrink-0" />,
};

// Mini bar chart data
const barData = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];
const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export default function Dashboard() {
  const [activeBar, setActiveBar] = useState(null);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-violet-900/60 via-fuchsia-900/40 to-pink-900/60 border border-fuchsia-500/20 p-6 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(168,85,247,0.15)_0%,_transparent_60%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-fuchsia-600/20 to-transparent rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame size={16} className="text-orange-400" />
              <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider">7-day streak</span>
            </div>
            <h2 className="text-white text-2xl font-bold">You're on fire this week! 🚀</h2>
            <p className="text-gray-400 mt-1 text-sm">Revenue is up 12% and you've hit 3 of your 5 monthly goals.</p>
          </div>
          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap self-start sm:self-center">
            View Report <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-semibold text-base">Revenue Overview</h3>
              <p className="text-gray-500 text-xs mt-0.5">Monthly performance 2024</p>
            </div>
            <div className="flex items-center gap-1 bg-white/[0.05] rounded-lg p-1">
              {["1M", "3M", "6M", "1Y"].map((t) => (
                <button
                  key={t}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    t === "1Y" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-2 h-40 mb-3">
            {barData.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-lg transition-all duration-200 cursor-pointer relative group ${
                    activeBar === i
                      ? "bg-gradient-to-t from-violet-600 to-fuchsia-500 opacity-100"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                  style={{ height: `${h}%` }}
                  onMouseEnter={() => setActiveBar(i)}
                  onMouseLeave={() => setActiveBar(null)}
                >
                  {activeBar === i && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap border border-white/10">
                      ${(h * 1.1).toFixed(1)}k
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {months.map((m, i) => (
              <div key={i} className="flex-1 text-center text-[10px] text-gray-600">{m}</div>
            ))}
          </div>
        </Card>

        {/* Top Channels */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-base">Top Channels</h3>
            <Star size={15} className="text-amber-400" />
          </div>
          <div className="space-y-4">
            {[
              { name: "Organic Search", value: 42, color: "from-violet-500 to-fuchsia-500" },
              { name: "Direct Traffic", value: 28, color: "from-cyan-500 to-blue-500" },
              { name: "Social Media", value: 18, color: "from-orange-500 to-rose-500" },
              { name: "Referrals", value: 12, color: "from-emerald-500 to-teal-500" },
            ].map((ch) => (
              <div key={ch.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-300 text-sm">{ch.name}</span>
                  <span className="text-white text-sm font-semibold">{ch.value}%</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${ch.color} rounded-full`}
                    style={{ width: `${ch.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Task List */}
        <Card className="lg:col-span-3 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-base">Active Tasks</h3>
            <button className="text-fuchsia-400 hover:text-fuchsia-300 text-xs font-medium flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
              >
                {statusIcons[task.status]}
                <span
                  className={`flex-1 text-sm ${
                    task.status === "done" ? "line-through text-gray-600" : "text-gray-300"
                  }`}
                >
                  {task.title}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${priorityColors[task.priority]}`}
                >
                  {task.priority}
                </span>
                <button className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-400 transition-all">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-base">Activity</h3>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Today</span>
          </div>
          <div className="space-y-4">
            {activity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
                >
                  {item.user.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-sm leading-snug">
                    <span className="text-white font-medium">{item.user}</span>{" "}
                    {item.action}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
