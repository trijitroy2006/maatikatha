// ============================================================
// DOCTOR ENGINE — Team Member: Doctor Dev
// Rule-based crop disease AI using keyword-symptom matching
// ============================================================

export interface DoctorQuery {
  textQuery?: string;
  lang?: string;
}

export interface DoctorResult {
  answer_text: string;
  diagnosis?: string;
  severity: 'info' | 'caution' | 'urgent';
  recommended_actions: string[];
}

interface DiseaseRule {
  keywords: string[];
  diagnosis: string;
  severity: DoctorResult['severity'];
  answer: string;
  actions: string[];
}

const DISEASE_RULES: DiseaseRule[] = [
  {
    keywords: ['yellow', 'yellowing', 'leaf yellow', 'pale', 'chlorosis'],
    diagnosis: 'Nitrogen Deficiency or Early Blast',
    severity: 'caution',
    answer: 'Yellowing of rice leaves often indicates nitrogen deficiency or early-stage rice blast fungus. Check the base of leaves for orange-brown spots.',
    actions: [
      'Apply urea fertilizer at 30–40 kg/ha if soil test confirms nitrogen deficiency',
      'Spray tricyclazole (Beam) 0.6g/L water if fungal spots are visible',
      'Ensure adequate drainage to reduce humidity',
    ],
  },
  {
    keywords: ['brown spot', 'brown', 'spots', 'lesion', 'blast', 'fungus'],
    diagnosis: 'Rice Blast (Magnaporthe oryzae)',
    severity: 'urgent',
    answer: 'Brown spindle-shaped spots with gray centers indicate Rice Blast — a critical fungal disease that can destroy 70–80% of yield if untreated.',
    actions: [
      'Immediately spray Tricyclazole 75WP at 0.6g/L or Isoprothiolane at 1.5ml/L',
      'Remove and burn heavily infected plant material',
      'Avoid excess nitrogen application',
      'Contact your local Krishi Seva Kendra immediately',
    ],
  },
  {
    keywords: ['hopper', 'insect', 'bug', 'pest', 'sucking', 'wilting base'],
    diagnosis: 'Brown Plant Hopper (BPH)',
    severity: 'urgent',
    answer: 'Brown plant hoppers suck sap from rice plants causing "hopperburn" — plants turn brown and dry from the base. This can wipe out entire fields.',
    actions: [
      'Spray Imidacloprid 17.8SL at 0.25ml/L or Buprofezin 25SC at 1.25ml/L',
      'Drain field for 3–4 days to disrupt hopper lifecycle',
      'Maintain proper spacing between plants to reduce humidity',
      'Use light traps to monitor hopper population',
    ],
  },
  {
    keywords: ['sheath blight', 'sheath', 'water soaked', 'blight'],
    diagnosis: 'Sheath Blight (Rhizoctonia solani)',
    severity: 'caution',
    answer: 'Sheath blight shows as water-soaked, oval lesions on leaf sheaths. It thrives in dense, humid conditions and can cause 25–50% yield loss.',
    actions: [
      'Spray Hexaconazole 5EC at 2ml/L water',
      'Reduce plant density and avoid heavy nitrogen fertilization',
      'Apply Trichoderma-based bio-pesticide as preventive measure',
    ],
  },
  {
    keywords: ['drought', 'dry', 'wilting', 'curling', 'rolled leaves', 'water stress'],
    diagnosis: 'Drought / Water Stress',
    severity: 'caution',
    answer: 'Leaf rolling and wilting indicate severe water stress. Rice requires 5–7cm of standing water during critical tillering and panicle initiation stages.',
    actions: [
      'Irrigate immediately to maintain 5cm water level in field',
      'Apply potassium sulfate (SOP) at 50kg/ha to improve drought tolerance',
      'Use Alternate Wetting and Drying (AWD) technique to conserve water',
    ],
  },
  {
    keywords: ['flood', 'waterlogged', 'submerged', 'drowning', 'too much water'],
    diagnosis: 'Flood / Waterlogging Damage',
    severity: 'urgent',
    answer: 'Prolonged waterlogging (>72 hours) causes root anaerobiosis and plant death. Young seedlings are especially vulnerable.',
    actions: [
      'Drain excess water immediately using pumps or open drainage channels',
      'Apply Swarna Sub-1 or FL478 flood-tolerant varieties for future seasons',
      'After draining, spray potassium nitrate (1%) to restore plant health',
      'Monitor for disease outbreak after flooding recedes',
    ],
  },
  {
    keywords: ['rat', 'rodent', 'mouse', 'nibbled', 'cut stem', 'missing grain'],
    diagnosis: 'Rodent Damage',
    severity: 'caution',
    answer: 'Rodent damage is identified by cut tillers at an angle and missing panicles. Field rats can cause 5–15% yield loss in epidemic years.',
    actions: [
      'Set snap traps with bamboo at a ratio of 4 traps per ha',
      'Apply Zinc Phosphide bait at 0.5g/10m intervals along bunds',
      'Coordinate with neighboring farmers for simultaneous rodent control',
      'Maintain field bunds cleanly to remove rodent hiding spots',
    ],
  },
];

const DEFAULT_RESPONSE: DoctorResult = {
  answer_text: 'I could not identify a specific disease from your description. Please describe visible symptoms like leaf color, spot shape, affected plant parts (leaf, stem, root), and when symptoms started.',
  severity: 'info',
  recommended_actions: [
    'Take a clear photo of the affected plant and visit your nearest Krishi Seva Kendra',
    'Note when symptoms first appeared and how fast they are spreading',
    'Check if neighboring plots are also affected',
  ],
};

export function diagnose(query: DoctorQuery): DoctorResult {
  const text = (query.textQuery || '').toLowerCase();
  if (!text.trim()) return DEFAULT_RESPONSE;

  // Find best matching rule
  let bestMatch: DiseaseRule | null = null;
  let maxMatches = 0;

  for (const rule of DISEASE_RULES) {
    const matches = rule.keywords.filter(k => text.includes(k)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = rule;
    }
  }

  if (!bestMatch || maxMatches === 0) return DEFAULT_RESPONSE;

  return {
    answer_text: bestMatch.answer,
    diagnosis: bestMatch.diagnosis,
    severity: bestMatch.severity,
    recommended_actions: bestMatch.actions,
  };
}
