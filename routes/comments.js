const express = require('express');
const database = require('../database/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Obtener comentarios de una guía
router.get('/guide/:guideId', optionalAuth, async (req, res) => {
  try {
    const comments = await database.getCommentsByGuide(req.params.guideId);
    res.json({ comments });
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo comentario
router.post('/guide/:guideId', authenticateToken, async (req, res) => {
  try {
    const { comment } = req.body;
    const guideId = req.params.guideId;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    if (comment.length > 1000) {
      return res.status(400).json({ error: 'El comentario no puede exceder 1000 caracteres' });
    }

    // Verificar que la guía existe
    const guide = await database.getGuideById(guideId);
    if (!guide) {
      return res.status(404).json({ error: 'Guía no encontrada' });
    }

    // Crear comentario
    const commentId = await database.createComment(guideId, req.user.id, comment.trim());

    // Obtener el comentario completo con información del usuario
    const newComment = {
      id: commentId,
      guide_id: parseInt(guideId),
      user_id: req.user.id,
      username: req.user.username,
      comment: comment.trim(),
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      message: 'Comentario creado exitosamente',
      comment: newComment
    });

  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar comentario
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const result = await database.deleteComment(req.params.commentId, req.user.id);
    
    if (result === 0) {
      return res.status(404).json({ error: 'Comentario no encontrado o no tienes permisos para eliminarlo' });
    }

    res.json({ message: 'Comentario eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;