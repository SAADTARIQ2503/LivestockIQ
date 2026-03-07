import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { farmsAPI } from '@/api/farms';
import { useFarms } from '@/hooks/useFarms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';

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

  useEffect(() => {
    if (farm) {
      setName(farm.name);
      setAddress(farm.address);
      if (farm.latitude && farm.longitude) {
        setCoords({ latitude: farm.latitude, longitude: farm.longitude, formatted_address: farm.address });
      }
    }
  }, [farm]);

  const handleGeocode = async () => {
    if (!address.trim()) return;
    setGeocodeError('');
    try {
      const res = await geocode({ address });
      setCoords(res.data);
      setAddress(res.data.formatted_address);
    } catch (err) {
      setGeocodeError(err.response?.data?.error || 'Could not geocode address.');
    }
  };

  const handleSubmit = () => {
    updateFarm(
      {
        id,
        data: {
          name: name.trim(),
          address: address.trim(),
          latitude: coords?.latitude ?? farm?.latitude ?? null,
          longitude: coords?.longitude ?? farm?.longitude ?? null,
        },
      },
      { onSuccess: () => navigate('/farms') }
    );
  };

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
                onChange={e => { setAddress(e.target.value); setCoords(null); }}
                onKeyDown={e => e.key === 'Enter' && handleGeocode()}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleGeocode} disabled={!address.trim() || isGeocoding}>
                {isGeocoding
                  ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  : <Search size={16} />}
              </Button>
            </div>

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
            <Button variant="outline" className="flex-1" onClick={() => navigate('/farms')}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
