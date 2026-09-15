// ============================================================
// DOCTOR ENGINE — Powered by Google Gemini AI
// Answers ANY agriculture/crop question in English, Hindi, Bengali
// Falls back to rule-based engine if API key not configured
// ============================================================

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export type SupportedLang = 'en' | 'hi' | 'bn';

export interface DoctorQuery {
  textQuery?: string;
  lang?: SupportedLang | string;
}

export interface DoctorResult {
  answer_text: string;
  diagnosis?: string;
  severity: 'info' | 'caution' | 'urgent';
  recommended_actions: string[];
  lang_mismatch?: boolean;
  powered_by?: 'gemini' | 'rules';
}

// ── Language detection via Unicode script analysis ────────────────────────────
const isBengali  = (t: string) => /[\u0980-\u09FF]/.test(t);
const isHindi    = (t: string) => /[\u0900-\u097F]/.test(t);
const detectLang = (t: string): SupportedLang =>
  isBengali(t) ? 'bn' : isHindi(t) ? 'hi' : 'en';

// ── Mismatch messages ─────────────────────────────────────────────────────────
const LANG_NAMES: Record<SupportedLang, Record<SupportedLang, string>> = {
  en: { en: 'English', hi: 'Hindi',  bn: 'Bengali' },
  hi: { en: 'अंग्रेज़ी', hi: 'हिंदी', bn: 'बंगाली' },
  bn: { en: 'ইংরেজি',   hi: 'হিন্দি', bn: 'বাংলা'  },
};
const SWITCH_MSG: Record<SupportedLang, string> = {
  en: (det: SupportedLang) => `You wrote in ${LANG_NAMES.en[det]} but the language is set to English. Please click the English button above and ask again.`,
  hi: (det: SupportedLang) => `आपने ${LANG_NAMES.hi[det]} में लिखा है लेकिन भाषा हिंदी पर सेट है। कृपया ऊपर हिंदी बटन दबाएं और दोबारा पूछें।`,
  bn: (det: SupportedLang) => `আপনি ${LANG_NAMES.bn[det]} তে লিখেছেন কিন্তু ভাষা বাংলা সেট করা আছে। অনুগ্রহ করে উপরে বাংলা বোতাম চাপুন এবং আবার জিজ্ঞেস করুন।`,
} as any;

function mismatchMsg(selected: SupportedLang, detected: SupportedLang): DoctorResult {
  return {
    answer_text: (SWITCH_MSG[selected] as any)(detected),
    severity: 'info',
    recommended_actions: [],
    lang_mismatch: true,
  };
}

// ── Gemini system prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = (lang: SupportedLang) => {
  const langName = { en: 'English', hi: 'Hindi', bn: 'Bengali' }[lang];
  return `You are "Maatikatha Field Doctor", an expert AI agricultural advisor specializing in crops grown in India and Bangladesh, especially rice, wheat, jute, potato, mustard, maize, and vegetables.

LANGUAGE RULE: You MUST respond ONLY in ${langName}. Do not mix languages.

YOUR ROLE:
- Answer any question related to agriculture, crops, farming, soil, weather, irrigation, fertilizers, pesticides, crop diseases, pests, market prices, seed selection, harvesting techniques, and government schemes for farmers.
- If the question is completely unrelated to agriculture/farming (e.g. politics, sports, movies), politely decline and say you can only help with farming questions.

RESPONSE FORMAT:
You must respond with a valid JSON object ONLY. No markdown, no extra text outside JSON.
The JSON must have exactly this structure:
{
  "answer_text": "Main answer in ${langName} — clear, practical, farmer-friendly. 2-4 sentences.",
  "diagnosis": "Disease/issue name if applicable, else null",
  "severity": "info OR caution OR urgent",
  "recommended_actions": ["Action 1 in ${langName}", "Action 2 in ${langName}", "Action 3 in ${langName}"],
  "off_topic": false
}

SEVERITY RULES:
- "urgent": immediate threat to crop (active disease outbreak, flood, pest infestation)
- "caution": developing problem needing attention (early symptoms, dry spell)
- "info": general advice, questions, or tips

Be concise, practical, and use terminology a village farmer would understand. Avoid complex scientific jargon.`;
};

