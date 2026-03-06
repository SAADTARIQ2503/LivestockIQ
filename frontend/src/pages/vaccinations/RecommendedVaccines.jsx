import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { healthAPI } from '@/api/health';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Search, Syringe, Calendar, AlertCircle,
  Zap, Info, CheckCircle,
} from 'lucide-react';
import { ANIMAL_TYPE_OPTIONS } from '@/utils/constants';

// ─── Season helpers ───────────────────────────────────────────────────────────

const SEASON_OPTIONS = [
  { value: 'Spring', label: 'Spring  ' },
  { value: 'Summer', label: 'Summer  ' },
  { value: 'Autumn', label: 'Autumn  ' },
  { value: 'Winter', label: 'Winter  ' },
  { value: 'Annual', label: 'Annual ' },
];

function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Autumn';
  return 'Winter'; // Dec, Jan, Feb
}

// ─── Confidence bar ───────────────────────────────────────────────────────────

const CONFIDENCE_CONFIG = {
  high: { min: 0.7, label: 'High Match', color: 'bg-green-100 text-green-800 border-green-200', bar: 'bg-green-500' },
  medium: { min: 0.4, label: 'Good Match', color: 'bg-blue-100 text-blue-800 border-blue-200', bar: 'bg-blue-500' },
  low: { min: 0.01, label: 'Partial Match', color: 'bg-gray-100 text-gray-700 border-gray-200', bar: 'bg-gray-400' },
};

function getConfidenceTier(score) {
  if (score >= 0.7) return CONFIDENCE_CONFIG.high;
  if (score >= 0.4) return CONFIDENCE_CONFIG.medium;
  return CONFIDENCE_CONFIG.low;
}

