# মাটিকথা (MaatiKatha) 🌾

> কৃষকের কণ্ঠস্বর, মাটির কথা  
> _The farmer's voice, the soil's story_

A zero-hardware, voice-first generational farm simulation and climate resilience platform for rural farmers in West Bengal, India.

---

## 🌟 Features

| Feature | Description |
|---|---|
| **🕰️ Time Machine Slider** | Adjust historical baseline data (1975–2026) — rainfall, organic carbon, temperature anomalies |
| **🌱 What-If Simulator** | Simulate farm actions over 90 days and forecast yield impact |
| **☁️ RituRakhok Card** | Compare 40-year climate baseline vs 14-day live forecast with 3-step action guide |
| **🎤 AI Field Doctor** | Bengali/Hindi voice interface powered by Web Speech API + Gemini backend |
| **🗺️ KhamarDrishti Map** | Real-time pest radar with wind vector overlays, plot markers, disease spread circles |
| **🌍 i18n** | Full Bengali (bn) + English (en) dictionary with live language toggle |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 (high-contrast earth palette)
- **Mapping**: Leaflet.js (dynamic import, SSR-safe)
- **Voice**: Web Speech API — SpeechRecognition (`bn-IN`, `hi-IN`) + SpeechSynthesis
- **Fonts**: Noto Sans Bengali (Google Fonts)
- **Deployment**: Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

---

## 🔌 API Integration

Configure the backend URL in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://your-backend-host:3001
```

### Endpoints (Udit's Express Backend)

| Method | Path | Payload |
|---|---|---|
| `POST` | `/api/simulator` | `{ year, day, actions[] }` |
| `GET` | `/api/climate` | `?lat=&lon=` |
| `POST` | `/api/doctor` | `{ textQuery?, audioBlob?, lang }` |
| `GET` | `/api/mandi` | `?crop=&harvestDate=` |

> All endpoints gracefully fall back to rich demo data when the backend is unreachable — designed for low-connectivity rural environments.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + i18n provider + fonts
│   ├── page.tsx            # Dashboard with tab navigation
│   └── globals.css         # Tailwind v4 theme + custom styles
├── components/
│   ├── Navigation/
│   │   └── BottomNav.tsx   # 5-tab mobile navigation
│   ├── Simulator/
│   │   └── SimulatorPanel.tsx  # Time Machine + What-If sliders
│   ├── RituRakhok/
│   │   └── RituRakhokCard.tsx  # Climate adaptation card
│   ├── VoiceDoctor/
│   │   ├── VoiceDoctorUI.tsx   # Tap-to-talk UI + TTS playback
│   │   └── WaveformAnimation.tsx # Real-time audio waveform
│   ├── KhamarDrishti/
│   │   └── KhamarDrishtiMap.tsx # Leaflet pest radar map
│   └── ui/
│       └── Slider.tsx          # High-contrast range slider
├── contexts/
│   └── i18nContext.tsx     # Bengali + English i18n dictionary
├── hooks/
│   ├── useSpeechRecognition.ts # Web Speech API + AudioAnalyser
│   ├── useSpeechSynthesis.ts   # TTS hook
│   └── useSimulator.ts         # API + fallback hook
├── lib/
│   ├── api.ts              # Typed fetch API client
│   ├── types.ts            # All TypeScript interfaces
│   └── utils.ts            # cn() utility
└── types/
    └── speech.d.ts         # Web Speech API type declarations
```

---

## 🎨 Design Principles

- **High-Contrast**: Dark stone palette with amber/emerald/sky accent colors visible in direct sunlight
- **Touch-First**: All interactive elements ≥ 44×44px (WCAG 2.5.5)
- **Offline-Resilient**: All components show useful demo data when API is unreachable
- **Voice-First**: One-tap voice input with visual waveform feedback
- **Bengali Script**: Noto Sans Bengali for crisp Unicode text rendering

---

## 🌐 Deployment (Vercel)

1. Connect your GitHub repo to Vercel
2. Set environment variable: `NEXT_PUBLIC_API_BASE_URL` → your backend URL
3. Deploy — zero additional configuration needed

---

## 📄 License

MIT — Built with ❤️ for West Bengal's farming communities
