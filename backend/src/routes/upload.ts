import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { FieldUpload } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Images only'));
  },
});

function mockAnalyse() {
  const conditions = ['Healthy Crop', 'Possible Rice Blast', 'Possible Brown Hopper', 'Possible Late Blight', 'Water Stress'];
  return { detected_condition: conditions[Math.floor(Math.random()*conditions.length)], confidence: Math.round(65+Math.random()*30), analysed_at: new Date().toISOString() };
}

const router = Router();

router.post('/', authenticate, upload.single('photo'), (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded (key: "photo")' });

  const analysis = mockAnalyse();
  const record: FieldUpload = {
    id: uuidv4(), user_id: req.userId!, plot_id: req.body.plot_id || null,
    filename: req.file.filename, original_name: req.file.originalname,
    file_size: req.file.size, mime_type: req.file.mimetype,
    analysis_result: analysis, uploaded_at: new Date().toISOString(),
  };
  db.uploads.insert(record);
  return res.status(201).json({ ...record, url: `/uploads/${req.file.filename}`, analysis });
});

router.get('/my', authenticate, (req: AuthRequest, res: Response) => {
  const uploads = db.uploads.byUser(req.userId!).map(u => ({ ...u, url: `/uploads/${u.filename}` }));
  return res.json({ uploads });
});

export default router;
