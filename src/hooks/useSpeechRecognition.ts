'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SpeechLangCode } from '@/lib/types';

export type SpeechState = 'idle' | 'listening' | 'error';

interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  state: SpeechState;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  audioLevel: number;
}

export function useSpeechRecognition(
  lang: SpeechLangCode = 'bn-IN'
): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [state, setState] = useState<SpeechState>('idle');
  const [isSupported, setIsSupported] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const setupAudioAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const tick = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(100, (avg / 128) * 100));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Microphone permission denied — waveform won't animate
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setAudioLevel(0);
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState('listening');
      setupAudioAnalyser();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) setTranscript((prev) => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      setState('idle');
      setInterimTranscript('');
      cleanupAudio();
    };

    recognition.onerror = () => {
      setState('error');
      cleanupAudio();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, setupAudioAnalyser, cleanupAudio]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    cleanupAudio();
    setState('idle');
  }, [cleanupAudio]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    transcript,
    interimTranscript,
    state,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    audioLevel,
  };
}
