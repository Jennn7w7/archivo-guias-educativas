const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const database = require('../database/jsonDatabase');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `guia-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptar solo archivos Excel
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
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

// Obtener todas las guías
router.get('/', optionalAuth, async (req, res) => {
  try {
    const guides = await database.getAllGuides();
    
    // Agrupar guías por número
    const guidesGrouped = {};
    for (let i = 1; i <= 7; i++) {
      guidesGrouped[i] = guides.filter(guide => guide.guide_number === i);
    }

    res.json({
      guides: guidesGrouped,
      totalGuides: guides.length
    });

  } catch (error) {
    console.error('Error al obtener guías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener guías por número
router.get('/number/:number', optionalAuth, async (req, res) => {
  try {
    const guideNumber = parseInt(req.params.number);
    
    if (guideNumber < 1 || guideNumber > 7) {
      return res.status(400).json({ error: 'Número de guía debe estar entre 1 y 7' });
    }

    const guides = await database.getGuidesByNumber(guideNumber);
    
    res.json({
      guides,
      guideNumber
    });

  } catch (error) {
    console.error('Error al obtener guías por número:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener una guía específica
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const guide = await database.getGuideById(req.params.id);
    
    if (!guide) {
      return res.status(404).json({ error: 'Guía no encontrada' });
    }

    res.json(guide);

  } catch (error) {
    console.error('Error al obtener guía:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Descargar archivo de guía
router.get('/:id/download', async (req, res) => {
  try {
    const guide = await database.getGuideById(req.params.id);
    
    if (!guide) {
      return res.status(404).json({ error: 'Guía no encontrada' });
    }

    const filePath = path.join(__dirname, '..', guide.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    res.download(filePath, guide.original_name, (err) => {
      if (err) {
        console.error('Error al descargar archivo:', err);
        res.status(500).json({ error: 'Error al descargar archivo' });
      }
    });

  } catch (error) {
    console.error('Error al procesar descarga:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;