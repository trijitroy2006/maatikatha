import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../db';

const router = Router();

function hashScore(str: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xFFFFFF;
  return h % mod;
}

function getBand(score: number): { band: string; premium_rate_pct: number } {
  if (score <= 30) return { band: 'High Risk',         premium_rate_pct: 4.5 };
  if (score <= 55) return { band: 'Moderate Risk',     premium_rate_pct: 3.0 };
  if (score <= 75) return { band: 'Resilient',         premium_rate_pct: 1.8 };
  return              { band: 'Highly Resilient',   premium_rate_pct: 1.0 };
}

function getRecommendations(score: number, breakdown: Record<string, number>): string[] {
  const recs: string[] = [];
  if (score < 60) recs.push('Upload field photos regularly to improve your monitoring score');
  if (score < 70) recs.push('Consult the AI Field Doctor at least once per season for a bonus');
  if (breakdown.location_risk_penalty < -15) recs.push('Your plot is in a flood-prone zone — consider bund construction or raised bed farming');
  recs.push('Practice crop diversification (2+ crops) to reduce single-crop vulnerability');
  if (score < 50) recs.push('Apply for PM Fasal Bima Yojana at your local Krishi Kendra immediately');
  return recs.slice(0, 4);
}

router.get('/:farmId', authenticate, (req: AuthRequest, res: Response) => {
  const { farmId } = req.params;
  const userId = req.userId ?? 'unknown';

  // Get user record
  const user = db.users.findById(userId);
  const registeredDaysAgo = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)
    : 0;

  // Simulate plot vulnerability from farmId hash (reproducible per farm)
  const locationRiskPenalty = -(hashScore(farmId, 25) + 5);        // -5 to -30
  const soilHealthBonus     =  hashScore(farmId + 'soil', 15) + 5; //  5 to 20
  const cropDiversityBonus  =  hashScore(farmId + 'crop', 12) + 3; //  3 to 15

  // Adaptation bonuses
  const insuranceBonus    = registeredDaysAgo > 30 ? 10 : 5;
  const uploadBonus       = 5;  // bonus for using photo upload
  const climateBonus      = 5;  // bonus for using climate features
  const doctorBonus       = 5;  // bonus for using AI doctor

  const adaptationBonus = insuranceBonus + uploadBonus + climateBonus + doctorBonus;

  const score = Math.min(100, Math.max(0,
    50 + locationRiskPenalty + soilHealthBonus + cropDiversityBonus + adaptationBonus
  ));

  const { band, premium_rate_pct } = getBand(score);

  const breakdown = {
    base_score:            50,
    location_risk_penalty: locationRiskPenalty,
    soil_health_bonus:     soilHealthBonus,
    crop_diversity_bonus:  cropDiversityBonus,
    adaptation_bonus:      adaptationBonus,
  };

  return res.json({
    farm_id:           farmId,
    farmer_id:         userId,
    resilience_score:  score,
    band,
    premium_rate_pct,
    score_breakdown:   breakdown,
    recommendations:   getRecommendations(score, breakdown),
    calculated_at:     new Date().toISOString(),
  });
});

export default router;
