const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const database = require('../database/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configuración de multer para subida de archivos (igual que en guides.js)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `guia-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  }
});

// Middleware para requerir autenticación y permisos de admin
router.use(authenticateToken);
router.use(requireAdmin);

// Subir nueva guía
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const { title, description, guideNumber } = req.body;

    if (!title || !guideNumber) {
      // Eliminar el archivo subido si faltan datos
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Título y número de guía son requeridos' });
    }

    const guideNum = parseInt(guideNumber);
    if (guideNum < 1 || guideNum > 7) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Número de guía debe estar entre 1 y 7' });
    }

    // Crear entrada en la base de datos
    const guideId = await database.createGuide(
      title,
      description || '',
      guideNum,
      req.file.filename,
      req.file.originalname,
      `uploads/${req.file.filename}`,
      req.file.size,
      req.user.id
    );

    res.status(201).json({
      message: 'Guía subida exitosamente',
      guideId,
      guide: {
        id: guideId,
        title,
        description,
        guide_number: guideNum,
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_size: req.file.size
      }
    });

  } catch (error) {
    // Limpiar archivo en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error al subir guía:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las guías (para admin)
router.get('/guides', async (req, res) => {
  try {
    const guides = await database.getAllGuides();
    res.json({ guides });
  } catch (error) {
    console.error('Error al obtener guías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar guía
router.delete('/guides/:id', async (req, res) => {
  try {
    const guide = await database.getGuideById(req.params.id);
    
    if (!guide) {
      return res.status(404).json({ error: 'Guía no encontrada' });
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '..', guide.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar de la base de datos
    await database.deleteGuide(req.params.id);

    res.json({ message: 'Guía eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar guía:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas del admin
router.get('/stats', async (req, res) => {
  try {
    const guides = await database.getAllGuides();
    
    const stats = {
      totalGuides: guides.length,
      guidesByNumber: {}
    };

    // Contar guías por número
    for (let i = 1; i <= 7; i++) {
      stats.guidesByNumber[i] = guides.filter(guide => guide.guide_number === i).length;
    }

    res.json(stats);

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;