// compostEngine.ts — Biological Decay / Composting Timeline Calculator

export interface CompostInput {
  biomass_volume_kg:      number;
  crop_type:              string;
  avg_temperature_celsius: number;
  moisture_pct?:          number;  // default 60
  has_inoculant?:         boolean; // microbial inoculant reduces time by 15%
}

export interface CompostPhase {
  name:         string;
  duration_days: number;
  description:  string;
  temp_range:   string;
}

export interface CompostResult {
  estimated_days:         number;
  phases:                 CompostPhase[];
  tips:                   string[];
  final_quality:          string;
  n_p_k_estimate:         { N: number; P: number; K: number };
  carbon_to_nitrogen_ratio: number;
}

interface CropProfile {
  base_days: number;
  cn_ratio:  number;
  npk:       { N: number; P: number; K: number };
}

function getCropProfile(cropType: string): CropProfile {
  const ct = cropType.toLowerCase();
  if (ct.includes('paddy') || ct.includes('rice'))
    return { base_days: 45, cn_ratio: 60, npk: { N: 0.6, P: 0.2, K: 0.8 } };
  if (ct.includes('wheat') || ct.includes('straw'))
    return { base_days: 50, cn_ratio: 80, npk: { N: 0.5, P: 0.15, K: 0.6 } };
  if (ct.includes('sugarcane') || ct.includes('bagasse'))
    return { base_days: 60, cn_ratio: 150, npk: { N: 0.3, P: 0.1, K: 0.5 } };
  if (ct.includes('vegetable') || ct.includes('legume') || ct.includes('pulse'))
    return { base_days: 25, cn_ratio: 20, npk: { N: 1.5, P: 0.4, K: 1.2 } };
  if (ct.includes('maize') || ct.includes('corn'))
    return { base_days: 40, cn_ratio: 55, npk: { N: 0.7, P: 0.25, K: 0.8 } };
  if (ct.includes('mustard') || ct.includes('rapeseed'))
    return { base_days: 35, cn_ratio: 35, npk: { N: 1.0, P: 0.3, K: 0.9 } };
  if (ct.includes('jute'))
    return { base_days: 40, cn_ratio: 45, npk: { N: 0.9, P: 0.2, K: 0.7 } };
  return { base_days: 45, cn_ratio: 50, npk: { N: 0.8, P: 0.25, K: 0.7 } };
}

function getTempMultiplier(temp: number): number {
  if (temp < 15)        return 1.8;  // cold — very slow
  if (temp < 25)        return 1.3;  // cool
  if (temp <= 35)       return 1.0;  // optimal mesophilic
  if (temp <= 45)       return 0.85; // thermophilic — faster
  return 1.2;                        // too hot — kills microbes, slows
}

export function calculateCompostTimeline(input: CompostInput): CompostResult {
  const { biomass_volume_kg, crop_type, avg_temperature_celsius } = input;
  const moisture_pct   = input.moisture_pct   ?? 60;
  const has_inoculant  = input.has_inoculant   ?? false;

  const profile   = getCropProfile(crop_type);
  const tempMult  = getTempMultiplier(avg_temperature_celsius);
  const volumeAdd = Math.floor(biomass_volume_kg / 100) * 5;
  const moisturePenalty = (moisture_pct < 40 || moisture_pct > 80) ? 10 : 0;

  let estimated_days = Math.round(
    profile.base_days * tempMult + volumeAdd + moisturePenalty
  );
  if (has_inoculant) estimated_days = Math.round(estimated_days * 0.85);
  estimated_days = Math.max(20, estimated_days);

  const phases: CompostPhase[] = [
    {
      name: 'Mesophilic Phase',
      duration_days: 4,
      description: 'Initial microbial colonization. Pile heats up as bacteria begin breaking down simple sugars.',
      temp_range: '20–40°C',
    },
    {
      name: 'Thermophilic Phase',
      duration_days: Math.round(estimated_days * 0.40),
      description: 'Rapid decomposition of cellulose and lignin. High heat destroys weed seeds and pathogens.',
      temp_range: '45–70°C',
    },
    {
      name: 'Cooling Phase',
      duration_days: Math.round(estimated_days * 0.25),
      description: 'Microbial activity slows. Fungi and actinomycetes begin breaking down remaining fibrous material.',
      temp_range: '35–45°C',
    },
    {
      name: 'Maturation / Curing Phase',
      duration_days: Math.round(estimated_days * 0.35),
      description: 'Humus formation. Earthworm activity. Compost stabilizes into rich, dark, earthy-smelling material.',
      temp_range: 'Ambient (25–35°C)',
    },
  ];

  // Estimated C:N after composting (target < 25:1)
  const final_cn = Math.round(profile.cn_ratio * 0.35);
  const final_quality =
    final_cn < 25 ? 'Excellent — Ready for application'
    : final_cn < 35 ? 'Good — Suitable for most crops'
    : 'Fair — Extend curing by 2 more weeks';

  const tips: string[] = [
    `Turn the pile every ${avg_temperature_celsius > 30 ? '4-5' : '7'} days to maintain oxygen flow and even decomposition.`,
    moisture_pct < 50 ? 'Add water to maintain 50-60% moisture (pile should feel like a wrung-out sponge).' : 'Moisture level is adequate — cover pile during heavy rain to prevent nutrient leaching.',
    has_inoculant ? 'Good choice using microbial inoculant — it will speed up the process by ~15%.' : 'Add 1-2 handfuls of finished compost or cow dung slurry as natural microbial inoculant.',
    profile.cn_ratio > 60 ? `High C:N ratio (${profile.cn_ratio}:1) for ${crop_type} — add nitrogen-rich material (green leaves, urine, poultry manure) to balance.` : 'C:N ratio is well-balanced for this crop type.',
  ];

  return {
    estimated_days,
    phases,
    tips,
    final_quality,
    n_p_k_estimate: profile.npk,
    carbon_to_nitrogen_ratio: profile.cn_ratio,
  };
}
