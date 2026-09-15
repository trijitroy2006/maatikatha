'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Mic, MicOff, StopCircle, Volume2,
  AlertTriangle, Loader2, Send, Languages, Sparkles,
} from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useI18n } from '@/contexts/i18nContext';
import { queryDoctor } from '@/lib/api';
import { cn } from '@/lib/utils';
import { WaveformAnimation } from './WaveformAnimation';
import type { DoctorResponse } from '@/lib/types';

// ── Supported Languages ───────────────────────────────────────────────────────
type Lang = 'en' | 'hi' | 'bn';

const LANG_CONFIG: Record<Lang, { label: string; nativeLabel: string; code: string; flag: string; placeholder: string }> = {
  en: { label: 'English',  nativeLabel: 'English', code: 'en-IN', flag: '🇬🇧', placeholder: 'Describe your crop problem in English…' },
  hi: { label: 'Hindi',    nativeLabel: 'हिंदी',   code: 'hi-IN', flag: '🇮🇳', placeholder: 'अपनी फसल की समस्या हिंदी में बताएं…'  },
  bn: { label: 'Bengali',  nativeLabel: 'বাংলা',   code: 'bn-IN', flag: '🇧🇩', placeholder: 'আপনার ফসলের সমস্যা বাংলায় বর্ণনা করুন…' },
};

const SEVERITY_STYLES: Record<string, string> = {
  info:    'border-blue-400  bg-blue-950/40  text-blue-100',
  caution: 'border-amber-400 bg-amber-950/40 text-amber-100',
  urgent:  'border-red-400   bg-red-950/40   text-red-100',
};

const SEVERITY_LABEL: Record<Lang, Record<string, string>> = {
  en: { info: 'Information', caution: '⚠️ Caution', urgent: '🚨 Urgent' },
  hi: { info: 'जानकारी',    caution: '⚠️ सावधानी',  urgent: '🚨 तत्काल'  },
  bn: { info: 'তথ্য',       caution: '⚠️ সতর্কতা',  urgent: '🚨 জরুরি'   },
};

const ACTIONS_HEADER: Record<Lang, string> = {
  en: 'Recommended Actions',
  hi: 'अनुशंसित कार्यवाही',
  bn: 'প্রস্তাবিত পদক্ষেপ',
};

const PLAY_AGAIN: Record<Lang, string> = {
  en: 'Play Again', hi: 'फिर सुनें', bn: 'আবার শুনুন',
};
const STOP_AUDIO: Record<Lang, string> = {
  en: 'Stop', hi: 'बंद करें', bn: 'থামুন',
};
const SEND_BTN: Record<Lang, string> = {
  en: 'Ask', hi: 'पूछें', bn: 'জিজ্ঞেস করুন',
};
const PROCESSING: Record<Lang, string> = {
  en: 'Analysing…', hi: 'विश्लेषण हो रहा है…', bn: 'বিশ্লেষণ হচ্ছে…',
};
const TAP_SPEAK: Record<Lang, string> = {
  en: 'Tap the mic and speak', hi: 'माइक दबाएं और बोलें', bn: 'মাইকে ট্যাপ করুন এবং বলুন',
};
const LISTENING: Record<Lang, string> = {
  en: 'Listening…', hi: 'सुन रहा हूँ…', bn: 'শুনছি…',
};

// ── Chat message types ────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  role: 'user' | 'bot' | 'mismatch';
  text: string;
  response?: DoctorResponse & { lang_mismatch?: boolean; powered_by?: 'gemini' | 'rules' };
}

