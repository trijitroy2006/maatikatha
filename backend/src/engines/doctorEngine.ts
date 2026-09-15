// ============================================================
// DOCTOR ENGINE — Trilingual (English / Hindi / Bengali)
// Detects query language and warns on mismatch with selected lang
// ============================================================

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
  lang_mismatch?: boolean;        // true when detected lang ≠ selected lang
}

// ── Language detection helpers ────────────────────────────────────────────────
// Bengali unicode block: U+0980–U+09FF
const isBengali = (text: string) => /[\u0980-\u09FF]/.test(text);
// Hindi (Devanagari) unicode block: U+0900–U+097F
const isHindi   = (text: string) => /[\u0900-\u097F]/.test(text);
// Treat everything else as English
function detectLang(text: string): SupportedLang {
  if (isBengali(text)) return 'bn';
  if (isHindi(text))   return 'hi';
  return 'en';
}

// ── Mismatch messages in all 3 languages ──────────────────────────────────────
const MISMATCH_MSG: Record<SupportedLang, (selected: SupportedLang) => string> = {
  en: (sel) => `You are writing in ${sel === 'hi' ? 'Hindi' : 'Bengali'} but the language is set to English. Please switch to the correct language first using the language buttons above, then ask your question again.`,
  hi: (sel) => `आप ${sel === 'en' ? 'अंग्रेज़ी' : 'बंगाली'} में लिख रहे हैं लेकिन भाषा हिंदी पर सेट है। कृपया पहले ऊपर दिए गए बटन से सही भाषा चुनें, फिर दोबारा प्रश्न पूछें।`,
  bn: (sel) => `আপনি ${sel === 'en' ? 'ইংরেজি' : 'হিন্দি'} তে লিখছেন কিন্তু ভাষা বাংলা সেট করা আছে। অনুগ্রহ করে আগে উপরের বোতাম দিয়ে সঠিক ভাষা বেছে নিন, তারপর আবার প্রশ্ন করুন।`,
};

// ── Disease rules — English keywords + trilingual responses ──────────────────
interface DiseaseRule {
  keywords_en: string[];
  keywords_hi: string[];
  keywords_bn: string[];
  diagnosis:   string;
  severity:    DoctorResult['severity'];
  answer:      Record<SupportedLang, string>;
  actions:     Record<SupportedLang, string[]>;
}

