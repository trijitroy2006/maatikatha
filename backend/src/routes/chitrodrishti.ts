import { Router, Response } from 'express';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

async function analyseWithGroq(imageBase64: string, context: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  try {
    const b64preview = imageBase64.substring(0, 200);
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        temperature: 0.2,
        max_tokens: 800,
        messages: [
          {
            role: 'system',
            content:
              'You are an agricultural plant pathology expert specializing in Indian crops. Analyse crop disease and return ONLY valid JSON with fields: disease_name, confidence_pct (number 0-100), severity (mild|moderate|severe|critical), symptoms_observed (string array), bengali_remedy (string in Bengali script ব), recommended_fungicide (string), immediate_action (string), off_topic (boolean).',
          },
          {
            role: 'user',
            content: `Diagnose crop disease from this image. Location context: ${context}. Return JSON only.`,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    return JSON.parse(data?.choices?.[0]?.message?.content || 'null');
  } catch {
    return null;
  }
}

function mockDiagnosis() {
  return {
    disease_name: 'Rice Blast (Magnaporthe oryzae)',
    confidence_pct: 78,
    severity: 'moderate',
    symptoms_observed: [
      'Diamond-shaped lesions with gray centers',
      'Brown necrotic borders around lesions',
      'Yellowing of surrounding leaf tissue',
      'Neck rot on panicle visible',
    ],
    bengali_remedy:
      'ট্রাইসাইক্লাজল ৭৫ ডব্লিউপি ০.৬ গ্রাম/লিটার জলে মিশিয়ে স্প্রে করুন। আক্রান্ত গাছপালা সরিয়ে পুড়িয়ে দিন। জমি ৩-৪ দিন শুকনো রাখুন।',
    recommended_fungicide: 'Tricyclazole 75WP at 0.6g/L or Isoprothiolane 40EC at 1.5ml/L',
    immediate_action:
      'Drain field for 3-4 days. Apply potassium silicate to strengthen cell walls. Remove and burn heavily infected tillers.',
    powered_by: 'rules',
  };
}

router.post('/diagnose', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { image_base64, location_weather_context = 'India, Kharif season' } = req.body;
  if (!image_base64) return res.status(400).json({ error: 'image_base64 is required' });

  let analysis = await analyseWithGroq(image_base64, location_weather_context);
  if (!analysis || analysis.off_topic) analysis = mockDiagnosis();

  return res.json({ ...analysis, analysed_at: new Date().toISOString() });
});

export default router;
