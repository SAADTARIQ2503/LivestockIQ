import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiDetectionAPI } from '@/api/alerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Upload, Image, Video, AlertTriangle, CheckCircle,
  Clock, History, X, RefreshCw, Zap, Activity,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

// ─── Disease configs for both models ───────────────────────────────────────

const DISEASE_CONFIG = {
  // ── Disease detection model (ViT-B/16, 6-class) ──────────────────────────
  'foot-and-mouth': {
    label: 'Foot & Mouth Disease',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertTriangle,
  },
  healthy: {
    label: 'Healthy',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
  },
  lumpy: {
    label: 'Lumpy Skin Disease',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: AlertTriangle,
  },
  mastitis: {
    label: 'Mastitis',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: AlertTriangle,
  },
  ringworm: {
    label: 'Ringworm',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    icon: AlertTriangle,
  },
  // Model rejects non-cattle images
  'not_cow': {
    label: 'Not a Cow',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: AlertTriangle,
  },
  // ── Lameness detection model (ViT-LSTM) ──────────────────────────────────
  normal: {
    label: 'Normal Gait',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
  },
  lameness: {
    label: 'Lameness Detected',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertTriangle,
  },
};

const ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  video: ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo', 'video/mkv', 'video/x-matroska'],
};

// ─── Model definitions ──────────────────────────────────────────────────────

const MODELS = {
  vit_image: {
    id: 'vit_image',
    label: 'Disease Detection',
    sublabel: 'ViT — Image Model',
    description: 'Detects Foot & Mouth Disease and Lumpy Skin Disease from images or short clips.',
    acceptedTypes: [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.video],
    acceptAttr: 'image/*,video/*',
    hint: 'Supports JPG, PNG, WEBP, MP4, AVI, MOV',
    icon: Image,
    apiCall: (formData) => aiDetectionAPI.detectDisease(formData),
    endpoint: 'disease',
    historyKey: 'detection-history',
    getHistory: () => aiDetectionAPI.getDetectionHistory(),
    resultIsLameness: false,
  },
  vit_lstm: {
    id: 'vit_lstm',
    label: 'Lameness Detection',
    sublabel: 'ViT-LSTM — Video Model',
    description: 'Analyses cattle gait from video to detect lameness. Samples 20 frames through ViT + LSTM.',
    acceptedTypes: ACCEPTED_TYPES.video,
    acceptAttr: 'video/*',
    hint: 'Supports MP4, AVI, MOV, MKV',
    icon: Video,
    apiCall: (formData) => aiDetectionAPI.detectLameness(formData),
    endpoint: 'lameness',
    historyKey: 'lameness-history',
    getHistory: () => aiDetectionAPI.getLamenessHistory(),
    resultIsLameness: true,
  },
};

// ─── Per-disease bar fill colours ──────────────────────────────────────────

const BAR_FILL = {
  'foot-and-mouth': 'bg-red-500',
  healthy:          'bg-green-500',
  lumpy:            'bg-orange-500',
  mastitis:         'bg-purple-500',
  ringworm:         'bg-pink-500',
  not_cow:          'bg-yellow-500',
  normal:           'bg-green-500',
  lameness:         'bg-red-500',
};

// ─── Single-cow result section ──────────────────────────────────────────────