// ── Gemini AI call ────────────────────────────────────────────────────────────
async function askGemini(query: string, lang: SupportedLang): Promise<DoctorResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
    systemInstruction: SYSTEM_PROMPT(lang),
  });

  const result = await model.generateContent(query);
  const text   = result.response.text().trim();

  // Parse JSON response
  const parsed = JSON.parse(text) as {
    answer_text: string;
    diagnosis: string | null;
    severity: 'info' | 'caution' | 'urgent';
    recommended_actions: string[];
    off_topic: boolean;
  };

  // Off-topic question
  if (parsed.off_topic) {
    const offTopicMsg: Record<SupportedLang, string> = {
      en: "I can only help with agriculture, farming, crops, and related topics. Please ask me about your farm or crops!",
      hi: "मैं केवल कृषि, खेती, फसलों और संबंधित विषयों में मदद कर सकता हूं। कृपया अपनी खेती या फसल के बारे में पूछें!",
      bn: "আমি শুধুমাত্র কৃষি, চাষাবাদ, ফসল এবং সংশ্লিষ্ট বিষয়ে সাহায্য করতে পারি। অনুগ্রহ করে আপনার খামার বা ফসল সম্পর্কে জিজ্ঞেস করুন!",
    };
    return { answer_text: offTopicMsg[lang], severity: 'info', recommended_actions: [], powered_by: 'gemini' };
  }

  return {
    answer_text:         parsed.answer_text,
    diagnosis:           parsed.diagnosis || undefined,
    severity:            parsed.severity || 'info',
    recommended_actions: parsed.recommended_actions || [],
    powered_by:          'gemini',
  };
}

// ── Rule-based fallback ───────────────────────────────────────────────────────
interface RuleEntry {
  keywords_en: string[]; keywords_hi: string[]; keywords_bn: string[];
  diagnosis: string; severity: DoctorResult['severity'];
  answer: Record<SupportedLang, string>;
  actions: Record<SupportedLang, string[]>;
}

