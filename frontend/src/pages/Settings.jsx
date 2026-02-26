import { useState } from "react";
import Card from "../components/Card";
import { Bell, Shield, Palette, Globe, CreditCard, ChevronRight, Check } from "lucide-react";

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "billing", label: "Billing" },
];

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
        enabled ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: false,
    marketing: false,
    security: true,
  });
  const [plan] = useState("pro");

  const notifItems = [
    { id: "email", label: "Email Notifications", desc: "Receive updates via email" },
    { id: "push", label: "Push Notifications", desc: "Browser and mobile alerts" },
    { id: "weekly", label: "Weekly Digest", desc: "Summary of activity every Monday" },
    { id: "marketing", label: "Product Updates", desc: "New features and announcements" },
    { id: "security", label: "Security Alerts", desc: "Login attempts and unusual activity" },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="space-y-5">
          <Card className="p-6">
            <h3 className="text-white font-semibold mb-5">Personal Info</h3>
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xl font-bold">
                AK
              </div>
              <div>
                <p className="text-white font-medium">Alex Kim</p>
                <p className="text-gray-500 text-sm">alex@novex.io</p>
                <button className="text-fuchsia-400 hover:text-fuchsia-300 text-xs mt-1 transition-colors">
                  Change avatar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "First Name", value: "Alex" },
                { label: "Last Name", value: "Kim" },
                { label: "Email", value: "alex@novex.io" },
                { label: "Company", value: "Novex Inc." },
                { label: "Role", value: "Product Manager" },
                { label: "Timezone", value: "UTC-8 (PST)" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-gray-500 text-xs font-medium mb-1.5">{f.label}</label>
                  <input
                    defaultValue={f.value}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/[0.07] transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-fuchsia-500/25">
                Save Changes
              </button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "notifications" && (
        <Card className="p-6">
          <h3 className="text-white font-semibold mb-1">Notification Preferences</h3>
          <p className="text-gray-500 text-sm mb-6">Choose how and when you want to be notified.</p>
          <div className="space-y-4">
            {notifItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                </div>
                <Toggle
                  enabled={notifications[item.id]}
                  onChange={(val) => setNotifications((prev) => ({ ...prev, [item.id]: val }))}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "security" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-white font-semibold mb-5">Security Settings</h3>
            <div className="space-y-4">
              {[
                { label: "Two-Factor Authentication", desc: "Add an extra layer of security", enabled: true },
                { label: "Login Notifications", desc: "Get alerted on new device logins", enabled: true },
                { label: "API Access", desc: "Allow third-party API integrations", enabled: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className={item.enabled ? "text-emerald-400" : "text-gray-600"} />
                    <div>
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${item.enabled ? "text-emerald-400 bg-emerald-500/10" : "text-gray-500 bg-white/[0.05]"}`}>
                    {item.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="space-y-4">
          {/* Current Plan */}
          <div className="relative rounded-2xl p-6 bg-gradient-to-r from-violet-900/60 via-fuchsia-900/40 to-pink-900/60 border border-fuchsia-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_60%)]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-fuchsia-400 text-xs font-semibold uppercase tracking-wider">Current Plan</span>
                  </div>
                  <h3 className="text-white text-2xl font-bold">Pro Plan</h3>
                  <p className="text-gray-400 text-sm mt-1">$49 / month · Renews March 1, 2025</p>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">$49</div>
                  <div className="text-gray-400 text-xs">per month</div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                  Upgrade Plan
                </button>
                <button className="text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                  Cancel Plan
                </button>
              </div>
            </div>
          </div>

          <Card className="p-6">
            <h3 className="text-white font-semibold mb-4">Plan Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Unlimited projects",
                "Advanced analytics",
                "10 team members",
                "Priority support",
                "Custom domains",
                "API access",
                "Export reports",
                "SSO integration",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                  <Check size={14} className="text-fuchsia-400 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
