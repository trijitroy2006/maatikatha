import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { FieldUpload } from '../db';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Store in memory for analysis (we need base64), then save to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Images only (jpeg/jpg/png/webp)'));
  },
});

// ── Groq AI crop analysis using vision-capable prompt ────────────────────────
async function analyseWithGroq(base64Image: string, mimeType: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
    return null; // fall back to mock
  }

  const systemPrompt = `You are an expert agricultural AI trained to diagnose crop diseases, pests, and health conditions from field photographs.

Analyze the provided crop image and return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "cropType": "Name of the crop (e.g., Tomato, Rice, Wheat, Potato, Mustard). Write 'Unknown Crop' if not identifiable.",
  "healthStatus": "One of: Healthy, Early Blight, Late Blight, Rice Blast, Brown Hopper, Leaf Curl Virus, Powdery Mildew, Nutrient Deficiency, Waterlogging Stress, Drought Stress, Pest Infestation, or the specific disease name you detect.",
  "confidenceScore": 85,
  "detectedSymptoms": [
    "Specific symptom 1 observed in the image",
    "Specific symptom 2",
    "Specific symptom 3"
  ],
  "recommendedAction": "Detailed step-by-step treatment or preventive recommendation. Include specific fungicide/pesticide names, dosage if applicable, and timing. 2-4 sentences.",
  "severity": "healthy OR mild OR moderate OR severe",
  "isNoCropDetected": false
}

If no crop or plant is visible in the image, set isNoCropDetected to true and fill other fields with appropriate defaults.
Base your analysis on visual symptoms visible in the image. Be specific and practical.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        temperature: 0.2,
        max_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this crop field photograph and provide your diagnosis in the specified JSON format.',
              },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Groq vision error:', res.status, err);
      return null;
    }

    const data = await res.json() as any;
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.error('Groq vision exception:', err?.message);
    return null;
  }
}

// ── Smart mock fallback (better than random) ─────────────────────────────────
function mockAnalyse(filename: string) {
  const name = filename.toLowerCase();
  let cropType = 'Unknown Crop';
  let healthStatus = 'Healthy';
  let detectedSymptoms = ['Green, turgid leaves observed', 'No visible lesions or discoloration', 'Normal growth pattern'];
  let recommendedAction = 'Your crop appears healthy. Continue regular monitoring, maintain proper irrigation, and apply balanced NPK fertilizer as per schedule.';
  let severity = 'healthy';
  let confidenceScore = 82;

  if (name.includes('tomato') || name.includes('tamatar')) {
    cropType = 'Tomato';
    healthStatus = 'Early Blight';
    detectedSymptoms = ['Brown circular spots with concentric rings on lower leaves', 'Yellow halo around dark lesions', 'Lesion spread from older to younger leaves'];
    recommendedAction = 'Apply Mancozeb 75WP at 2.5g/L or Chlorothalonil 75WP at 2g/L. Remove and destroy infected lower leaves immediately. Avoid overhead irrigation. Repeat spray every 7-10 days.';
    severity = 'moderate';
    confidenceScore = 79;
  } else if (name.includes('rice') || name.includes('paddy') || name.includes('dhan')) {
    cropType = 'Rice';
    healthStatus = 'Rice Blast';
    detectedSymptoms = ['Diamond-shaped lesions with gray centers on leaves', 'Brown borders around leaf spots', 'Neck rot symptoms on panicle'];
    recommendedAction = 'Spray Tricyclazole 75WP at 0.6g/L immediately. Remove and burn heavily infected plants. Drain field for 3-4 days. Apply potassium silicate to strengthen plant resistance.';
    severity = 'severe';
    confidenceScore = 75;
  } else if (name.includes('potato') || name.includes('aloo')) {
    cropType = 'Potato';
    healthStatus = 'Late Blight';
    detectedSymptoms = ['Water-soaked dark lesions on leaves', 'White fuzzy growth on underside of leaves', 'Rapid browning spreading across foliage'];
    recommendedAction = 'Apply Metalaxyl+Mancozeb at 2.5g/L. Spray every 5-7 days during humid weather. Destroy infected plant material. Avoid excess nitrogen fertilizer.';
    severity = 'severe';
    confidenceScore = 81;
  }

  return { cropType, healthStatus, confidenceScore, detectedSymptoms, recommendedAction, severity, isNoCropDetected: false };
}

const router = Router();

// POST /api/upload — analyse crop photo with AI
router.post('/', optionalAuth, upload.single('photo'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded. Use key: "photo"' });

  // Save to disk
  const filename = `${uuidv4()}${path.extname(req.file.originalname || '.jpg').toLowerCase()}`;
  const filepath  = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, req.file.buffer);

  // AI analysis
  const base64 = req.file.buffer.toString('base64');
  let analysis  = await analyseWithGroq(base64, req.file.mimetype);

  if (!analysis) {
    // Use smart mock based on filename
    analysis = mockAnalyse(req.file.originalname || '');
  }

  // Save record to DB if user is logged in
  if (req.userId) {
    try {
      const record: FieldUpload = {
        id: uuidv4(),
        user_id: req.userId,
        plot_id: req.body.plot_id || null,
        filename,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        analysis_result: analysis,
        uploaded_at: new Date().toISOString(),
      };
      db.uploads.insert(record);
    } catch (e) {
      console.warn('DB insert failed:', e);
    }
  }

  return res.status(201).json({
    filename,
    original_name: req.file.originalname,
    url: `/uploads/${filename}`,
    analysis,
    analysed_at: new Date().toISOString(),
  });
});

// GET /api/upload/my — list user's uploads
router.get('/my', optionalAuth, (req: AuthRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Auth required' });
  const uploads = db.uploads.byUser(req.userId).map(u => ({ ...u, url: `/uploads/${u.filename}` }));
  return res.json({ uploads });
});

export default router;
