import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarms } from '@/hooks/useFarms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AddFarm() {
  const navigate = useNavigate();
  const { createFarm, isCreating, geocode, isGeocoding } = useFarms();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null); // { latitude, longitude, formatted_address }
  const [geocodeError, setGeocodeError] = useState('');

  const handleGeocode = async () => {
    if (!address.trim()) return;
    setGeocodeError('');
    setCoords(null);
    try {
      const res = await geocode({ address });
      setCoords(res.data);
      setAddress(res.data.formatted_address); // use the cleaned address from Google
    } catch (err) {
      setGeocodeError(err.response?.data?.error || 'Could not geocode address. Try being more specific.');
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !address.trim()) return;
    createFarm(
      {
        name: name.trim(),
        address: address.trim(),
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      },
      { onSuccess: () => navigate('/farms') }
    );
  };

  const isValid = name.trim() && address.trim();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Farm</h1>
        <p className="text-gray-600 mt-1">Register a new farm and get its weather automatically.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Farm Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Farm name */}
          <div className="space-y-1.5">
            <Label>Farm Name *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Green Valley Farm"
            />
          </div>

          {/* Address + geocode */}
          <div className="space-y-1.5">
            <Label>Farm Address *</Label>
            <div className="flex gap-2">
              <Input
                value={address}
                onChange={e => { setAddress(e.target.value); setCoords(null); }}
                placeholder="e.g. Sargodha Road, Faisalabad, Pakistan"
                onKeyDown={e => e.key === 'Enter' && handleGeocode()}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleGeocode}
                disabled={!address.trim() || isGeocoding}
              >
                {isGeocoding
                  ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  : <Search size={16} />
                }
              </Button>
            </div>
            <p className="text-xs text-gray-400">Enter the address then click the search button to get coordinates.</p>

            {/* Geocode error */}
            {geocodeError && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                <AlertTriangle size={14} /> {geocodeError}
              </div>
            )}

            {/* Geocode success */}
            {coords && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                  <CheckCircle size={15} /> Location found
                </div>
                <p className="text-sm text-gray-600">{coords.formatted_address}</p>
                <p className="text-xs text-gray-400">
                  <MapPin size={11} className="inline mr-1" />
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                </p>
              </div>
            )}

            {!coords && address.trim() && (
              <p className="text-xs text-orange-500 mt-1">
                ⚠ Click search to verify the location and get coordinates for weather data.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/farms')}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!isValid || isCreating}
            >
              {isCreating
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Saving...</>
                : 'Add Farm'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
