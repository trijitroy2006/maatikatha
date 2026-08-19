'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, StopCircle, Volume2, AlertTriangle, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useI18n } from '@/contexts/i18nContext';
import { queryDoctor } from '@/lib/api';
import { cn } from '@/lib/utils';
import { WaveformAnimation } from './WaveformAnimation';
import type { SupportedLang, DoctorResponse, SpeechLangCode } from '@/lib/types';

const LANG_CONFIG: Record<SupportedLang, { label: string; code: SpeechLangCode; flag: string }> = {
  bn: { label: 'Bengali', code: 'bn-IN', flag: '🇧🇩' },
  hi: { label: 'Hindi',   code: 'hi-IN', flag: '🇮🇳' },
};

const SEVERITY_STYLES = {
  info:    'border-sky-500    bg-sky-900/40    text-sky-200',
  caution: 'border-amber-500  bg-amber-900/40  text-amber-200',
  urgent:  'border-red-500    bg-red-900/40    text-red-200 animate-pulse',
};

export function VoiceDoctorUI() {
  const { t } = useI18n();
  const [lang, setLang]               = useState<SupportedLang>('bn');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse]       = useState<DoctorResponse | null>(null);
  const [textInput, setTextInput]     = useState('');
  const [error, setError]             = useState<string | null>(null);

  const { transcript, interimTranscript, state, isSupported, startListening, stopListening, resetTranscript, audioLevel } =
    useSpeechRecognition(LANG_CONFIG[lang].code);
  const { speak, isSpeaking, stop: stopSpeaking } = useSpeechSynthesis();

  const isListening = state === 'listening';

  useEffect(() => {
    if (state === 'idle' && transcript && !isProcessing) handleSend(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleSend = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsProcessing(true); setError(null);
    try {
      const result = await queryDoctor({ textQuery: query, lang });
      setResponse(result);
      speak(result.answer_text, LANG_CONFIG[lang].code);
    } catch {
      const demo: DoctorResponse = {
        answer_text: 'The burnt spots on your rice leaves are symptoms of Blast disease. Mix Tricyclazole 0.6 g/litre in water and spray on the affected areas.',
        diagnosis: 'Rice Blast (Magnaporthe oryzae)',
        severity: 'caution',
        recommended_actions: [
          'Spray Tricyclazole 0.6 g/L',
          'Drain excess water from the field',
          'Re-inspect after 7 days',
        ],
      };
      setResponse(demo);
      speak(demo.answer_text, LANG_CONFIG[lang].code);
      setError('Demo mode — backend not connected');
    } finally {
      setIsProcessing(false); resetTranscript(); setTextInput('');
    }
  }, [lang, speak, resetTranscript]);

  const handleMicToggle = () => {
    if (isListening) { stopListening(); }
    else { resetTranscript(); startListening(); }
  };

  return (
    <section className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-600 rounded-2xl">
          <Mic className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-emerald-400">{t.doctor_title}</h2>
      </div>

      {/* Voice Language Switcher */}
      <div className="flex gap-3">
        {(Object.keys(LANG_CONFIG) as SupportedLang[]).map((l) => (
          <button key={l} onClick={() => { setLang(l); stopListening(); resetTranscript(); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-xl border-2 transition-all active:scale-95',
              lang === l
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-stone-800 border-stone-600 text-stone-300 hover:border-emerald-500'
            )}>
            <span className="text-2xl">{LANG_CONFIG[l].flag}</span>
            {LANG_CONFIG[l].label}
          </button>
        ))}
      </div>

      {/* Mic Button + Waveform */}
      <div className="bg-stone-800/80 border border-stone-600 rounded-3xl p-7 flex flex-col items-center gap-5">
        <WaveformAnimation audioLevel={audioLevel} isListening={isListening} />

        {/* Transcript */}
        <div className="w-full min-h-[60px] bg-stone-700/60 rounded-2xl px-5 py-4 text-center">
          <p className={cn('text-xl leading-relaxed', isListening ? 'text-emerald-300' : 'text-stone-200')}>
            {interimTranscript || transcript || (
              <span className="text-stone-500">{t.doctor_tap_speak}</span>
            )}
          </p>
        </div>

        {/* Big Mic Button */}
        <button
          onClick={handleMicToggle}
          disabled={!isSupported || isProcessing}
          className={cn(
            'w-32 h-32 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl',
            isListening
              ? 'bg-red-500 hover:bg-red-400 animate-pulse shadow-red-500/40'
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40',
            (!isSupported || isProcessing) && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isProcessing  ? <Loader2    className="w-14 h-14 text-white animate-spin" /> :
           isListening   ? <StopCircle className="w-14 h-14 text-white" /> :
                           <Mic        className="w-14 h-14 text-white" />}
        </button>

        <p className="text-xl text-stone-400 font-semibold">
          {isProcessing ? t.doctor_processing : isListening ? t.doctor_listening : t.doctor_tap_speak}
        </p>

        {!isSupported && (
          <div className="flex items-center gap-2 text-base text-amber-400">
            <MicOff className="w-5 h-5" />
            <span>Voice not supported in this browser</span>
          </div>
        )}
      </div>

      {/* Text Fallback */}
      <div className="flex gap-3">
        <input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(textInput)}
          placeholder="Describe your crop problem..."
          className="flex-1 bg-stone-800 border border-stone-600 rounded-2xl px-5 py-4 text-xl text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          onClick={() => handleSend(textInput)}
          disabled={!textInput.trim() || isProcessing}
          className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xl rounded-2xl disabled:opacity-50 transition-all"
        >
          {t.submit}
        </button>
      </div>

      {/* Response Card */}
      {response && (
        <div className={cn('border-2 rounded-2xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500', SEVERITY_STYLES[response.severity])}>
          {response.diagnosis && (
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <span className="font-bold text-xl uppercase tracking-wide">{response.diagnosis}</span>
            </div>
          )}

          <p className="text-xl leading-relaxed">{response.answer_text}</p>

          {response.recommended_actions.length > 0 && (
            <div className="space-y-3">
              <p className="text-base font-bold uppercase tracking-wider opacity-70">Recommended Actions</p>
              <ul className="space-y-2">
                {response.recommended_actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xl">
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-base font-bold shrink-0 mt-0.5">{idx + 1}</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => isSpeaking ? stopSpeaking() : speak(response.answer_text, LANG_CONFIG[lang].code)}
            className="flex items-center gap-2 text-lg font-semibold opacity-80 hover:opacity-100 transition-opacity"
          >
            <Volume2 className={cn('w-6 h-6', isSpeaking && 'animate-bounce')} />
            {isSpeaking ? 'Stop' : 'Play Again'}
          </button>
        </div>
      )}

      {error && <p className="text-base text-amber-400 text-center">⚠️ {error}</p>}
    </section>
  );
}
