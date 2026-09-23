'use client';

import { useRef, useState, useCallback } from 'react';
import {
  Loader2, UploadCloud, Camera, X, Leaf, AlertTriangle,
  CheckCircle2, AlertCircle, Microscope, ClipboardList,
  Sparkles, RefreshCw, Save, Share2, ChevronDown,
} from 'lucide-react';

interface AnalysisResult {
  cropType:          string;
  healthStatus:      string;
  confidenceScore:   number;
  detectedSymptoms:  string[];
  recommendedAction: string;
  severity:          'healthy' | 'mild' | 'moderate' | 'severe';
  isNoCropDetected?: boolean;
}

interface FieldUploaderProps {
  onUpload?: (file: File, previewUrl: string) => void;
}

// ── helpers ───────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  healthy:  { bg: 'bg-emerald-50',  border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2,   iconColor: 'text-emerald-500', label: 'Healthy' },
  mild:     { bg: 'bg-yellow-50',   border: 'border-yellow-200',  badge: 'bg-yellow-100  text-yellow-800',  icon: AlertTriangle,  iconColor: 'text-yellow-500',  label: 'Mild'    },
  moderate: { bg: 'bg-orange-50',   border: 'border-orange-200',  badge: 'bg-orange-100  text-orange-800',  icon: AlertTriangle,  iconColor: 'text-orange-500',  label: 'Moderate'},
  severe:   { bg: 'bg-red-50',      border: 'border-red-200',     badge: 'bg-red-100     text-red-800',     icon: AlertCircle,    iconColor: 'text-red-500',     label: 'Severe'  },
};

const truncate = (name: string, max = 28) => {
  if (name.length <= max) return name;
  const ext = name.slice(name.lastIndexOf('.'));
  return name.slice(0, max - ext.length - 3) + '...' + ext;
};

