import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsAPI } from '@/api/alerts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bell, CheckCircle, Filter, Trash2, Eye, RefreshCw } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';
import { Scan } from 'lucide-react';
const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    borderClass: 'border-l-red-500',
    bgClass: 'bg-red-50',
    iconColor: 'text-red-500',
  },
  warning: {
    label: 'Warning',
    borderClass: 'border-l-yellow-500',
    bgClass: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
  },
  info: {
    label: 'Info',
    borderClass: 'border-l-blue-500',
    bgClass: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
};

const STATUS_FILTERS = [
  { label: 'All Alerts', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Resolved', value: 'resolved' },
];

const SEVERITY_FILTERS = [
  { label: 'All Severities', value: '' },
  { label: 'Critical', value: 'critical' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
];

export default function AlertsList() {
  const queryClient = useQueryClient();
const navigate = useNavigate();  
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [expandedAlert, setExpandedAlert] = useState(null);

  const { data: alertsData, isLoading, error, refetch } = useQuery({
    queryKey: ['alerts', { status: statusFilter, severity: severityFilter }],
    queryFn: () =>
      alertsAPI.getAlerts({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      }),
  });

  const { mutate: resolveAlert, isPending: isResolving } = useMutation({
    mutationFn: (id) => alertsAPI.resolveAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const { mutate: deleteAlert, isPending: isDeleting } = useMutation({
    mutationFn: (id) => alertsAPI.deleteAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const alerts = Array.isArray(alertsData?.data)
    ? alertsData.data
    : alertsData?.data?.results || [];

  const activeCount = alerts.filter((a) => !a.is_resolved).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.is_resolved).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <p className="text-red-500 font-semibold">Failed to load alerts</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            <RefreshCw size={16} className="mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor and manage system alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button onClick={() => navigate('/ai-detection')} className="flex items-center gap-2">
            <Scan size={18} />
            Run AI Detection
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold">{alerts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-yellow-600">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Filter size={16} />
              Filter by:
            </div>
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="hidden md:block w-px h-6 bg-gray-200" />
            <div className="flex gap-2 flex-wrap">
              {SEVERITY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSeverityFilter(f.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${severityFilter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-gray-600">
        Showing {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
      </p>

      {/* Alerts List */}
      {alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
            const isExpanded = expandedAlert === alert.id;

            return (
              <Card
                key={alert.id}
                className={`border-l-4 ${config.borderClass} transition-shadow hover:shadow-md ${alert.is_resolved ? 'opacity-60' : ''
                  }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgClass}`}
                      >
                        {alert.is_resolved ? (
                          <CheckCircle className="text-green-500" size={20} />
                        ) : (
                          <AlertTriangle className={config.iconColor} size={20} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                          <Badge variant="outline" className={`text-xs ${config.iconColor}`}>
                            {config.label}
                          </Badge>
                          {alert.is_resolved && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              Resolved
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{alert.message}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                          <span>Created: {formatDate(alert.created_at)}</span>
                          {alert.animal && <span>Animal ID: {alert.animal}</span>}
                          {alert.is_resolved && alert.resolved_at && (
                            <span>Resolved: {formatDate(alert.resolved_at)}</span>
                          )}
                        </div>

                        {isExpanded && (alert.detection_detail || alert.lameness_detection_detail) && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                            <p className="text-sm font-medium text-gray-700">AI Detection Details</p>

                            {/* Disease detection — image */}
                            {alert.detection_detail && (
                              <div className="flex gap-4 items-start">
                                {alert.detection_detail.image_url && (
                                  <img
                                    src={alert.detection_detail.image_url}
                                    alt="Detected"
                                    className="w-40 h-40 object-cover rounded-lg border border-gray-300 flex-shrink-0"
                                  />
                                )}
                                <div className="text-sm space-y-1 text-gray-600">
                                  <p><span className="font-medium">Disease:</span> {alert.detection_detail.predicted_disease}</p>
                                  <p><span className="font-medium">Confidence:</span> {(alert.detection_detail.confidence * 100).toFixed(1)}%</p>
                                  {alert.detection_detail.model_used && (
                                    <p><span className="font-medium">Model:</span> {alert.detection_detail.model_used}</p>
                                  )}
                                  {alert.detection_detail.processing_time && (
                                    <p><span className="font-medium">Processing:</span> {alert.detection_detail.processing_time.toFixed(2)}s</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Lameness detection — video */}
                            {alert.lameness_detection_detail && (
                              <div className="flex gap-4 items-start">
                                {alert.lameness_detection_detail.video_url && (
                                  <video
                                    src={alert.lameness_detection_detail.video_url}
                                    controls
                                    className="w-56 h-40 rounded-lg border border-gray-300 flex-shrink-0 bg-black"
                                  />
                                )}
                                <div className="text-sm space-y-1 text-gray-600">
                                  <p><span className="font-medium">Result:</span> {alert.lameness_detection_detail.predicted_result}</p>
                                  <p><span className="font-medium">Confidence:</span> {(alert.lameness_detection_detail.confidence * 100).toFixed(1)}%</p>
                                  {alert.lameness_detection_detail.frames_sampled && (
                                    <p><span className="font-medium">Frames sampled:</span> {alert.lameness_detection_detail.frames_sampled}</p>
                                  )}
                                  {alert.lameness_detection_detail.processing_time && (
                                    <p><span className="font-medium">Processing:</span> {alert.lameness_detection_detail.processing_time.toFixed(2)}s</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(alert.detection || alert.lameness_detection) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                          title="View detection details"
                        >
                          <Eye size={16} />
                        </Button>
                      )}
                      {!alert.is_resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                          disabled={isResolving}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <CheckCircle size={16} className="mr-1" />
                          Resolve
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Delete this alert?')) deleteAlert(alert.id);
                        }}
                        disabled={isDeleting}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">
              {statusFilter === 'active' ? 'No active alerts' : 'No alerts found'}
            </h3>
            <p className="text-gray-600">
              {statusFilter === 'active'
                ? 'All clear! No active alerts at this time.'
                : 'Try adjusting your filters or check back later.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}