const RULES: RuleEntry[] = [
  {
    keywords_en: ['yellow','yellowing','pale','chlorosis'],
    keywords_hi: ['पीला','पीलापन','हल्का'],
    keywords_bn: ['হলুদ','হলদে','ফ্যাকাশে'],
    diagnosis: 'Nitrogen Deficiency / Early Blast', severity: 'caution',
    answer: {
      en: 'Yellowing of rice leaves often indicates nitrogen deficiency or early-stage rice blast. Check for orange-brown spots at leaf base.',
      hi: 'धान की पत्तियों का पीला पड़ना नाइट्रोजन की कमी या ब्लास्ट का संकेत है। पत्तियों के निचले हिस्से में नारंगी-भूरे धब्बे जाँचें।',
      bn: 'ধানের পাতা হলুদ হওয়া নাইট্রোজেনের ঘাটতি বা ব্লাস্ট রোগের লক্ষণ। পাতার গোড়ায় কমলা-বাদামী দাগ দেখুন।',
    },
    actions: {
      en: ['Apply urea 30–40 kg/ha if nitrogen deficient','Spray Tricyclazole 0.6g/L if fungal spots visible','Ensure field drainage'],
      hi: ['नाइट्रोजन की कमी हो तो 30–40 किग्रा/हेक्टेयर यूरिया डालें','फफूंद धब्बे हों तो ट्राइसाइक्लाजोल 0.6 ग्राम/लीटर छिड़कें','जल निकास सुनिश्चित करें'],
      bn: ['নাইট্রোজেনের ঘাটতি হলে ৩০-৪০ কেজি/হেক্টর ইউরিয়া দিন','ছত্রাকের দাগ থাকলে ট্রাইসাইক্লাজোল ০.৬ গ্রাম/লিটার স্প্রে করুন','জমির নিষ্কাশন নিশ্চিত করুন'],
    },
  },
  {
    keywords_en: ['brown','blast','spots','fungus','burnt'],
    keywords_hi: ['भूरे','ब्लास्ट','धब्बे','फफूंद'],
    keywords_bn: ['বাদামি','ব্লাস্ট','দাগ','ছত্রাক'],
    diagnosis: 'Rice Blast (Magnaporthe oryzae)', severity: 'urgent',
    answer: {
      en: 'Brown spindle-shaped spots with gray centers indicate Rice Blast — can destroy 70–80% of yield if untreated.',
      hi: 'भूरे धुरी के आकार के धब्बे ब्लास्ट रोग हैं। उपचार न हो तो 70-80% फसल नष्ट हो सकती है।',
      bn: 'বাদামি তর্কুরূপ দাগ ব্লাস্ট রোগের লক্ষণ — চিকিৎসা না করলে ৭০-৮০% ফলন নষ্ট হতে পারে।',
    },
    actions: {
      en: ['Spray Tricyclazole 75WP at 0.6g/L immediately','Remove and burn infected plants','Avoid excess nitrogen','Visit Krishi Seva Kendra'],
      hi: ['तुरंत ट्राइसाइक्लाजोल 75WP 0.6 ग्राम/लीटर छिड़कें','संक्रमित पौधे हटाकर जलाएं','अतिरिक्त नाइट्रोजन न दें','कृषि सेवा केंद्र जाएं'],
      bn: ['তাৎক্ষণিকভাবে ট্রাইসাইক্লাজোল ৭৫WP ০.৬ গ্রাম/লিটার স্প্রে করুন','আক্রান্ত গাছ পুড়িয়ে দিন','অতিরিক্ত নাইট্রোজেন এড়িয়ে চলুন','কৃষি সেবা কেন্দ্রে যান'],
    },
  },
  {
    keywords_en: ['hopper','insect','pest','bug'],
    keywords_hi: ['टिड्डा','कीड़ा','कीट','हॉपर'],
    keywords_bn: ['হপার','পোকা','কীটপতঙ্গ'],
    diagnosis: 'Brown Plant Hopper (BPH)', severity: 'urgent',
    answer: {
      en: 'Brown plant hoppers suck sap causing "hopperburn". Plants dry from the base and entire fields can be wiped out.',
      hi: 'भूरे टिड्डे रस चूसकर "हॉपरबर्न" करते हैं। पौधे जड़ से सूखते हैं और पूरी फसल नष्ट हो सकती है।',
      bn: 'বাদামি গাছফড়িং রস চুষে "হপারবার্ন" করে। গাছ গোড়া থেকে শুকিয়ে পুরো ক্ষেত নষ্ট হতে পারে।',
    },
    actions: {
      en: ['Spray Imidacloprid 17.8SL at 0.25ml/L','Drain field 3–4 days','Use light traps'],
      hi: ['इमिडाक्लोप्रिड 17.8SL 0.25 मिली/लीटर छिड़कें','3-4 दिन खेत का पानी निकालें','प्रकाश जाल लगाएं'],
      bn: ['ইমিডাক্লোপ্রিড ১৭.৮SL ০.২৫ মিলি/লিটার স্প্রে করুন','৩-৪ দিন জমি শুকান','আলোক ফাঁদ ব্যবহার করুন'],
    },
  },
  {
    keywords_en: ['drought','dry','wilting','curling','no water'],
    keywords_hi: ['सूखा','मुरझाना','पानी की कमी'],
    keywords_bn: ['খরা','শুকনো','ঢলে পড়া','পানির অভাব'],
    diagnosis: 'Drought / Water Stress', severity: 'caution',
    answer: {
      en: 'Leaf rolling and wilting indicate water stress. Rice needs 5–7cm standing water during tillering and panicle stages.',
      hi: 'पत्तियों का मुड़ना जल तनाव है। धान को कल्ले और बाली चरण में 5-7 सेमी खड़े पानी की जरूरत है।',
      bn: 'পাতা মোড়ানো ও ঢলে পড়া জল সংকটের লক্ষণ। ধানের কুশি ও শীষ পর্যায়ে ৫-৭ সেমি পানি দরকার।',
    },
    actions: {
      en: ['Irrigate immediately to 5cm level','Apply potassium sulfate 50kg/ha','Use AWD technique'],
      hi: ['तुरंत 5 सेमी सिंचाई करें','पोटेशियम सल्फेट 50 किग्रा/हेक्टेयर दें','AWD तकनीक अपनाएं'],
      bn: ['তাৎক্ষণিক ৫ সেমি সেচ দিন','পটাশিয়াম সালফেট ৫০ কেজি/হেক্টর দিন','AWD পদ্ধতি অনুসরণ করুন'],
    },
  },
  {
    keywords_en: ['flood','waterlogged','submerged','too much water'],
    keywords_hi: ['बाढ़','जलभराव','डूबा','ज्यादा पानी'],
    keywords_bn: ['বন্যা','জলাবদ্ধতা','ডুবে গেছে','অতিরিক্ত পানি'],
    diagnosis: 'Flood / Waterlogging Damage', severity: 'urgent',
    answer: {
      en: 'Prolonged waterlogging (>72h) kills roots. Young seedlings are especially at risk.',
      hi: '72 घंटे से अधिक जलभराव जड़ों को मारता है। छोटे पौधे सबसे कमजोर होते हैं।',
      bn: '৭২ ঘণ্টার বেশি জলাবদ্ধতা শিকড় মেরে ফেলে। ছোট চারা সবচেয়ে বেশি ক্ষতিগ্রস্ত হয়।',
    },
    actions: {
      en: ['Drain water immediately via pumps','Use flood-tolerant varieties next season (Swarna Sub-1)','Spray potassium nitrate 1% after draining'],
      hi: ['पंप से तुरंत पानी निकालें','अगले मौसम बाढ़ सहनशील किस्म (स्वर्णा सब-1) लगाएं','पानी निकलने के बाद पोटेशियम नाइट्रेट 1% छिड़कें'],
      bn: ['পাম্প দিয়ে তাৎক্ষণিক পানি সরান','আগামী মৌসুমে বন্যা-সহনশীল জাত (স্বর্ণা সাব-১) ব্যবহার করুন','পানি নামার পর পটাশিয়াম নাইট্রেট ১% স্প্রে করুন'],
    },
  },
];

