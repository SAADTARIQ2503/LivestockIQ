import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { farmsAPI } from '@/api/farms';
import { useFarms } from '@/hooks/useFarms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle, AlertTriangle, MapPin, Loader2 } from 'lucide-react';

export default function EditFarm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateFarm, isUpdating, geocode, isGeocoding } = useFarms();

  const { data, isLoading } = useQuery({
    queryKey: ['farm', id],
    queryFn: () => farmsAPI.getById(id),
  });

  const farm = data?.data;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [geocodeError, setGeocodeError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (farm) {
      setName(farm.name);
      setAddress(farm.address);
      if (farm.latitude && farm.longitude) {
        setCoords({ latitude: farm.latitude, longitude: farm.longitude, formatted_address: farm.address });
      }
    }
  }, [farm]);

  const runGeocode = async (addr) => {
    const res = await geocode({ address: addr });
    return res.data;
  };

  const handleGeocode = async () => {
    if (!address.trim()) return;
    setGeocodeError('');
    try {
      const data = await runGeocode(address.trim());
      setCoords(data);
      setAddress(data.formatted_address);
    } catch (err) {
      setGeocodeError(err.response?.data?.error || 'Could not geocode address.');
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    let lat = coords?.latitude ?? null;
    let lon = coords?.longitude ?? null;
    let finalAddress = address.trim();

    // coords is null when the address was changed — auto-geocode so we don't keep stale coordinates
    if (!lat || !lon) {
      try {
        const data = await runGeocode(finalAddress);
        lat = data.latitude;
        lon = data.longitude;
        finalAddress = data.formatted_address;
        setCoords(data);
        setAddress(finalAddress);
      } catch {
        // proceed without coordinates if geocoding fails
      }
    }

    updateFarm(
      { id, data: { name: name.trim(), address: finalAddress, latitude: lat, longitude: lon } },
      {
        onSuccess: () => navigate('/farms'),
        onSettled: () => setIsSaving(false),
      }
    );
  };

  const busy = isSaving || isUpdating || isGeocoding;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Farm</h1>
        <p className="text-gray-600 mt-1">Update farm details and location.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Farm Details</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Farm Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Farm Address *</Label>
            <div className="flex gap-2">
              <Input
                value={address}
                onChange={e => { setAddress(e.target.value); setCoords(null); setGeocodeError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleGeocode()}
                className="flex-1"
                disabled={busy}
              />
              <Button variant="outline" onClick={handleGeocode} disabled={!address.trim() || busy} title="Preview coordinates">
                {isGeocoding
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Search size={16} />}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Coordinates are set automatically when you save. Use the search button to preview first.
            </p>

            {geocodeError && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                <AlertTriangle size={14} /> {geocodeError}
              </div>
            )}

            {coords && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                  <CheckCircle size={15} /> Location verified
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  <MapPin size={11} className="inline mr-1" />
                  {coords.latitude?.toFixed(5)}, {coords.longitude?.toFixed(5)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/farms')} disabled={busy}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={busy}>
              {busy
                ? <><Loader2 size={15} className="animate-spin mr-2" />{isGeocoding || isSaving ? 'Getting location...' : 'Saving...'}</>
                : 'Save Changes'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