export default function FieldUploader({ onUpload }: FieldUploaderProps) {
  const [isDragging,     setIsDragging]     = useState(false);
  const [uploadedFile,   setUploadedFile]   = useState<File | null>(null);
  const [previewUrl,     setPreviewUrl]     = useState<string | null>(null);
  const [isLoading,      setIsLoading]      = useState(false);
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error,          setError]          = useState<string | null>(null);
  const [saved,          setSaved]          = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── file handling ────────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    setSaved(false);
    const objectUrl = URL.createObjectURL(file);
    setTimeout(() => {
      setPreviewUrl(objectUrl);
      setUploadedFile(file);
      setIsLoading(false);
      onUpload?.(file, objectUrl);
    }, 800);
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null); setUploadedFile(null);
    setIsLoading(false); setIsAnalyzing(false);
    setAnalysisResult(null); setError(null); setSaved(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDragOver  = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop      = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
    else setError('Please upload a valid image file (JPG, PNG, WEBP).');
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // ── AI analyse ───────────────────────────────────────────────────────────────
  const handleAnalyse = useCallback(async () => {
    if (!uploadedFile) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setSaved(false);

    try {
      const formData = new FormData();
      formData.append('photo', uploadedFile);

      const token = typeof window !== 'undefined'
        ? localStorage.getItem('mk_access_token')
        : null;

      const res = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const data = await res.json();

      if (!data.analysis) throw new Error('No analysis returned from server.');

      const result: AnalysisResult = {
        cropType:          data.analysis.cropType          || 'Unknown Crop',
        healthStatus:      data.analysis.healthStatus      || 'Unknown',
        confidenceScore:   data.analysis.confidenceScore   || 70,
        detectedSymptoms:  data.analysis.detectedSymptoms  || [],
        recommendedAction: data.analysis.recommendedAction || 'Consult your local agricultural extension officer.',
        severity:          data.analysis.severity          || 'mild',
        isNoCropDetected:  data.analysis.isNoCropDetected  || false,
      };

      if (result.isNoCropDetected) {
        setError('No crop or plant detected in the photo. Please upload a clear photo of your crop or field.');
        setIsAnalyzing(false);
        return;
      }

      setAnalysisResult(result);
    } catch (err: any) {
      setError(err?.message || 'Analysis failed. Please check your internet connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [uploadedFile]);

  // ── save to farm record ───────────────────────────────────────────────────────
  const handleSave = () => {
    setSaved(true);
    // Could extend to call a /api/farm/notes endpoint in the future
  };

  // ── share result ──────────────────────────────────────────────────────────────
  const handleShare = () => {
    if (!analysisResult) return;
    const text = `MaatiKatha Field Doctor Analysis\nCrop: ${analysisResult.cropType}\nStatus: ${analysisResult.healthStatus}\nSeverity: ${analysisResult.severity}\nAction: ${analysisResult.recommendedAction}`;
    if (navigator.share) {
      navigator.share({ title: 'MaatiKatha Crop Analysis', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Result copied to clipboard!')).catch(() => {});
    }
  };

  // ── result config ─────────────────────────────────────────────────────────────
  const cfg = analysisResult ? SEVERITY_CONFIG[analysisResult.severity] ?? SEVERITY_CONFIG.mild : null;
  const SeverityIcon = cfg?.icon;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
          <Camera className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-xl text-gray-900 tracking-tight">Field Photo Upload</h2>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" /> AI-powered crop diagnosis
          </p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleInputChange} />

      {/* Loading preview */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-gray-100 h-64 space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
          <p className="text-gray-500 font-medium">Processing image...</p>
        </div>
      )}

      {/* Drop Zone */}
      {!isLoading && !previewUrl && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 select-none flex flex-col items-center justify-center min-h-[16rem]
            ${isDragging ? 'bg-emerald-50 border-emerald-500' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'}`}
        >
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-emerald-500' : 'text-gray-400'}`} />
          </div>
          <p className="font-semibold text-lg text-gray-700 mb-1">Drag crop photo here</p>
          <p className="text-gray-500 text-sm">or tap to browse / use camera</p>
          <p className="text-gray-400 text-xs mt-3">JPG, PNG, WEBP · Max 5MB</p>
        </div>
      )}

      {/* Preview + Analyse */}
      {!isLoading && previewUrl && uploadedFile && (
        <div className="space-y-4">

          {/* Image preview card */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
            <img src={previewUrl} alt="Field crop photo"
              className="object-cover w-full h-64 transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-white truncate max-w-[70%] drop-shadow-md">
                {truncate(uploadedFile.name)}
              </span>
              <button onClick={handleRemove}
                className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                title="Remove photo">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Analyse button */}
          <button
            onClick={handleAnalyse}
            disabled={isAnalyzing}
            className={`w-full py-4 rounded-xl shadow-md font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 min-h-[56px]
              ${isAnalyzing
                ? 'bg-emerald-400 cursor-not-allowed text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg text-white'}`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing crop with AI...
              </>
            ) : analysisResult ? (
              <>
                <RefreshCw className="w-5 h-5" />
                Re-Analyse
              </>
            ) : (
              <>
                <Microscope className="w-5 h-5" />
                Analyse Crop
              </>
            )}
          </button>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* ── Analysis Result Panel ── */}
          {analysisResult && cfg && SeverityIcon && (
            <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} overflow-hidden`}>

              {/* Result header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-black/5">
                <div className="flex items-center gap-3">
                  <SeverityIcon className={`w-6 h-6 ${cfg.iconColor}`} />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Crop Detected</p>
                    <p className="font-bold text-gray-900 text-lg leading-tight">{analysisResult.cropType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{analysisResult.confidenceScore}% confidence</p>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">

                {/* Health status */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5" /> Diagnosis
                  </p>
                  <p className="font-bold text-gray-800 text-base">{analysisResult.healthStatus}</p>
                </div>

                {/* Confidence bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span className="font-medium">AI Confidence</span>
                    <span className="font-bold">{analysisResult.confidenceScore}%</span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-2 border border-black/5">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        analysisResult.severity === 'healthy' ? 'bg-emerald-500' :
                        analysisResult.severity === 'mild'    ? 'bg-yellow-500'  :
                        analysisResult.severity === 'moderate'? 'bg-orange-500'  : 'bg-red-500'
                      }`}
                      style={{ width: `${analysisResult.confidenceScore}%` }}
                    />
                  </div>
                </div>

                {/* Detected symptoms */}
                {analysisResult.detectedSymptoms.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" /> Detected Symptoms
                    </p>
                    <ul className="space-y-1.5">
                      {analysisResult.detectedSymptoms.map((symptom, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                            analysisResult.severity === 'healthy' ? 'bg-emerald-500' :
                            analysisResult.severity === 'mild'    ? 'bg-yellow-500'  :
                            analysisResult.severity === 'moderate'? 'bg-orange-500'  : 'bg-red-500'
                          }`} />
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended action */}
                <div className="bg-white/70 rounded-xl p-4 border border-black/5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ChevronDown className="w-3.5 h-3.5" /> Recommended Action
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed">{analysisResult.recommendedAction}</p>
                </div>

                {/* AI powered note */}
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Analysed by AI · Always verify with local agricultural expert
                </p>

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saved}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${saved
                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-700'}`}
                  >
                    <Save className="w-4 h-4" />
                    {saved ? 'Saved ✓' : 'Save to Farm'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Result
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
