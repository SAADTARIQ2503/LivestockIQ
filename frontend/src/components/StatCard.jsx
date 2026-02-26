import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, change, changeType = "up", icon: Icon, gradient }) {
  const isUp = changeType === "up";

  return (
    <div
      className={`relative rounded-2xl p-5 border border-white/[0.08] overflow-hidden group hover:border-white/20 transition-all duration-300 cursor-default`}
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      {/* Gradient orb */}
      <div
        className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40 ${gradient}`}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient} bg-opacity-20`}
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <Icon size={18} className="text-white" />
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
              isUp
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {change}
          </div>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-gray-500 text-sm mt-1">{label}</p>
      </div>
    </div>
  );
}