const FALLBACK: Record<SupportedLang, DoctorResult> = {
  en: { answer_text: 'Could not identify the specific issue. Please describe symptoms clearly — leaf color, spot shape, affected part, and when symptoms started.', severity: 'info', recommended_actions: ['Take a photo and visit your nearest Krishi Seva Kendra','Note when symptoms first appeared','Check if neighboring plots are also affected'], powered_by: 'rules' },
  hi: { answer_text: 'समस्या पहचान नहीं हुई। कृपया लक्षण स्पष्ट बताएं — पत्ती का रंग, धब्बे का आकार, प्रभावित हिस्सा, और लक्षण कब शुरू हुए।', severity: 'info', recommended_actions: ['फोटो लेकर नजदीकी कृषि सेवा केंद्र जाएं','लक्षण कब शुरू हुए ध्यान दें','देखें क्या पड़ोसी खेत भी प्रभावित हैं'], powered_by: 'rules' },
  bn: { answer_text: 'সমস্যা চিহ্নিত করা যায়নি। অনুগ্রহ করে লক্ষণ স্পষ্টভাবে বর্ণনা করুন — পাতার রঙ, দাগের আকার, আক্রান্ত অংশ এবং কখন শুরু হয়েছে।', severity: 'info', recommended_actions: ['ছবি তুলে নিকটস্থ কৃষি সেবা কেন্দ্রে যান','লক্ষণ কখন শুরু হয়েছে তা লক্ষ্য করুন','প্রতিবেশী জমিও আক্রান্ত কিনা দেখুন'], powered_by: 'rules' },
};

function ruleBasedDiagnose(text: string, lang: SupportedLang): DoctorResult {
  const lower = text.toLowerCase();
  let best: RuleEntry | null = null;
  let maxHits = 0;
  for (const rule of RULES) {
    const kws = lang === 'en' ? rule.keywords_en : lang === 'hi' ? rule.keywords_hi : rule.keywords_bn;
    const hits = kws.filter(k => lower.includes(k)).length;
    if (hits > maxHits) { maxHits = hits; best = rule; }
  }
  if (!best || maxHits === 0) return FALLBACK[lang];
  return {
    answer_text: best.answer[lang], diagnosis: best.diagnosis,
    severity: best.severity, recommended_actions: best.actions[lang],
    powered_by: 'rules',
  };
}

// ── Public diagnose function ───────────────────────────────────────────────────
export async function diagnose(query: DoctorQuery): Promise<DoctorResult> {
  const text     = (query.textQuery || '').trim();
  const selected = ((query.lang || 'en') as SupportedLang);

  if (!text) return FALLBACK[selected];

  // 1. Language mismatch check (no API call needed)
  const detected = detectLang(text);
  if (detected !== selected) return mismatchMsg(selected, detected);

  // 2. Try Gemini AI first
  try {
    return await askGemini(text, selected);
  } catch (err: any) {
    const isKeyMissing = err?.message?.includes('not configured') || err?.message?.includes('API_KEY');
    if (!isKeyMissing) {
      console.error('Gemini API error:', err?.message);
    }
    // 3. Fall back to rule-based engine
    return ruleBasedDiagnose(text, selected);
  }
}