const DISEASE_RULES: DiseaseRule[] = [
  // ── 1. Nitrogen Deficiency / Early Blast ──
  {
    keywords_en: ['yellow', 'yellowing', 'pale', 'chlorosis', 'light green'],
    keywords_hi: ['पीला', 'पीलापन', 'हल्का', 'क्लोरोसिस', 'पत्ते पीले'],
    keywords_bn: ['হলুদ', 'হলদে', 'ফ্যাকাশে', 'পাতা হলুদ', 'ক্লোরোসিস'],
    diagnosis: 'Nitrogen Deficiency / Early Blast',
    severity: 'caution',
    answer: {
      en: 'Yellowing of rice leaves often indicates nitrogen deficiency or early-stage rice blast fungus. Check the base of leaves for orange-brown spots.',
      hi: 'धान की पत्तियों का पीला पड़ना अक्सर नाइट्रोजन की कमी या प्रारंभिक ब्लास्ट बीमारी का संकेत है। पत्तियों के निचले हिस्से में नारंगी-भूरे धब्बों की जाँच करें।',
      bn: 'ধানের পাতা হলুদ হওয়া সাধারণত নাইট্রোজেনের অভাব বা প্রাথমিক ব্লাস্ট রোগের লক্ষণ। পাতার নিচের অংশে কমলা-বাদামী দাগ আছে কিনা দেখুন।',
    },
    actions: {
      en: ['Apply urea fertilizer at 30–40 kg/ha if soil test confirms nitrogen deficiency', 'Spray tricyclazole (Beam) 0.6g/L water if fungal spots are visible', 'Ensure adequate drainage to reduce humidity'],
      hi: ['मिट्टी परीक्षण से नाइट्रोजन की कमी सिद्ध हो तो 30–40 किग्रा/हेक्टेयर यूरिया डालें', 'यदि फफूंद के धब्बे दिखें तो ट्राइसाइक्लाजोल 0.6 ग्राम/लीटर पानी में घोलकर स्प्रे करें', 'नमी कम करने के लिए खेत में उचित जल निकास सुनिश्चित करें'],
      bn: ['মাটি পরীক্ষায় নাইট্রোজেনের ঘাটতি নিশ্চিত হলে ৩০–৪০ কেজি/হেক্টর ইউরিয়া দিন', 'ছত্রাকের দাগ দেখা গেলে ট্রাইসাইক্লাজোল ০.৬ গ্রাম/লিটার জলে মিশিয়ে স্প্রে করুন', 'আর্দ্রতা কমাতে সঠিক জল নিষ্কাশন নিশ্চিত করুন'],
    },
  },

  // ── 2. Rice Blast ──
  {
    keywords_en: ['brown spot', 'brown', 'spots', 'lesion', 'blast', 'fungus', 'burned', 'burnt'],
    keywords_hi: ['भूरे धब्बे', 'ब्लास्ट', 'जले हुए', 'फफूंद', 'धब्बे', 'भूरा'],
    keywords_bn: ['বাদামি দাগ', 'ব্লাস্ট', 'ছত্রাক', 'দাগ', 'পোড়া', 'বাদামী'],
    diagnosis: 'Rice Blast (Magnaporthe oryzae)',
    severity: 'urgent',
    answer: {
      en: 'Brown spindle-shaped spots with gray centers indicate Rice Blast — a critical fungal disease that can destroy 70–80% of yield if untreated.',
      hi: 'भूरे रंग के धुरी के आकार के धब्बे जिनका केंद्र भूरा होता है — यह ब्लास्ट रोग का संकेत है। यह एक गंभीर फफूंद रोग है जो उपचार न होने पर 70-80% फसल नष्ट कर सकता है।',
      bn: 'ধূসর কেন্দ্রযুক্ত বাদামি তর্কুরূপ দাগ ব্লাস্ট রোগের লক্ষণ — এটি একটি মারাত্মক ছত্রাক রোগ যা চিকিৎসা না করলে ৭০-৮০% ফলন নষ্ট করতে পারে।',
    },
    actions: {
      en: ['Immediately spray Tricyclazole 75WP at 0.6g/L or Isoprothiolane at 1.5ml/L', 'Remove and burn heavily infected plant material', 'Avoid excess nitrogen application', 'Contact your local Krishi Seva Kendra immediately'],
      hi: ['तुरंत ट्राइसाइक्लाजोल 75WP 0.6 ग्राम/लीटर या आइसोप्रोथिओलेन 1.5 मिली/लीटर छिड़कें', 'अत्यधिक संक्रमित पौधों को हटाकर जला दें', 'अतिरिक्त नाइट्रोजन का उपयोग न करें', 'तुरंत नजदीकी कृषि सेवा केंद्र से संपर्क करें'],
      bn: ['তৎক্ষণাৎ ট্রাইসাইক্লাজোল ৭৫WP ০.৬ গ্রাম/লিটার বা আইসোপ্রোথিওলেন ১.৫ মিলি/লিটার স্প্রে করুন', 'মারাত্মক আক্রান্ত গাছ উপড়ে পুড়িয়ে দিন', 'অতিরিক্ত নাইট্রোজেন ব্যবহার এড়িয়ে চলুন', 'অবিলম্বে নিকটবর্তী কৃষি সেবা কেন্দ্রে যোগাযোগ করুন'],
    },
  },

  // ── 3. Brown Plant Hopper ──
  {
    keywords_en: ['hopper', 'insect', 'bug', 'pest', 'sucking', 'wilting base', 'hopperburn'],
    keywords_hi: ['टिड्डा', 'कीड़ा', 'हॉपर', 'रस चूसना', 'कीट', 'जड़ मुरझाना'],
    keywords_bn: ['হপার', 'পোকা', 'মাজরা', 'রস চোষা', 'কীটপতঙ্গ', 'গোড়া মরা'],
    diagnosis: 'Brown Plant Hopper (BPH)',
    severity: 'urgent',
    answer: {
      en: 'Brown plant hoppers suck sap from rice plants causing "hopperburn" — plants turn brown and dry from the base. This can wipe out entire fields.',
      hi: 'भूरे पौधे के टिड्डे धान के पौधों से रस चूसते हैं जिससे "हॉपरबर्न" होता है — पौधे जड़ से भूरे और सूखे हो जाते हैं। इससे पूरी फसल नष्ट हो सकती है।',
      bn: 'বাদামি গাছফড়িং ধান গাছের রস চুষে খায় যার ফলে "হপারবার্ন" হয় — গাছ গোড়া থেকে বাদামি ও শুকনো হয়ে যায়। এতে পুরো ক্ষেত নষ্ট হতে পারে।',
    },
    actions: {
      en: ['Spray Imidacloprid 17.8SL at 0.25ml/L or Buprofezin 25SC at 1.25ml/L', 'Drain field for 3–4 days to disrupt hopper lifecycle', 'Maintain proper spacing to reduce humidity', 'Use light traps to monitor hopper population'],
      hi: ['इमिडाक्लोप्रिड 17.8SL 0.25 मिली/लीटर या बुप्रोफेजिन 25SC 1.25 मिली/लीटर छिड़कें', 'टिड्डे के जीवनचक्र को बाधित करने के लिए 3-4 दिन खेत का पानी निकालें', 'आर्द्रता कम करने के लिए उचित दूरी बनाए रखें', 'टिड्डे की आबादी पर नजर रखने के लिए प्रकाश जाल का उपयोग करें'],
      bn: ['ইমিডাক্লোপ্রিড ১৭.৮SL ০.২৫ মিলি/লিটার বা বুপ্রোফেজিন ২৫SC ১.২৫ মিলি/লিটার স্প্রে করুন', 'হপারের জীবনচক্র নষ্ট করতে ৩-৪ দিন জমির পানি বের করুন', 'আর্দ্রতা কমাতে সঠিক দূরত্ব বজায় রাখুন', 'হপারের সংখ্যা পর্যবেক্ষণে আলোক ফাঁদ ব্যবহার করুন'],
    },
  },

  // ── 4. Sheath Blight ──
  {
    keywords_en: ['sheath blight', 'sheath', 'water soaked', 'blight', 'oval lesion'],
    keywords_hi: ['शीथ ब्लाइट', 'शीथ', 'जल सोख', 'अंगमारी', 'ओवल धब्बा'],
    keywords_bn: ['শিথ ব্লাইট', 'খোল', 'জল ভেজা', 'ব্লাইট', 'ডিম্বাকার দাগ'],
    diagnosis: 'Sheath Blight (Rhizoctonia solani)',
    severity: 'caution',
    answer: {
      en: 'Sheath blight shows as water-soaked oval lesions on leaf sheaths. It thrives in dense, humid conditions and can cause 25–50% yield loss.',
      hi: 'शीथ ब्लाइट पत्तियों की म्यान पर जल सोखे अंडाकार धब्बों के रूप में दिखता है। यह घने, नम वातावरण में फलता है और 25-50% उपज नुकसान कर सकता है।',
      bn: 'শিথ ব্লাইট পাতার খোলে জল ভেজা ডিম্বাকার দাগ হিসেবে দেখা দেয়। এটি ঘন, আর্দ্র পরিবেশে বৃদ্ধি পায় এবং ২৫-৫০% ফলন নষ্ট করতে পারে।',
    },
    actions: {
      en: ['Spray Hexaconazole 5EC at 2ml/L water', 'Reduce plant density and avoid heavy nitrogen fertilization', 'Apply Trichoderma-based bio-pesticide as preventive measure'],
      hi: ['2 मिली/लीटर पानी में हेक्साकोनाजोल 5EC का छिड़काव करें', 'पौधों की घनत्व कम करें और अत्यधिक नाइट्रोजन खाद से बचें', 'निवारक उपाय के रूप में ट्राइकोडर्मा आधारित जैव-कीटनाशक लगाएं'],
      bn: ['২ মিলি/লিটার জলে হেক্সাকোনাজোল ৫EC স্প্রে করুন', 'গাছের ঘনত্ব কমান এবং অতিরিক্ত নাইট্রোজেন সার এড়িয়ে চলুন', 'প্রতিরোধমূলক ব্যবস্থা হিসেবে ট্রাইকোডার্মা-ভিত্তিক জৈব কীটনাশক ব্যবহার করুন'],
    },
  },

  // ── 5. Drought / Water Stress ──
  {
    keywords_en: ['drought', 'dry', 'wilting', 'curling', 'rolled leaves', 'water stress', 'no water'],
    keywords_hi: ['सूखा', 'सूखना', 'मुरझाना', 'मुड़ी पत्तियाँ', 'पानी की कमी', 'जल तनाव'],
    keywords_bn: ['খরা', 'শুকনো', 'ঢলে পড়া', 'মোড়ানো পাতা', 'পানির অভাব', 'জল সংকট'],
    diagnosis: 'Drought / Water Stress',
    severity: 'caution',
    answer: {
      en: 'Leaf rolling and wilting indicate severe water stress. Rice requires 5–7cm of standing water during critical tillering and panicle initiation stages.',
      hi: 'पत्तियों का मुड़ना और मुरझाना गंभीर जल तनाव का संकेत है। धान को कल्ले निकलने और बाली बनने के महत्वपूर्ण चरणों में 5-7 सेमी खड़े पानी की आवश्यकता होती है।',
      bn: 'পাতা মোড়ানো এবং ঢলে পড়া মারাত্মক জল সংকটের লক্ষণ। ধানের কুশি বের হওয়া ও শীষ বের হওয়ার গুরুত্বপূর্ণ পর্যায়ে ৫-৭ সেমি দাঁড়ানো পানি প্রয়োজন।',
    },
    actions: {
      en: ['Irrigate immediately to maintain 5cm water level in field', 'Apply potassium sulfate (SOP) at 50kg/ha to improve drought tolerance', 'Use Alternate Wetting and Drying (AWD) technique to conserve water'],
      hi: ['खेत में 5 सेमी पानी स्तर बनाए रखने के लिए तुरंत सिंचाई करें', 'सूखा सहनशीलता सुधारने के लिए पोटेशियम सल्फेट (SOP) 50 किग्रा/हेक्टेयर दें', 'पानी बचाने के लिए AWD (बारी-बारी गीला और सूखा) तकनीक का उपयोग करें'],
      bn: ['জমিতে ৫ সেমি পানির স্তর বজায় রাখতে তাৎক্ষণিক সেচ দিন', 'খরা সহনশীলতা উন্নত করতে পটাশিয়াম সালফেট (SOP) ৫০ কেজি/হেক্টর দিন', 'পানি সংরক্ষণে AWD (পর্যায়ক্রমে ভেজানো ও শুকানো) পদ্ধতি ব্যবহার করুন'],
    },
  },

  // ── 6. Flood / Waterlogging ──
  {
    keywords_en: ['flood', 'waterlogged', 'submerged', 'drowning', 'too much water', 'standing water'],
    keywords_hi: ['बाढ़', 'जलभराव', 'डूबा', 'पानी भरा', 'अत्यधिक पानी'],
    keywords_bn: ['বন্যা', 'জলাবদ্ধতা', 'ডুবে গেছে', 'অতিরিক্ত পানি', 'জলমগ্ন'],
    diagnosis: 'Flood / Waterlogging Damage',
    severity: 'urgent',
    answer: {
      en: 'Prolonged waterlogging (>72 hours) causes root anaerobiosis and plant death. Young seedlings are especially vulnerable.',
      hi: 'लंबे समय तक जलभराव (72 घंटे से अधिक) जड़ों में ऑक्सीजन की कमी और पौधे की मृत्यु का कारण बनता है। छोटे पौधे विशेष रूप से कमजोर होते हैं।',
      bn: 'দীর্ঘস্থায়ী জলাবদ্ধতা (৭২ ঘণ্টার বেশি) শিকড়ে অক্সিজেনের অভাব এবং গাছের মৃত্যু ঘটায়। ছোট চারা বিশেষভাবে ক্ষতিগ্রস্ত হয়।',
    },
    actions: {
      en: ['Drain excess water immediately using pumps or drainage channels', 'Use Swarna Sub-1 or FL478 flood-tolerant varieties for future seasons', 'After draining, spray potassium nitrate (1%) to restore plant health', 'Monitor for disease outbreak after flooding recedes'],
      hi: ['पंप या नालियों से तुरंत अतिरिक्त पानी निकालें', 'अगले मौसम के लिए स्वर्णा सब-1 या FL478 बाढ़ सहनशील किस्में उपयोग करें', 'पानी निकलने के बाद पौधों की सेहत बहाल करने के लिए पोटेशियम नाइट्रेट (1%) का छिड़काव करें', 'बाढ़ उतरने के बाद रोग प्रकोप पर नजर रखें'],
      bn: ['পাম্প বা নিষ্কাশন চ্যানেল দিয়ে তাৎক্ষণিকভাবে অতিরিক্ত পানি সরান', 'আগামী মৌসুমে স্বর্ণা সাব-১ বা FL478 বন্যা-সহনশীল জাত ব্যবহার করুন', 'পানি নামার পর গাছের স্বাস্থ্য পুনরুদ্ধারে পটাশিয়াম নাইট্রেট (১%) স্প্রে করুন', 'বন্যা নামার পর রোগের প্রকোপ পর্যবেক্ষণ করুন'],
    },
  },

  // ── 7. Rodent Damage ──
  {
    keywords_en: ['rat', 'rodent', 'mouse', 'nibbled', 'cut stem', 'missing grain'],
    keywords_hi: ['चूहा', 'कृंतक', 'चूहे', 'कटी डंठल', 'अनाज गायब', 'कुतरा'],
    keywords_bn: ['ইঁদুর', 'ইঁদুরের ক্ষতি', 'ডাঁটা কাটা', 'দানা নেই', 'ইঁদুর খেয়েছে'],
    diagnosis: 'Rodent Damage',
    severity: 'caution',
    answer: {
      en: 'Rodent damage is identified by cut tillers at an angle and missing panicles. Field rats can cause 5–15% yield loss in epidemic years.',
      hi: 'कृंतक क्षति की पहचान तिरछे कटे हुए कल्लों और गायब बालियों से होती है। महामारी वर्षों में मैदानी चूहे 5-15% उपज का नुकसान कर सकते हैं।',
      bn: 'ইঁদুরের ক্ষতি কোণাকৃতিভাবে কাটা কুশি ও অনুপস্থিত শীষ দিয়ে চেনা যায়। মহামারি বছরে মাঠের ইঁদুর ৫-১৫% ফলন নষ্ট করতে পারে।',
    },
    actions: {
      en: ['Set snap traps with bamboo at a ratio of 4 traps per ha', 'Apply Zinc Phosphide bait at 0.5g/10m intervals along bunds', 'Coordinate with neighboring farmers for simultaneous rodent control', 'Maintain field bunds cleanly to remove rodent hiding spots'],
      hi: ['4 जाल प्रति हेक्टेयर की दर से बाँस के साथ स्नैप ट्रैप लगाएं', 'बाँधों के किनारे 0.5 ग्राम/10 मीटर की दूरी पर जिंक फास्फाइड चारा रखें', 'एक साथ कृंतक नियंत्रण के लिए पड़ोसी किसानों के साथ समन्वय करें', 'कृंतकों के छुपने के स्थान हटाने के लिए खेत की मेड़ साफ रखें'],
      bn: ['প্রতি হেক্টরে ৪টি ফাঁদের হারে বাঁশ দিয়ে স্ন্যাপ ট্র্যাপ রাখুন', 'বাঁধের পাশে ০.৫ গ্রাম/১০ মিটার দূরত্বে জিংক ফসফাইড টোপ রাখুন', 'একসাথে ইঁদুর দমনের জন্য প্রতিবেশী কৃষকদের সাথে সমন্বয় করুন', 'ইঁদুরের আশ্রয় সরাতে জমির আল পরিষ্কার রাখুন'],
    },
  },
];

