'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Camera,
  Microscope,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Leaf,
} from 'lucide-react';

type Mode = 'idle' | 'capturing' | 'preview' | 'analyzing' | 'result';

interface DiagnosisResult {
  disease_name: string;
  confidence_pct: number;
  severity: string;
  symptoms_observed: string[];
  bengali_remedy: string;
  recommended_fungicide: string;
  immediate_action: string;
  powered_by: string;
}

export default function ChitroDrishtiUI() {
  const [mode, setMode] = useState<Mode>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode('capturing');
    } catch (err) {
      setError('Camera access denied. Please allow camera permission and try again.');
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 640, 480);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

    // Stop all tracks
    const stream = video.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    video.srcObject = null;

    setCapturedImage(dataUrl);
    setMode('preview');
  }, []);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    startCamera();
  }, [startCamera]);

  const analyseDisease = useCallback(async () => {
    if (!capturedImage) return;
    setMode('analyzing');
    setError(null);

    try {
      const token = localStorage.getItem('mk_access_token');
      const response = await fetch('http://localhost:3001/api/chitrodrishti/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          image_base64: capturedImage,
          location_weather_context: 'West Bengal, India. Season: Kharif. Hot and humid.',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: DiagnosisResult = await response.json();
      setResult(data);
      setMode('result');
    } catch (err: any) {
      setError(err?.message || 'Analysis failed. Please try again.');
      setMode('preview');
    }
  }, [capturedImage]);

  const getSeverityBadgeClass = (severity: string) => {
    const s = severity?.toLowerCase();
    if (s === 'severe' || s === 'critical') return 'bg-red-600';
    if (s === 'moderate') return 'bg-amber-500';
    return 'bg-emerald-600';
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 space-y-4 text-white">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Camera className="w-6 h-6 text-emerald-400" />
        <div>
          <h2 className="text-emerald-400 font-bold text-2xl leading-tight">ChitroDrishti</h2>
          <p className="text-gray-400 text-sm">Visual Crop Disease Triage</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-900/50 border border-red-500 rounded-xl px-4 py-3 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── IDLE ── */}
      {mode === 'idle' && (
        <button
          onClick={startCamera}
          className="w-full py-16 flex flex-col items-center justify-center gap-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-2xl transition-colors"
        >
          <Camera className="w-16 h-16 text-white" />
          <span className="text-white font-semibold text-lg">Tap to Open Camera</span>
        </button>
      )}

      {/* ── CAPTURING ── */}
      {mode === 'capturing' && (
        <div className="space-y-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-xl object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 border-4 border-gray-300 transition-colors shadow-lg"
              aria-label="Capture photo"
            />
          </div>
        </div>
      )}

      {/* Hidden canvas for idle/result states */}
      {mode !== 'capturing' && <canvas ref={canvasRef} className="hidden" />}

      {/* ── PREVIEW ── */}
      {mode === 'preview' && capturedImage && (
        <div className="space-y-4">
          <img
            src={capturedImage}
            alt="Captured crop"
            className="w-full rounded-xl object-cover"
          />
          <div className="flex gap-3">
            <button
              onClick={retake}
              className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={analyseDisease}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Microscope className="w-4 h-4" />
              Analyse Disease
            </button>
          </div>
        </div>
      )}

      {/* ── ANALYZING ── */}
      {mode === 'analyzing' && capturedImage && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={capturedImage}
              alt="Analysing crop"
              className="w-full rounded-xl object-cover opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
              <span className="text-white font-semibold text-lg drop-shadow">Analysing with AI...</span>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {mode === 'result' && result && capturedImage && (
        <div className="space-y-4">
          {/* Image + title */}
          <div className="overflow-hidden">
            <img
              src={capturedImage}
              alt="Analysed crop"
              className="h-32 object-cover rounded-xl float-left mr-4 mb-2"
            />
            <div>
              <h3 className="font-bold text-xl text-white leading-snug">{result.disease_name}</h3>
              <span
                className={`inline-block mt-1 px-3 py-0.5 rounded-full text-white text-xs font-semibold capitalize ${getSeverityBadgeClass(result.severity)}`}
              >
                {result.severity}
              </span>
            </div>
            <div className="clear-both" />
          </div>

          {/* Confidence bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Confidence</span>
              <span>{result.confidence_pct}%</span>
            </div>
            <div className="bg-gray-700 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${result.confidence_pct}%` }}
              />
            </div>
          </div>

          {/* Symptoms */}
          {result.symptoms_observed?.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Symptoms Observed
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {result.symptoms_observed.map((s, i) => (
                  <li key={i} className="text-gray-300 text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bengali remedy */}
          {result.bengali_remedy && (
            <div className="bg-amber-900/40 border border-amber-600 rounded-xl p-4">
              <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                বাংলা প্রতিকার
              </p>
              <p className="text-amber-200 font-medium text-sm leading-relaxed">
                {result.bengali_remedy}
              </p>
            </div>
          )}

          {/* Recommended fungicide */}
          {result.recommended_fungicide && (
            <div className="bg-emerald-900/40 border border-emerald-600 rounded-xl p-3">
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Recommended Fungicide
              </p>
              <p className="text-emerald-300 text-sm">{result.recommended_fungicide}</p>
            </div>
          )}

          {/* Immediate action */}
          {result.immediate_action && (
            <div className="bg-blue-900/40 border border-blue-600 rounded-xl p-3">
              <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Immediate Action
              </p>
              <p className="text-blue-300 text-sm">{result.immediate_action}</p>
            </div>
          )}

          {/* Footer: powered_by + Re-analyse */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-500">
              Powered by{' '}
              <span className="text-gray-400 font-medium">{result.powered_by}</span>
            </span>
            <button
              onClick={() => {
                setResult(null);
                setCapturedImage(null);
                setMode('idle');
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
            >
              <Leaf className="w-4 h-4" />
              Re-analyse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
