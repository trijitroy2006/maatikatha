'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, AlertTriangle, CheckCircle2, Loader2, Radio } from 'lucide-react';

type Phase = 'idle' | 'recording' | 'analyzing' | 'result';

interface PestResult {
  pest_detected: boolean;
  confidence: number;
  frequency_peak_hz?: number;
  pest_type?: string;
  action?: string;
  method: string;
}

const WAVEFORM_HEIGHTS = ['h-2', 'h-4', 'h-8', 'h-12', 'h-16', 'h-12', 'h-8', 'h-4'];
const WAVEFORM_DELAYS = [
  'delay-0',
  'delay-75',
  'delay-150',
  'delay-300',
  'delay-500',
  'delay-300',
  'delay-150',
  'delay-75',
];

export default function ShorraKhokUI() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState<number>(10);
  const [result, setResult] = useState<PestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const analyseAudio = useCallback(async (blob: Blob) => {
    setPhase('analyzing');
    setError(null);

    try {
      const token = localStorage.getItem('mk_access_token');
      const formData = new FormData();
      formData.append('audio_file', blob, 'recording.webm');

      const response = await fetch('http://localhost:3001/api/shorrakhok/scan', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: PestResult = await response.json();
      setResult(data);
      setPhase('result');
    } catch (err: any) {
      setError(err?.message || 'Analysis failed. Please try again.');
      setPhase('idle');
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setResult(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        analyseAudio(blob);
      };

      mediaRecorder.start();
      setPhase('recording');
      setCountdown(10);

      let remaining = 10;
      intervalRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          mediaRecorder.stop();
        }
      }, 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permission and try again.');
    }
  }, [analyseAudio]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setPhase('idle');
    setCountdown(10);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 space-y-4 text-white">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Radio className="w-6 h-6 text-rose-400" />
        <div>
          <h2 className="text-rose-400 font-bold text-2xl leading-tight">
            🦟 ShorraKhok
          </h2>
          <p className="text-gray-400 text-sm">Acoustic Pest Radar</p>
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
      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <button
            onClick={startRecording}
            className="w-32 h-32 rounded-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 flex items-center justify-center transition-colors shadow-lg"
            aria-label="Start acoustic scan"
          >
            <Mic className="w-12 h-12 text-white" />
          </button>
          <p className="text-gray-300 font-medium text-center">
            Start 10-Second Acoustic Scan
          </p>
        </div>
      )}

      {/* ── RECORDING ── */}
      {phase === 'recording' && (
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Waveform */}
          <div className="flex items-end gap-1.5 h-20">
            {WAVEFORM_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className={`w-3 rounded-full bg-rose-500 animate-pulse ${h} ${WAVEFORM_DELAYS[i]}`}
              />
            ))}
          </div>

          {/* Countdown */}
          <div className="text-7xl font-black text-white tabular-nums">
            {countdown}
            <span className="text-4xl">s</span>
          </div>

          <p className="text-gray-400 text-sm">Recording ambient sound...</p>

          {/* Pulsing live indicator */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse block" />
            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>
      )}

      {/* ── ANALYZING ── */}
      {phase === 'analyzing' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="w-12 h-12 text-rose-400 animate-spin" />
          <p className="text-gray-300 font-medium text-center">
            Running FFT Analysis on 100-300Hz band...
          </p>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === 'result' && result && (
        <div className="space-y-4">
          {result.pest_detected ? (
            <div className="bg-red-900/50 border border-red-500 rounded-2xl p-6 text-center space-y-3">
              <p className="text-red-400 text-2xl font-black">⚠️ PEST DETECTED</p>
              {result.pest_type && (
                <p className="text-white font-semibold">{result.pest_type}</p>
              )}
              <p className="text-gray-300 text-sm">
                Confidence:{' '}
                <span className="text-white font-bold">
                  {Math.round(result.confidence * 100)}%
                </span>
              </p>
              {result.frequency_peak_hz != null && (
                <p className="text-gray-400 text-sm">
                  Peak Frequency:{' '}
                  <span className="text-rose-300 font-semibold">
                    {result.frequency_peak_hz} Hz
                  </span>
                </p>
              )}
              {result.action && (
                <div className="bg-amber-900/40 border border-amber-600 rounded-xl p-3 text-left">
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                    Recommended Action
                  </p>
                  <p className="text-amber-200 text-sm">{result.action}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-900/50 border border-emerald-500 rounded-2xl p-6 text-center space-y-3">
              <p className="text-emerald-400 text-2xl font-black">✅ No Pests Detected</p>
              <p className="text-gray-300 text-sm">
                Confidence:{' '}
                <span className="text-white font-bold">
                  {Math.round(result.confidence * 100)}%
                </span>
              </p>
              <p className="text-emerald-300 text-sm">Field acoustics are normal</p>
            </div>
          )}

          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Mic className="w-4 h-4" />
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
}