// ── Default (not found) responses ─────────────────────────────────────────────
const DEFAULT_RESPONSE: Record<SupportedLang, DoctorResult> = {
  en: {
    answer_text: 'I could not identify a specific disease from your description. Please describe visible symptoms — leaf color, spot shape, affected parts (leaf/stem/root) and when symptoms started.',
    severity: 'info',
    recommended_actions: [
      'Take a clear photo of the affected plant and visit your nearest Krishi Seva Kendra',
      'Note when symptoms first appeared and how fast they are spreading',
      'Check if neighboring plots are also affected',
    ],
  },
  hi: {
    answer_text: 'मैं आपके विवरण से कोई विशेष रोग पहचान नहीं पाया। कृपया दृश्य लक्षणों का वर्णन करें — पत्ती का रंग, धब्बे का आकार, प्रभावित हिस्से (पत्ती/डंठल/जड़) और लक्षण कब शुरू हुए।',
    severity: 'info',
    recommended_actions: [
      'प्रभावित पौधे की स्पष्ट तस्वीर लें और नजदीकी कृषि सेवा केंद्र जाएं',
      'ध्यान दें लक्षण पहले कब दिखे और कितनी तेजी से फैल रहे हैं',
      'जाँचें कि क्या पड़ोसी खेत भी प्रभावित हैं',
    ],
  },
  bn: {
    answer_text: 'আপনার বর্ণনা থেকে কোনো নির্দিষ্ট রোগ চিহ্নিত করতে পারিনি। অনুগ্রহ করে দৃশ্যমান লক্ষণ বর্ণনা করুন — পাতার রঙ, দাগের আকার, আক্রান্ত অংশ (পাতা/কাণ্ড/শিকড়) এবং কখন লক্ষণ শুরু হয়েছে।',
    severity: 'info',
    recommended_actions: [
      'আক্রান্ত গাছের স্পষ্ট ছবি তুলুন এবং নিকটস্থ কৃষি সেবা কেন্দ্রে যান',
      'লক্ষণ কখন প্রথম দেখা দিয়েছে এবং কত দ্রুত ছড়াচ্ছে তা লক্ষ্য করুন',
      'প্রতিবেশী জমিও আক্রান্ত কিনা দেখুন',
    ],
  },
};

