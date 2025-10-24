const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth');
const guideRoutes = require('./routes/guides');
const adminRoutes = require('./routes/admin');
const commentRoutes = require('./routes/comments');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: false // Desactivamos CSP para desarrollo
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por IP por ventana
});
app.use(limiter);

// Middleware básico
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuración de sesiones
app.use(session({
  secret: 'tu-secreto-super-seguro-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // En producción debería ser true con HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);

// Rutas de las vistas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/guide/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'guide.html'));
});

// Socket.IO para comentarios en tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('join-guide', (guideId) => {
    socket.join(`guide-${guideId}`);
  });

  socket.on('new-comment', (data) => {
    io.to(`guide-${data.guideId}`).emit('comment-added', data);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log('📊 Plataforma de Guías de Estadística iniciada correctamente');
});

module.exports = { app, io };