function CowResultSection({ detectionData, cowIndex, totalCows, modelId }) {
  const resultDisease = detectionData.result?.disease;
  const resultConfig  = resultDisease ? DISEASE_CONFIG[resultDisease] || DISEASE_CONFIG.healthy : null;
  const isUnhealthy   = resultDisease && !['healthy', 'normal', 'not_cow'].includes(resultDisease);
  const isNotCow      = resultDisease === 'not_cow';
  const ResultIcon    = resultConfig?.icon;

  const sorted   = Object.entries(detectionData.result?.all_probabilities || {}).sort(([, a], [, b]) => b - a);
  const topLabel = sorted[0]?.[0];

  return (
    <div className="space-y-4">
      {/* Primary result */}
      <Card className={`border-2 ${resultConfig?.border}`}>
        <CardContent className={`p-6 ${resultConfig?.bg}`}>
          {/* Cropped cow image (multi-cow only) */}
          {totalCows > 1 && detectionData.cow_image_url && (
            <div className="mb-4 rounded-lg overflow-hidden border border-gray-200 bg-white">
              <img
                src={detectionData.cow_image_url}
                alt={`Cow ${cowIndex}`}
                className="w-full max-h-48 object-contain"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              {ResultIcon && <ResultIcon className={resultConfig.color} size={28} />}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-0.5">
                {totalCows > 1 ? `Cow #${cowIndex} Result` : 'Detection Result'}
              </p>
              <p className={`text-2xl font-bold ${resultConfig?.color}`}>{resultConfig?.label}</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Confidence:{' '}
                <span className="font-semibold">
                  {Math.round((detectionData.result?.confidence || 0) * 100)}%
                </span>
              </p>
              {detectionData.ocr_detected_animal_id != null && (
                <p className="text-sm text-gray-600 mt-0.5">
                  Animal ID (OCR):{' '}
                  <span className="font-semibold">#{detectionData.ocr_detected_animal_id}</span>
                </p>
              )}
            </div>
          </div>

          {isNotCow ? (
            <div className="mt-4 p-3 bg-white rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">
                ⚠️ This crop does not appear to contain a cow. Please upload a clear photo of cattle.
              </p>
            </div>
          ) : isUnhealthy ? (
            <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800">
                ⚠️{' '}
                {modelId === 'vit_lstm'
                  ? 'Lameness detected — an alert has been created automatically.'
                  : 'Disease detected — an alert has been created automatically.'}
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">
                ✅{' '}
                {modelId === 'vit_lstm'
                  ? 'No lameness detected — normal gait observed.'
                  : 'No disease detected — this animal appears healthy.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Probability breakdown */}
      {sorted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Probabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sorted.map(([disease, prob]) => (
              <ConfidenceBar key={disease} disease={disease} value={prob} isTop={disease === topLabel} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Meta */}
      <Card>
        <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Detection ID</p>
            <p className="font-medium">{detectionData.detection_id}</p>
          </div>
          {detectionData.ocr_detected_animal_id != null ? (
            <div>
              <p className="text-gray-500">Animal ID (OCR)</p>
              <p className="font-medium text-primary">#{detectionData.ocr_detected_animal_id}</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">Animal ID (OCR)</p>
              <p className="font-medium text-gray-400">Not detected</p>
            </div>
          )}
          {detectionData.result?.processing_time && (
            <div>
              <p className="text-gray-500">Processing Time</p>
              <p className="font-medium">{detectionData.result.processing_time.toFixed(2)}s</p>
            </div>
          )}
          {detectionData.result?.model_used && (
            <div className="col-span-2">
              <p className="text-gray-500">Model</p>
              <p className="font-medium">{detectionData.result.model_used}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Confidence bar ─────────────────────────────────────────────────────────

function ConfidenceBar({ value, disease, isTop }) {
  const [barWidth, setBarWidth] = useState(0);

  // Animate from 0 → actual value after mount so the CSS transition fires.
  useEffect(() => {
    const id = requestAnimationFrame(() => setBarWidth(value * 100));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const config   = DISEASE_CONFIG[disease] || DISEASE_CONFIG.healthy;
  const fill     = BAR_FILL[disease] || 'bg-gray-400';
  const pct      = (value * 100).toFixed(1);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={`font-medium ${isTop ? config.color : 'text-gray-600'}`}>
          {config.label}
          {isTop && <span className="ml-1.5 text-xs font-normal opacity-60">top result</span>}
        </span>
        <span className={`font-semibold tabular-nums ${isTop ? config.color : 'text-gray-500'}`}>
          {pct}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ease-out ${fill} ${
            isTop ? 'opacity-100' : 'opacity-50'
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

// ─── Model selector card ────────────────────────────────────────────────────

function ModelSelector({ selected, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Object.values(MODELS).map((m) => {
        const Icon = m.icon;
        const active = selected === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              active
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <Icon size={18} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${active ? 'text-primary' : 'text-gray-800'}`}>
                  {m.label}
                </p>
                <p className="text-xs text-gray-400">{m.sublabel}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{m.description}</p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function AIDetection() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [selectedModel, setSelectedModel] = useState('vit_image');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [tagId, setTagId] = useState('');
  const [detectionResult, setDetectionResult] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'history'

  const model = MODELS[selectedModel];

  // ── History query (switches key based on model) ──
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: [model.historyKey],
    queryFn: model.getHistory,
    enabled: activeTab === 'history',
  });

  // ── Detection mutation ──
  const { mutate: runDetection, isPending: isDetecting } = useMutation({
    mutationFn: (formData) => model.apiCall(formData),
    onSuccess: (res) => {
      setDetectionResult(res.data);
      queryClient.invalidateQueries({ queryKey: [model.historyKey] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const history = Array.isArray(historyData?.data)
    ? historyData.data
    : historyData?.data?.results || [];

  // ── File handling ──
  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!model.acceptedTypes.includes(file.type)) {
      alert(`This model only accepts: ${model.hint}`);
      return;
    }
    setSelectedFile(file);
    setDetectionResult(null);
    setPreview(URL.createObjectURL(file));
  }, [model]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);
  const handleInputChange = (e) => handleFile(e.target.files?.[0]);

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setDetectionResult(null);
    setTagId('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleModelChange = (id) => {
    setSelectedModel(id);
    clearFile();
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (tagId.trim()) formData.append('tag_id', tagId.trim());
    runDetection(formData);
  };

  const isVideo = selectedFile && ACCEPTED_TYPES.video.includes(selectedFile.type);

  // Normalise response: always work with a `detections` array
  const cowDetections = detectionResult?.detections ?? (
    detectionResult ? [{
      cow_index:              1,
      detection_id:           detectionResult.detection_id,
      result:                 detectionResult.result,
      ocr_detected_animal_id: detectionResult.ocr_detected_animal_id,
      cow_image_url:          null,
    }] : []
  );
  const cowCount = detectionResult?.cow_count ?? cowDetections.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Disease Detection</h1>
        <p className="text-gray-600 mt-1">
          Choose a model and upload media to detect livestock health issues
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {['upload', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'history' ? (
              <span className="flex items-center gap-2"><History size={16} /> Detection History</span>
            ) : (
              <span className="flex items-center gap-2"><Zap size={16} /> Run Detection</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Upload Tab ── */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Model selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity size={18} /> Select Detection Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ModelSelector selected={selectedModel} onChange={handleModelChange} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: upload panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload {model.id === 'vit_lstm' ? 'Video' : 'File'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Drop zone */}
                  {!selectedFile ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                        dragActive
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                          <Upload className="text-primary" size={28} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            Drag & drop or click to upload
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{model.hint}</p>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={model.acceptAttr}
                        className="hidden"
                        onChange={handleInputChange}
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      {isVideo ? (
                        <video src={preview} controls className="w-full max-h-64 object-contain" />
                      ) : (
                        <img src={preview} alt="Preview" className="w-full max-h-64 object-contain" />
                      )}
                      <button
                        onClick={clearFile}
                        className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <X size={16} />
                      </button>
                      <div className="p-3 border-t border-gray-200 flex items-center gap-2">
                        {isVideo ? <Video size={16} className="text-gray-500" /> : <Image size={16} className="text-gray-500" />}
                        <span className="text-sm text-gray-600 truncate">{selectedFile.name}</span>
                        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tag ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tag / Brand ID <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={tagId}
                      onChange={(e) => setTagId(e.target.value)}
                      placeholder="e.g. A-001, COW-94..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Match the physical tag on the animal. If found, the animal will be marked unhealthy on disease detection.
                    </p>
                  </div>

                  <Button onClick={handleSubmit} disabled={!selectedFile || isDetecting} className="w-full">
                    {isDetecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Analyzing{model.id === 'vit_lstm' ? ' video frames' : ''}…
                      </>
                    ) : (
                      <>
                        <Zap size={16} className="mr-2" />
                        Run {model.label}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Info card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-semibold text-blue-800">How it works</p>
                  {model.id === 'vit_image' ? (
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>Upload a clear image or short video of the animal</li>
                      <li>Multiple cows in one image are detected and analysed separately</li>
                      <li>The ViT model analyses each cow for signs of disease</li>
                      <li>Results show confidence scores for each condition</li>
                      <li>An alert is auto-created if disease confidence exceeds 70%</li>
                    </ul>
                  ) : (
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>Upload a video of the animal walking</li>
                      <li>20 frames are sampled evenly across the video</li>
                      <li>Each frame passes through a ViT backbone, then an LSTM reads the temporal sequence</li>
                      <li>The model classifies gait as Normal or Lameness</li>
                      <li>An alert is auto-created if lameness confidence exceeds 70%</li>
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Results (single-cow) or summary card (multi-cow) */}
            <div>
              {isDetecting && (
                <Card className="h-full flex items-center justify-center min-h-[300px]">
                  <CardContent className="text-center p-12">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-medium text-gray-700">Running AI analysis…</p>
                    {model.id === 'vit_lstm' && (
                      <p className="text-sm text-gray-500 mt-1">Processing video frames through ViT-LSTM</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                  </CardContent>
                </Card>
              )}

              {!isDetecting && !detectionResult && (
                <Card className="h-full flex items-center justify-center min-h-[300px]">
                  <CardContent className="text-center p-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="text-gray-400" size={32} />
                    </div>
                    <p className="font-medium text-gray-500">Results will appear here</p>
                    <p className="text-sm text-gray-400 mt-1">Upload a file and run detection</p>
                  </CardContent>
                </Card>
              )}

              {/* Multi-cow: show a summary card; full results rendered below the grid */}
              {!isDetecting && detectionResult && cowCount > 1 && (
                <Card className="h-full flex items-center justify-center min-h-[300px] border-primary/30 bg-primary/5">
                  <CardContent className="text-center p-12">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-primary">{cowCount}</span>
                    </div>
                    <p className="font-semibold text-gray-800">{cowCount} cows detected</p>
                    <p className="text-sm text-gray-500 mt-1">Individual results are shown below</p>
                  </CardContent>
                </Card>
              )}

              {/* Single-cow: show result inline in this column */}
              {!isDetecting && detectionResult && cowCount === 1 && (
                <div className="space-y-4">
                  <CowResultSection
                    detectionData={cowDetections[0]}
                    cowIndex={1}
                    totalCows={1}
                    modelId={selectedModel}
                  />
                  <Button variant="outline" onClick={clearFile} className="w-full">
                    <RefreshCw size={16} className="mr-2" />
                    Run Another Detection
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ── Multi-cow full-width results grid (outside the 2-col layout) ── */}
          {!isDetecting && detectionResult && cowCount > 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Results — {cowCount} cows detected
                </h2>
                <Button variant="outline" size="sm" onClick={clearFile}>
                  <RefreshCw size={14} className="mr-1.5" />
                  Run Another
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {cowDetections.map((det, idx) => (
                  <div
                    key={det.detection_id}
                    className="rounded-2xl border-2 border-gray-200 bg-gray-50/50 p-4 space-y-4"
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-gray-700">Cow #{idx + 1}</span>
                      <span className="ml-auto text-xs text-gray-400">of {cowCount}</span>
                    </div>
                    <CowResultSection
                      detectionData={det}
                      cowIndex={det.cow_index}
                      totalCows={cowCount}
                      modelId={selectedModel}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Model filter pills */}
          <div className="flex gap-2">
            {Object.values(MODELS).map((m) => (
              <button
                key={m.id}
                onClick={() => { setSelectedModel(m.id); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedModel === m.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {history.length} detection{history.length !== 1 ? 's' : ''} found
            </p>
            <Button variant="outline" size="sm" onClick={refetchHistory}>
              <RefreshCw size={14} className="mr-2" />
              Refresh
            </Button>
          </div>

          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-3">
              {history.map((detection) => {
                const config = DISEASE_CONFIG[detection.predicted_disease] || DISEASE_CONFIG.healthy;
                const DiseaseIcon = config.icon;
                return (
                  <Card key={detection.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                          <DiseaseIcon className={config.color} size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`font-semibold ${config.color}`}>{config.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round((detection.confidence || 0) * 100)}% confidence
                            </Badge>
                            {detection.animal && (
                              <Badge variant="secondary" className="text-xs">
                                Animal #{detection.animal}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatDate(detection.created_at)}
                            </span>
                            {detection.model_used && <span>Model: {detection.model_used}</span>}
                            {detection.processing_time && (
                              <span>{detection.processing_time.toFixed(2)}s</span>
                            )}
                          </div>
                        </div>
                        {detection.image && (
                          <img
                            src={detection.image}
                            alt="Detection"
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <History className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-semibold mb-2">No detections yet</h3>
                <p className="text-gray-500">Run your first {model.label} detection to see results here.</p>
                <Button className="mt-4" variant="outline" onClick={() => setActiveTab('upload')}>
                  Go to Detection
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}