// ── Main diagnose function ─────────────────────────────────────────────────────
export function diagnose(query: DoctorQuery): DoctorResult {
  const text     = (query.textQuery || '').trim();
  const selected = (query.lang || 'en') as SupportedLang;

  if (!text) return DEFAULT_RESPONSE[selected];

  // 1. Detect the actual language of the query
  const detected = detectLang(text);

  // 2. If mismatch — tell user to switch
  if (detected !== selected) {
    const msg = MISMATCH_MSG[selected](detected);
    return {
      answer_text: msg,
      severity: 'info',
      recommended_actions: [],
      lang_mismatch: true,
    };
  }

  // 3. Match keywords in the detected language
  const lower = text.toLowerCase();
  let bestMatch: DiseaseRule | null = null;
  let maxMatches = 0;

  for (const rule of DISEASE_RULES) {
    const keywords =
      selected === 'en' ? rule.keywords_en :
      selected === 'hi' ? rule.keywords_hi :
                          rule.keywords_bn;

    const matches = keywords.filter(k => lower.includes(k)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch  = rule;
    }
  }

  if (!bestMatch || maxMatches === 0) return DEFAULT_RESPONSE[selected];

  return {
    answer_text:         bestMatch.answer[selected],
    diagnosis:           bestMatch.diagnosis,
    severity:            bestMatch.severity,
    recommended_actions: bestMatch.actions[selected],
  };
}
