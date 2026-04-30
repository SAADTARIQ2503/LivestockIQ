import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft, Syringe, Calendar, Clock, RefreshCw,
  Leaf, BookOpen, AlertCircle, CheckCircle, Zap,
} from 'lucide-react';

// ─── Confidence helpers ───────────────────────────────────────────────────────

const CONFIDENCE_CONFIG = {
  high:   { min: 0.7, label: 'High Match',    color: 'bg-green-100 text-green-800 border-green-200',   bar: 'bg-green-500',  dot: 'bg-green-500' },
  medium: { min: 0.4, label: 'Good Match',    color: 'bg-blue-100 text-blue-800 border-blue-200',     bar: 'bg-blue-500',   dot: 'bg-blue-500'  },
  low:    { min: 0,   label: 'Partial Match', color: 'bg-gray-100 text-gray-700 border-gray-200',     bar: 'bg-gray-400',   dot: 'bg-gray-400'  },
};

function getTier(score) {
  if (score >= 0.7) return CONFIDENCE_CONFIG.high;
  if (score >= 0.4) return CONFIDENCE_CONFIG.medium;
  return CONFIDENCE_CONFIG.low;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function InfoBlock({ icon: Icon, iconColor, iconBg, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-base text-gray-800 leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VaccineDetail() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const vaccine = state?.vaccine;

  const handleSchedule = () => {
    navigate('/vaccinations/schedule', { state: { vaccine_name: vaccine?.vaccine_name } });
  };

  if (!vaccine) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Syringe className="mx-auto text-gray-300 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vaccine not found</h2>
          <p className="text-gray-500 mb-6">
            Navigate here from the recommendations page.
          </p>
          <Button onClick={() => navigate('/vaccinations/recommended')}>
            Back to Recommendations
          </Button>
        </div>
      </div>
    );
  }

  const tier = vaccine.confidence != null ? getTier(vaccine.confidence) : null;
  const pct  = vaccine.confidence != null ? Math.round(vaccine.confidence * 100) : null;

  const hasDosingInfo = vaccine.age_at_first_dose || vaccine.booster_dose || vaccine.subsequent_dose;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/vaccinations/recommended')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Vaccine Details</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-1.5 text-sm">
              <Zap size={13} className="text-primary" />
              Recommended by LSH similarity search
            </p>
          </div>
        </div>
        <Button onClick={handleSchedule}>
          <Calendar size={16} className="mr-2" />
          Schedule Vaccination
        </Button>
      </div>

      {/* ── Hero card ── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/90 to-primary px-8 py-8 text-white">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Syringe size={40} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold leading-tight">{vaccine.vaccine_name}</h2>
              <p className="text-white/80 text-lg mt-1">{vaccine.disease_name}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {vaccine.animal_species}
                </span>
                {vaccine.vaccination_season && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium flex items-center gap-1.5">
                    <Leaf size={13} />
                    {vaccine.vaccination_season}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          {tier && pct != null && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white/90">AI Match Confidence</span>
                  <span className="px-2.5 py-0.5 bg-white/20 border border-white/30 rounded-full text-xs font-semibold text-white">
                    {tier.label}
                  </span>
                </div>
                <span className="text-2xl font-bold">{pct}%</span>
              </div>
              <div className="w-full bg-white/25 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-white transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Overview grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={22} className="text-red-500" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Disease</p>
            <p className="text-base font-semibold text-gray-900 leading-tight">{vaccine.disease_name}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Syringe size={22} className="text-primary" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Target Species</p>
            <p className="text-base font-semibold text-gray-900 leading-tight">{vaccine.animal_species}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Leaf size={22} className="text-blue-500" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Season</p>
            <p className="text-base font-semibold text-gray-900 leading-tight">
              {vaccine.vaccination_season || '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Dosing schedule ── */}
      {hasDosingInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock size={20} className="text-primary" />
              Dosing Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoBlock
              icon={Clock}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
              label="Age at First Dose"
              value={vaccine.age_at_first_dose}
            />
            <InfoBlock
              icon={RefreshCw}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
              label="Booster Dose"
              value={vaccine.booster_dose}
            />
            <InfoBlock
              icon={RefreshCw}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
              label="Subsequent Doses"
              value={vaccine.subsequent_dose}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Vaccination season (detailed) ── */}
      {vaccine.vaccination_season && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Leaf size={20} className="text-green-600" />
              Recommended Season
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar size={22} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-0.5">
                  Vaccination Window
                </p>
                <p className="text-xl font-semibold text-green-900">{vaccine.vaccination_season}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Related / additional information ── */}
      {vaccine.related_information && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen size={20} className="text-amber-600" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                {vaccine.related_information}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Best practices ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle size={20} className="text-green-600" />
            Vaccination Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['Follow the Schedule',  'Administer vaccines on the recommended timeline for maximum protection.'],
              ['Proper Storage',       'Store vaccines at the manufacturer-specified temperature range.'],
              ['Record Keeping',       'Maintain accurate records of every vaccination administered.'],
              ['Consult a Vet',        'Always verify vaccination protocols with a licensed veterinarian.'],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-green-600" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">{title}: </span>{desc}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Quick actions ── */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleSchedule} className="w-full h-12 text-base">
              <Calendar size={18} className="mr-2" />
              Schedule This Vaccination
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/vaccinations/recommended')}
              className="w-full h-12 text-base"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
