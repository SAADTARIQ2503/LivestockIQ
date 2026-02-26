import { useState } from "react";
import Card from "../components/Card";
import { Plus, MoreHorizontal, CheckCircle2, Clock, Circle, Users, Calendar } from "lucide-react";

const projects = [
  {
    id: 1,
    name: "Onboarding Redesign",
    description: "Revamp the new user onboarding flow with interactive tutorials.",
    status: "active",
    progress: 72,
    due: "Mar 15",
    team: ["AK", "SM", "JT"],
    tags: ["Design", "UX"],
    gradient: "from-violet-600/20 to-fuchsia-600/20",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    id: 2,
    name: "API v3 Migration",
    description: "Migrate all endpoints to the new REST v3 architecture with GraphQL support.",
    status: "active",
    progress: 45,
    due: "Apr 1",
    team: ["LW", "PK"],
    tags: ["Backend", "API"],
    gradient: "from-cyan-600/20 to-blue-600/20",
    accent: "from-cyan-500 to-blue-500",
  },
  {
    id: 3,
    name: "Analytics Dashboard",
    description: "Build real-time analytics with custom charting and exportable reports.",
    status: "review",
    progress: 88,
    due: "Mar 8",
    team: ["NB", "AK", "SM"],
    tags: ["Frontend", "Data"],
    gradient: "from-emerald-600/20 to-teal-600/20",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: 4,
    name: "Mobile App Launch",
    description: "iOS and Android app release with push notifications and offline mode.",
    status: "planning",
    progress: 22,
    due: "May 20",
    team: ["JT", "PK"],
    tags: ["Mobile", "iOS", "Android"],
    gradient: "from-orange-600/20 to-rose-600/20",
    accent: "from-orange-500 to-rose-500",
  },
  {
    id: 5,
    name: "AI Writing Assistant",
    description: "Integrate GPT-powered writing suggestions and auto-completion features.",
    status: "active",
    progress: 58,
    due: "Apr 12",
    team: ["SM", "LW", "NB"],
    tags: ["AI", "Feature"],
    gradient: "from-amber-600/20 to-yellow-600/20",
    accent: "from-amber-500 to-yellow-500",
  },
  {
    id: 6,
    name: "SSO Integration",
    description: "Add SAML 2.0 and OIDC support for enterprise single sign-on.",
    status: "done",
    progress: 100,
    due: "Feb 28",
    team: ["AK"],
    tags: ["Security", "Enterprise"],
    gradient: "from-gray-700/30 to-gray-800/30",
    accent: "from-gray-400 to-gray-500",
  },
];

const statusConfig = {
  active: { label: "Active", icon: Clock, color: "text-fuchsia-400 bg-fuchsia-500/10" },
  review: { label: "In Review", icon: Circle, color: "text-amber-400 bg-amber-500/10" },
  planning: { label: "Planning", icon: Circle, color: "text-cyan-400 bg-cyan-500/10" },
  done: { label: "Complete", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" },
};

const avatarColors = [
  "from-violet-400 to-fuchsia-400",
  "from-cyan-400 to-blue-400",
  "from-orange-400 to-rose-400",
  "from-emerald-400 to-teal-400",
  "from-amber-400 to-yellow-400",
];

export default function Projects() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "review", label: "Review" },
            { id: "planning", label: "Planning" },
            { id: "done", label: "Done" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.id
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity self-start sm:self-auto shadow-lg shadow-fuchsia-500/25">
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((project) => {
          const StatusIcon = statusConfig[project.status].icon;
          return (
            <div
              key={project.id}
              className={`rounded-2xl border border-white/[0.07] bg-gradient-to-br ${project.gradient} p-5 hover:border-white/20 hover:shadow-xl transition-all duration-300 group cursor-pointer`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${statusConfig[project.status].color}`}
                >
                  <StatusIcon size={11} />
                  {statusConfig[project.status].label}
                </span>
                <button className="text-gray-600 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              {/* Title & description */}
              <h3 className="text-white font-semibold text-base mb-1">{project.name}</h3>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">{project.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-[11px] text-gray-400 bg-white/[0.06] px-2 py-0.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-500 text-xs">Progress</span>
                  <span className="text-gray-300 text-xs font-medium">{project.progress}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${project.accent} rounded-full transition-all duration-500`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {project.team.map((initials, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} border-2 border-gray-950 flex items-center justify-center text-[10px] font-bold text-white`}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Calendar size={11} />
                  {project.due}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
