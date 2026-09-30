// soilSpectroscopy.ts — Soil Color Spectroscopy via Canvas Grid Sampling

export interface SoilAnalysis {
  dominant_hex:        string;
  rgb:                 { r: number; g: number; b: number };
  organic_carbon_pct:  number;
  soil_type:           string;
  fertility_score:     number;
  interpretation:      string;
  recommendations:     string[];
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export function estimateCarbonFromHex(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return parseFloat(Math.max(0.1, Math.min(4.5, (1 - luminance) * 5.2)).toFixed(2));
}

function getSoilType(luminance: number): string {
  if (luminance < 0.20) return 'Black Cotton Soil (Vertisol) — Very high organic matter';
  if (luminance < 0.35) return 'Dark Loam — High organic matter';
  if (luminance < 0.50) return 'Brown Loam — Moderate organic matter';
  if (luminance < 0.65) return 'Sandy Loam — Low organic matter';
  return 'Sandy / Laterite Soil — Poor organic matter';
}

function getRecommendations(carbon_pct: number): string[] {
  if (carbon_pct < 1.0) return [
    'Apply 10-15 tonnes/hectare of FYM (Farm Yard Manure) immediately',
    'Begin in-situ composting of crop residues — do NOT burn stubble',
    'Grow green manure crops (Dhaincha/Sunhemp) in the next off-season',
    'Avoid intensive tillage to preserve remaining soil structure',
  ];
  if (carbon_pct < 2.0) return [
    'Apply 5-8 tonnes/hectare of compost per season',
    'Incorporate paddy straw / crop residues after harvest',
    'Use bio-fertilizers (Azotobacter, PSB) alongside chemical NPK',
  ];
  return [
    'Maintain current organic matter management practices',
    'Consider biannual soil testing to track carbon levels',
    'Introduce cover crops in fallow periods to sustain carbon',
  ];
}

export async function extractSoilColor(imageFile: File): Promise<SoilAnalysis> {
  return new Promise((resolve, reject) => {
    const img   = new Image();
    const objUrl = URL.createObjectURL(imageFile);
    img.onload = () => {
      try {
        const GRID = 50;
        const canvas  = document.createElement('canvas');
        canvas.width  = GRID;
        canvas.height = GRID;
        const ctx = canvas.getContext('2d')!;

        // Center-crop image to 50x50 grid
        const scale = Math.max(GRID / img.width, GRID / img.height);
        const sw = img.width  * scale;
        const sh = img.height * scale;
        ctx.drawImage(img, (GRID - sw) / 2, (GRID - sh) / 2, sw, sh);

        const { data } = ctx.getImageData(0, 0, GRID, GRID);
        let totalR = 0, totalG = 0, totalB = 0;
        const pixels = GRID * GRID;

        for (let i = 0; i < data.length; i += 4) {
          totalR += data[i];
          totalG += data[i + 1];
          totalB += data[i + 2];
        }

        const r = Math.round(totalR / pixels);
        const g = Math.round(totalG / pixels);
        const b = Math.round(totalB / pixels);

        const dominant_hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
        const luminance    = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        const organic_carbon_pct = parseFloat(
          Math.max(0.1, Math.min(4.5, (1 - luminance) * 5.2)).toFixed(2)
        );
        const soil_type      = getSoilType(luminance);
        const fertility_score = Math.round((1 - luminance) * 100);
        const interpretation = `Your soil has an average color of ${dominant_hex} with ${
          luminance < 0.35 ? 'dark, rich' : luminance < 0.55 ? 'medium' : 'light, sandy'
        } characteristics. Estimated organic carbon is ${organic_carbon_pct}%, which is ${
          organic_carbon_pct > 2.5 ? 'excellent' : organic_carbon_pct > 1.5 ? 'moderate' : 'low'
        } for Indian agricultural standards (ideal: 1.5–2.5%).`;

        URL.revokeObjectURL(objUrl);
        resolve({
          dominant_hex, rgb: { r, g, b },
          organic_carbon_pct, soil_type, fertility_score,
          interpretation, recommendations: getRecommendations(organic_carbon_pct),
        });
      } catch (e) {
        URL.revokeObjectURL(objUrl);
        reject(e);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('Failed to load image')); };
    img.src = objUrl;
  });
}