export function VoiceDoctorUI() {
  const { t } = useI18n();
  const [lang, setLang] = useState<Lang>('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { transcript, interimTranscript, state, isSupported, startListening, stopListening, resetTranscript, audioLevel } =
    useSpeechRecognition(LANG_CONFIG[lang].code as any);
  const { speak, isSpeaking, stop: stopSpeaking } = useSpeechSynthesis();

  const isListening = state === 'listening';

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-send when voice recognition ends
  useEffect(() => {
    if (state === 'idle' && transcript && !isProcessing) handleSend(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleSend = useCallback(async (query: string) => {
    if (!query.trim()) return;
    const userMsg: ChatMessage = { id: Date.now(), role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    resetTranscript();
    setTextInput('');

    try {
      const result = await queryDoctor({ textQuery: query, lang });

      // Language mismatch — show warning bubble
      if ((result as any).lang_mismatch) {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'mismatch', text: result.answer_text }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: result.answer_text, response: result as any }]);
        speak(result.answer_text, LANG_CONFIG[lang].code as any);
      }
    } catch {
      // Offline fallback
      const fallbacks: Record<Lang, string> = {
        en: 'Backend not connected. Please describe symptoms like brown spots, yellow leaves or wilting.',
        hi: 'बैकएंड कनेक्ट नहीं है। कृपया भूरे धब्बे, पीली पत्तियां या मुरझाने जैसे लक्षण बताएं।',
        bn: 'ব্যাকএন্ড সংযুক্ত নেই। অনুগ্রহ করে বাদামি দাগ, হলুদ পাতা বা ঢলে পড়ার মতো লক্ষণ বর্ণনা করুন।',
      };
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: fallbacks[lang], response: { answer_text: fallbacks[lang], severity: 'info', recommended_actions: [] } }]);
    } finally {
      setIsProcessing(false);
    }
  }, [lang, speak, resetTranscript]);

  const handleMicToggle = () => {
    if (isListening) stopListening();
    else { resetTranscript(); startListening(); }
  };

  const handleLangChange = (l: Lang) => {
    setLang(l);
    stopListening();
    resetTranscript();
    stopSpeaking();
  };

  return (
    <section className="w-full flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-600 rounded-2xl">
          <Mic className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-emerald-400">AI Field Doctor</h2>
          <p className="text-stone-400 font-medium text-sm mt-0.5">Ask about any crop disease — in your language</p>
        </div>
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-900/60 to-purple-900/60 border border-blue-500/40 rounded-xl px-3 py-1.5">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-blue-300">Gemini AI</span>
        </div>
      </div>

      {/* Language Selector */}
      <div className="flex gap-2">
        {(Object.keys(LANG_CONFIG) as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => handleLangChange(l)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-3 rounded-2xl font-bold text-base border-2 transition-all active:scale-95 gap-1',
              lang === l
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-stone-800 border-stone-600 text-stone-300 hover:border-emerald-500 hover:text-white'
            )}
          >
            <span className="text-2xl">{LANG_CONFIG[l].flag}</span>
            <span className="text-sm">{LANG_CONFIG[l].nativeLabel}</span>
          </button>
        ))}
      </div>

      {/* Language notice */}
      <div className="flex items-center gap-2 bg-stone-800/60 border border-stone-600 rounded-xl px-4 py-2.5">
        <Languages className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-stone-300 text-sm font-medium">
          {lang === 'en' && 'Please type or speak your question in English'}
          {lang === 'hi' && 'कृपया हिंदी में प्रश्न लिखें या बोलें'}
          {lang === 'bn' && 'অনুগ্রহ করে বাংলায় প্রশ্ন লিখুন বা বলুন'}
        </p>
      </div>

      {/* Chat Window */}
      <div className="bg-stone-900/80 border border-stone-700 rounded-3xl p-4 flex flex-col gap-4 min-h-[260px] max-h-[480px] overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 text-stone-500">
            <Mic className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium text-center opacity-60">
              {lang === 'en' && 'Ask about crop diseases, pests, or farming issues'}
              {lang === 'hi' && 'फसल रोग, कीट या खेती की समस्याओं के बारे में पूछें'}
              {lang === 'bn' && 'ফসলের রোগ, কীটপতঙ্গ বা চাষের সমস্যা সম্পর্কে জিজ্ঞেস করুন'}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>

            {/* User bubble */}
            {msg.role === 'user' && (
              <div className="max-w-[80%] bg-emerald-700 text-white rounded-2xl rounded-br-sm px-5 py-3 text-lg leading-relaxed">
                {msg.text}
              </div>
            )}

            {/* Mismatch warning bubble */}
            {msg.role === 'mismatch' && (
              <div className="max-w-[85%] bg-amber-900/60 border-2 border-amber-500 rounded-2xl rounded-bl-sm px-5 py-4 flex items-start gap-3">
                <Languages className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-200 text-base leading-relaxed">{msg.text}</p>
              </div>
            )}

            {/* Bot response bubble */}
            {msg.role === 'bot' && msg.response && (
              <div className={cn('max-w-[90%] border-2 rounded-2xl rounded-bl-sm px-5 py-4 space-y-3', SEVERITY_STYLES[msg.response.severity])}>
                {/* Top row: severity + AI badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block text-xs font-bold uppercase tracking-wider opacity-70 border border-current rounded-full px-3 py-0.5">
                    {SEVERITY_LABEL[lang][msg.response.severity]}
                  </span>
                  {msg.response.powered_by === 'gemini' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full px-2.5 py-0.5">
                      <Sparkles className="w-3 h-3" /> Gemini AI
                    </span>
                  )}
                </div>

                {/* Diagnosis */}
                {msg.response.diagnosis && (
                  <div className="flex items-center gap-2 font-bold text-lg">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    {msg.response.diagnosis}
                  </div>
                )}

                {/* Answer */}
                <p className="text-lg leading-relaxed">{msg.response.answer_text}</p>

                {/* Actions */}
                {msg.response.recommended_actions.length > 0 && (
                  <div className="pt-1 space-y-2">
                    <p className="text-sm font-bold uppercase tracking-wider opacity-70">
                      {ACTIONS_HEADER[lang]}
                    </p>
                    <ul className="space-y-1.5">
                      {msg.response.recommended_actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-base">
                          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{idx + 1}</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* TTS replay button */}
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speak(msg.response!.answer_text, LANG_CONFIG[lang].code as any)}
                  className="flex items-center gap-1.5 text-sm font-semibold opacity-70 hover:opacity-100 transition-opacity pt-1"
                >
                  <Volume2 className={cn('w-4 h-4', isSpeaking && 'animate-bounce')} />
                  {isSpeaking ? STOP_AUDIO[lang] : PLAY_AGAIN[lang]}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-stone-800 border border-stone-600 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2 text-stone-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-base font-medium">{PROCESSING[lang]}</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Voice + Text Input Row */}
      <div className="bg-stone-800/80 border border-stone-600 rounded-3xl p-5 flex flex-col gap-4">

        {/* Waveform + Mic */}
        <div className="flex flex-col items-center gap-3">
          <WaveformAnimation audioLevel={audioLevel} isListening={isListening} />

          <button
            onClick={handleMicToggle}
            disabled={!isSupported || isProcessing}
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl',
              isListening
                ? 'bg-red-500 hover:bg-red-400 animate-pulse shadow-red-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40',
              (!isSupported || isProcessing) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isProcessing ? <Loader2 className="w-10 h-10 text-white animate-spin" />
              : isListening ? <StopCircle className="w-10 h-10 text-white" />
              : <Mic className="w-10 h-10 text-white" />}
          </button>

          <p className="text-base text-stone-400 font-semibold">
            {isProcessing ? PROCESSING[lang] : isListening ? LISTENING[lang] : TAP_SPEAK[lang]}
          </p>

          {/* Live transcript preview */}
          {(interimTranscript || transcript) && (
            <div className="w-full bg-stone-700/60 rounded-xl px-4 py-2 text-emerald-300 text-center text-base">
              {interimTranscript || transcript}
            </div>
          )}

          {!isSupported && (
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <MicOff className="w-4 h-4" /> Voice not supported in this browser
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="flex gap-2">
          <input
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(textInput)}
            placeholder={LANG_CONFIG[lang].placeholder}
            disabled={isProcessing}
            className="flex-1 bg-stone-700 border border-stone-500 rounded-2xl px-5 py-3.5 text-lg text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => handleSend(textInput)}
            disabled={!textInput.trim() || isProcessing}
            className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-base rounded-2xl disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            {SEND_BTN[lang]}
          </button>
        </div>
      </div>
    </section>
  );
}
