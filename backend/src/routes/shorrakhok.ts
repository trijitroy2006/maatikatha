import { Router, Response } from 'express';
import multer from 'multer';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

function simulateFFT(
  fileSizeBytes: number,
): {
  pest_detected: boolean;
  confidence: number;
  frequency_peak_hz?: number;
  pest_type?: string;
  action?: string;
} {
  // Deterministic-ish simulation based on file size
  const seed = fileSizeBytes % 100;
  const threshold = fileSizeBytes > 50000 ? 40 : 20; // larger files = more signal
  const detected = seed < threshold;
  const confidence = parseFloat((0.62 + (seed / 100) * 0.28).toFixed(2));

  if (detected) {
    return {
      pest_detected: true,
      confidence,
      frequency_peak_hz: 120 + (seed % 180),
      pest_type:
        seed % 2 === 0
          ? 'Stem Borer (Scirpophaga incertulas)'
          : 'Brown Planthopper (Nilaparvata lugens)',
      action:
        'Apply Chlorpyrifos 20EC at 2.5ml/L. Deploy light traps. Alert neighboring farmers.',
    };
  }

  return { pest_detected: false, confidence };
}

router.post(
  '/scan',
  optionalAuth,
  upload.single('audio_file'),
  (req: AuthRequest, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'audio_file is required' });

    const result = simulateFFT(req.file.size);

    return res.json({
      ...result,
      analysed_at: new Date().toISOString(),
      method: 'fft_simulation',
      frequency_range_analysed: '100-300Hz',
    });
  },
);

export default router;
