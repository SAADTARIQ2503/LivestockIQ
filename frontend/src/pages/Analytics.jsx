import Card from "../components/Card";
import { Activity, Users, Globe, Zap } from "lucide-react";

const metrics = [
  { label: "Page Views", value: "2.4M", sub: "+18% vs last month", color: "text-violet-400" },
  { label: "Unique Visitors", value: "186K", sub: "+9% vs last month", color: "text-fuchsia-400" },
  { label: "Avg. Session", value: "4m 32s", sub: "+22s vs last month", color: "text-cyan-400" },
  { label: "Bounce Rate", value: "28.4%", sub: "-3.1% vs last month", color: "text-emerald-400" },
];

const heatData = Array.from({ length: 7 }, (_, row) =>
  Array.from({ length: 24 }, (_, col) => Math.floor(Math.random() * 100))
);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Analytics() {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Metric pills */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-5 hover:border-white/20 transition-colors">
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-white text-sm font-medium mt-1">{m.label}</p>
            <p className="text-gray-500 text-xs mt-0.5">{m.sub}</p>
          </Card>
        ))}
      </div>

      {/* Heatmap */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-semibold">Traffic Heatmap</h3>
            <p className="text-gray-500 text-xs mt-0.5">Hourly activity by day of week</p>
          </div>
          <Activity size={18} className="text-fuchsia-400" />
        </div>
        <div className="space-y-1.5 overflow-x-auto">
          {heatData.map((row, ri) => (
            <div key={ri} className="flex items-center gap-1.5">
              <span className="text-gray-600 text-xs w-8 shrink-0">{days[ri]}</span>
              {row.map((val, ci) => (
                <div
                  key={ci}
                  className="flex-1 h-6 rounded-sm transition-all duration-200 hover:scale-110 cursor-default"
                  style={{
                    background: val > 70
                      ? `rgba(167,139,250,${val / 100})`
                      : val > 40
                      ? `rgba(217,70,239,${val / 100})`
                      : `rgba(255,255,255,${val / 400})`,
                  }}
                  title={`${val} events`}
                />
              ))}
            </div>
          ))}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-8" />
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-gray-700">
                {i % 4 === 0 ? `${i}h` : ""}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top pages */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-white font-semibold mb-5">Top Pages</h3>
          <div className="space-y-3">
            {[
              { page: "/dashboard", views: "48.2K", pct: 90 },
              { page: "/pricing", views: "31.5K", pct: 62 },
              { page: "/features", views: "24.8K", pct: 48 },
              { page: "/blog/getting-started", views: "19.3K", pct: 37 },
              { page: "/integrations", views: "14.1K", pct: 26 },
            ].map((p) => (
              <div key={p.page} className="flex items-center gap-4">
                <Globe size={14} className="text-gray-600 shrink-0" />
                <span className="text-gray-300 text-sm font-mono w-52 truncate">{p.page}</span>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
                <span className="text-gray-400 text-sm w-14 text-right">{p.views}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Devices */}
        <Card className="p-6">
          <h3 className="text-white font-semibold mb-5">Device Breakdown</h3>
          <div className="space-y-4">
            {[
              { name: "Desktop", pct: 54, color: "from-violet-500 to-fuchsia-500" },
              { name: "Mobile", pct: 36, color: "from-cyan-500 to-blue-500" },
              { name: "Tablet", pct: 10, color: "from-orange-500 to-rose-500" },
            ].map((d) => (
              <div key={d.name}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-300 text-sm">{d.name}</span>
                  <span className="text-white text-sm font-semibold">{d.pct}%</span>
                </div>
                <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${d.color} rounded-full`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Donut visual */}
            <div className="mt-6 flex justify-center">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#g1)" strokeWidth="3"
                    strokeDasharray="54 46" strokeDashoffset="0" strokeLinecap="round" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#g2)" strokeWidth="3"
                    strokeDasharray="36 64" strokeDashoffset="-54" strokeLinecap="round" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#g3)" strokeWidth="3"
                    strokeDasharray="10 90" strokeDashoffset="-90" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white text-sm font-bold">100K</span>
                  <span className="text-gray-500 text-[10px]">users</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
