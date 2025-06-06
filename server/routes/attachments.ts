import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione Multer per upload nella cartella uploads/
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Limiti e validazione Multer: max 10MB, solo immagini/pdf/docx/xlsx
const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
const uploadValidated = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo file non consentito'));
  }
});

const router = Router();

// Cartella per i metadata
const metaDir = path.resolve(uploadDir, 'metadata');
if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir);

// POST /api/attachments/upload - Upload file allegato con taskId, descrizione, validazione
router.post('/upload', (req, res, next) => {
  uploadValidated.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Errore Multer (es. file troppo grande)
      return res.status(400).json({ error: err.message });
    } else if (err) {
      // Errore validazione tipo file
      // Se il file è stato scritto, lo elimino
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });
    const { taskId, description } = req.body;
    // Salva metadata
    const meta = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      taskId: taskId ? String(taskId) : undefined,
      description: description || '',
      uploadedAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(metaDir, req.file.filename + '.json'), JSON.stringify(meta));
    res.json(meta);
  });
});

// GET /api/attachments/:filename - Download file allegato
router.get('/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File non trovato' });
  res.download(filePath);
});

// GET /api/attachments - Lista file, filtrabile per taskId
router.get('/', (req, res) => {
  const { taskId } = req.query;
  let files = fs.readdirSync(uploadDir).filter(f => !f.startsWith('metadata')).map(filename => {
    let meta = null;
    const metaPath = path.join(metaDir, filename + '.json');
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
    return { filename, ...meta };
  });
  if (taskId) {
    files = files.filter(f => f.taskId === String(taskId));
  }
  res.json(files);
});

// DELETE /api/attachments/:filename - Elimina file allegato e metadata
router.delete('/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  const metaPath = path.join(metaDir, req.params.filename + '.json');
  let deleted = false;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    deleted = true;
  }
  if (fs.existsSync(metaPath)) {
    fs.unlinkSync(metaPath);
    deleted = true;
  }
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'File non trovato' });
  }
});

export default router;
// Rotte API per upload, download e gestione allegati
