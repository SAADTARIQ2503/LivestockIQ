import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIDetection } from '@/hooks/useAIDetection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function DetectionHistory() {
  const navigate = useNavigate();
  const { detections, isLoadingHistory } = useAIDetection();
  const [filter, setFilter] = useState('all'); // all, healthy, diseased

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading detection history...</p>
        </div>
      </div>
    );
  }

  const detectionsList = Array.isArray(detections) ? detections : (detections?.results || []);
  
  const filteredDetections = detectionsList.filter(d => {
    if (filter === 'healthy') return d.predicted_disease === 'healthy';
    if (filter === 'diseased') return d.predicted_disease !== 'healthy';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Detection History</h1>
          <p className="text-gray-600 mt-1">View all past AI disease detections</p>
        </div>
        <Button onClick={() => navigate('/ai-detection')}>
          New Detection
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'All Detections' },
          { value: 'diseased', label: 'Diseased Only' },
          { value: 'healthy', label: 'Healthy Only' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === f.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Detections Grid */}
      {filteredDetections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDetections.map((detection) => (
            <Card key={detection.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/ai-detection/history/${detection.id}`)}>
              <CardContent className="p-4">
                {detection.image && (
                  <img 
                    src={detection.image} 
                    alt="Detection" 
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={detection.predicted_disease === 'healthy' ? 'success' : 'destructive'}>
                      {detection.predicted_disease.replace('-', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">
                      {(detection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(detection.created_at)}
                  </p>
                  {detection.animal && (
                    <p className="text-sm text-gray-600">
                      Animal ID: #{detection.animal}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">No Detections Found</h3>
            <p className="text-gray-600 mb-4">
              {filter !== 'all' 
                ? `No ${filter} detections in history`
                : 'Upload your first image to get started'
              }
            </p>
            <Button onClick={() => navigate('/ai-detection')}>
              Start New Detection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}