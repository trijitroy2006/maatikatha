'use client';

import React, { useState, useRef, useCallback } from 'react';
import { extractSoilColor, SoilAnalysis } from '@/lib/soilSpectroscopy';
import {
  Beaker,
  Leaf,
  AlertTriangle,
  UploadCloud,
  Loader2,
  Droplets,
} from 'lucide-react';

type Phase = 'idle' | 'processing' | 'result';

export default function SoilSpectroscopyUI() {
  const [phase, setPhase]           = useState<Phase>('idle');
  const [file, setFile]             = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis]     = useState<SoilAnalysis | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setPhase('processing');
    setError(null);

    extractSoilColor(f)
      .then((result) => {
        setAnalysis(result);
        setPhase('result');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
        setPhase('idle');
      });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped && dropped.type.startsWith('image/')) handleFile(dropped);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile],
  );

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPhase('idle');
    setFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setError(null);
    setIsDragging(false);
    if (inputRef.current) inputRef.current.value = '';
  }, [previewUrl]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-amber-100 rounded-xl">
          <Beaker className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Soil Spectroscopy</h2>
          <p className="text-sm text-gray-500">50×50 canvas color grid analysis</p>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── IDLE: Drop Zone ── */}
      {phase === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center
            cursor-pointer transition-colors gap-3
            ${isDragging
              ? 'border-amber-400 bg-amber-50'
              : 'border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50/40'}
          `}
        >
          <span className="text-4xl">🌱</span>
          <UploadCloud className="h-8 w-8 text-amber-400" />
          <p className="font-semibold text-gray-700 text-center">
            Upload Soil Photo for Analysis
          </p>
          <p className="text-xs text-gray-400">JPG, PNG · Max 5MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* ── PROCESSING ── */}
      {phase === 'processing' && (
        <div className="bg-amber-50 rounded-2xl h-48 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          <p className="text-sm font-medium text-amber-700">
            Sampling 50×50 pixel color grid...
          </p>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === 'result' && analysis && (
        <div className="space-y-5">
          {/* Top row: image preview + color swatch */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Image preview */}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Soil sample"
                className="h-32 w-full sm:w-auto sm:aspect-square object-cover rounded-xl border border-gray-100 shadow-sm"
              />
            )}

            {/* Color swatch + dominant hex */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-16 w-16 rounded-xl border border-gray-200 shadow-inner"
                style={{ backgroundColor: analysis.dominant_hex }}
              />
              <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                {analysis.dominant_hex.toUpperCase()}
              </code>
            </div>

            {/* Soil type */}
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Soil Type</p>
              <p className="font-bold text-gray-800 text-sm leading-snug">{analysis.soil_type}</p>
            </div>
          </div>

          {/* Organic Carbon */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-gray-600 font-medium">Organic Carbon</span>
              </div>
              <span className="text-2xl font-bold text-amber-600">
                {analysis.organic_carbon_pct}
                <span className="text-sm font-normal text-gray-500 ml-0.5">%</span>
              </span>
            </div>
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${((analysis.organic_carbon_pct / 4.5) * 100).toFixed(0)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-right">Max scale: 4.5%</p>
          </div>

          {/* Fertility Score */}
          <div className="flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Fertility Score</p>
              <p className="text-3xl font-extrabold text-amber-600">
                {analysis.fertility_score}
                <span className="text-base font-normal text-gray-400 ml-0.5">/100</span>
              </p>
            </div>
          </div>

          {/* Interpretation */}
          <p className="text-sm text-gray-600 leading-relaxed">{analysis.interpretation}</p>

          {/* Recommendations */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Recommendations</p>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Leaf className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* KVK Warning Note */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              For lab-grade accuracy, send soil to nearest{' '}
              <span className="font-semibold">KVK (Krishi Vigyan Kendra)</span>. This
              spectroscopy estimate is based on color analysis only.
            </p>
          </div>

          {/* Reset Button */}
          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700
                       text-white font-semibold text-sm transition-colors"
          >
            Analyse Another Sample
          </button>
        </div>
      )}
    </div>
  );
}