function ConfidenceBar({ score }) {
  const tier = getConfidenceTier(score);
  const pct = Math.round(score * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${tier.color}`}>
          {tier.label}
        </span>
        <span className="text-gray-500 font-medium">{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${tier.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Vaccine card ─────────────────────────────────────────────────────────────

function VaccineCard({ vaccine, onSchedule }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Syringe className="text-primary" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{vaccine.vaccine_name}</h3>
            <p className="text-sm text-red-600 font-medium">{vaccine.disease_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{vaccine.animal_species}</p>
          </div>
        </div>

        {/* Confidence */}
        <ConfidenceBar score={vaccine.confidence} />

        {/* Quick info chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {vaccine.vaccination_season && (
            <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
              <Calendar size={11} />
              {vaccine.vaccination_season}
            </span>
          )}
          {vaccine.subsequent_dose && (
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {vaccine.subsequent_dose}
            </span>
          )}
        </div>

        {/* Expandable details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
            {vaccine.age_at_first_dose && (
              <div>
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">First Dose</span>
                <p className="text-gray-800 mt-0.5">{vaccine.age_at_first_dose}</p>
              </div>
            )}
            {vaccine.booster_dose && (
              <div>
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Booster</span>
                <p className="text-gray-800 mt-0.5">{vaccine.booster_dose}</p>
              </div>
            )}
            {vaccine.related_information && (
              <div className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-1.5">
                  <AlertCircle size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">{vaccine.related_information}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 flex-1"
          >
            <Info size={13} className="mr-1" />
            {expanded ? 'Less' : 'Details'}
          </Button>
          <Button
            size="sm"
            onClick={() => onSchedule(vaccine.vaccine_name)}
            className="flex-1 text-xs"
          >
            <Calendar size={13} className="mr-1" />
            Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VaccineRecommendations() {
  const navigate = useNavigate();
  const currentSeason = getCurrentSeason();

  const [query, setQuery] = useState('');
  const [season, setSeason] = useState(currentSeason); // pre-filled on mount
  const [species, setSpecies] = useState('');

  // If text typed → use it as primary signal (season/species still passed as hints)
  // If no text → build query from dropdowns
  // When no text typed, build a richer query so LSH has enough signal
  const buildFallbackQuery = () => {
    const parts = [];

    if (season) parts.push(season);
    if (species) {
      parts.push(species);
    } else {
      // No species selected — add generic livestock terms so LSH
      // searches broadly across all animal types
      parts.push('cattle buffalo sheep goat livestock vaccine');
    }

    return parts.join(' ');
  };

  const queryString = query.trim() || buildFallbackQuery();

  const { data, isLoading, error } = useQuery({
    queryKey: ['vaccine-recommendations', query, season, species],
    queryFn: () =>
      healthAPI.getVaccineRecommendations({
        q: queryString,
        season,
        species,
        top_n: 12,
      }),
    enabled: true,           // auto-runs on mount with current season
    staleTime: 5 * 60 * 1000,
  });

  const results = data?.data?.results || [];
  const isDirty = query || season !== currentSeason || species;


  const handleSchedule = (vaccineName) => {
    navigate('/vaccinations/schedule', { state: { vaccine_name: vaccineName } });
  };

  const handleReset = () => {
    setQuery('');
    setSeason(currentSeason);
    setSpecies('');
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vaccinations')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">AI Vaccine Recommendations</h1>
            <p className="text-gray-600 mt-1 flex items-center gap-1.5">
              <Zap size={14} className="text-primary" />
              Powered by LSH similarity search · auto-loaded for{' '}
              <strong className="ml-1">{currentSeason}</strong>
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/vaccinations/schedule')}>
          Schedule Vaccination
        </Button>
      </div>

      {/* ── Search / Filter panel ── */}
      <Card>
        <CardContent className="p-4 space-y-4">

          {/* Free-text search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Search by disease or vaccine name
              <span className="text-gray-400 font-normal ml-1">
                (optional — leave blank to filter by season / animal type)
              </span>
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g. "foot and mouth", "rabies", "anthrax", "clostridial"'
                className="pl-9"
              />
            </div>
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs text-gray-400 hover:text-gray-600 mt-1"
              >
                ✕ Clear text search
              </button>
            )}
          </div>

          {/* Season + Animal type dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {SEASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}{opt.value === currentSeason ? ' ← current' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Animal Type</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Animals</option>
                {ANIMAL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status bar + quick chips */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                {query ? (
                  <span>
                    Searching: <strong>"{query}"</strong>
                    {season && <span className="text-gray-400"> · {season}</span>}
                    {species && <span className="text-gray-400"> · {species}</span>}
                  </span>
                ) : (
                  <span>
                    Showing vaccines for{' '}
                    <strong>{season || 'all seasons'}</strong>
                    {species && <span> · <strong>{species}</strong></span>}
                  </span>
                )}
              </div>
              {isDirty && (
                <button
                  onClick={handleReset}
                  className="text-primary underline hover:no-underline ml-4"
                >
                  Reset to {currentSeason}
                </button>
              )}
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-gray-400">Quick:</span>
              {['foot and mouth', 'lumpy skin', 'anthrax', 'rabies', 'brucellosis', 'blackleg'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setQuery(query === chip ? '' : chip)}
                  className={`px-2.5 py-0.5 text-xs rounded-full transition-colors capitalize border ${query === chip
                    ? 'bg-primary text-white border-primary'
                    : 'bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 border-transparent'
                    }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Running LSH similarity search...</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
            <p className="text-red-600 font-medium">Search failed</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Results ── */}
      {!isLoading && !error && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{results.length}</span>{' '}
              vaccine{results.length !== 1 ? 's' : ''} found
              {query && <span className="text-gray-400"> for "{query}"</span>}
              {!query && season && <span className="text-gray-400"> · {season}</span>}
              {!query && species && <span className="text-gray-400"> · {species}</span>}
            </p>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {results.map((vaccine, i) => (
                <VaccineCard key={i} vaccine={vaccine} onSchedule={handleSchedule} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Syringe className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-semibold mb-2">No vaccines found</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Try a different search term, season, or animal type.
                </p>
                <Button variant="outline" onClick={handleReset}>
                  Reset filters
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── Best practices ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            Vaccination Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {[
              ['Follow the Schedule', 'Administer vaccines on the recommended timeline for best protection.'],
              ['Proper Storage', 'Store vaccines at the correct temperature per manufacturer specs.'],
              ['Record Keeping', 'Maintain accurate records of all vaccinations administered.'],
              ['Consult a Vet', 'Always verify vaccination protocols with a licensed veterinarian.'],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle size={12} className="text-green-600" />
                </div>
                <p className="text-gray-700">
                  <strong>{title}:</strong> {desc}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}