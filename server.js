const express = require('express');
const path = require('path');

const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Datos en memoria para testing
let users = [
  { id: 1, username: 'admin', email: 'admin@test.com', password: 'admin123', role: 'admin' }
];

let guides = [
  { id: 1, title: 'Guía 1', description: 'Primera guía', file_path: null },
  { id: 2, title: 'Guía 2', description: 'Segunda guía', file_path: null },
  { id: 3, title: 'Guía 3', description: 'Tercera guía', file_path: null },
  { id: 4, title: 'Guía 4', description: 'Cuarta guía', file_path: null },
  { id: 5, title: 'Guía 5', description: 'Quinta guía', file_path: null },
  { id: 6, title: 'Guía 6', description: 'Sexta guía', file_path: null },
  { id: 7, title: 'Guía 7', description: 'Séptima guía', file_path: null }
];

let comments = [];

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/guides', (req, res) => {
  res.json(guides);
});

app.get('/api/guides/:id', (req, res) => {
  const guide = guides.find(g => g.id === parseInt(req.params.id));
  if (!guide) return res.status(404).json({ error: 'Guía no encontrada' });
  res.json(guide);
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  res.json({ user: { id: user.id, username: user.username, role: user.role }, token: 'fake-token' });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  const newUser = { 
    id: users.length + 1, 
    username, 
    email, 
    password, 
    role: 'user' 
  };
  users.push(newUser);
  res.json({ user: { id: newUser.id, username: newUser.username, role: newUser.role }, token: 'fake-token' });
});

app.get('/api/comments/:guideId', (req, res) => {
  const guideComments = comments.filter(c => c.guide_id === parseInt(req.params.guideId));
  res.json(guideComments);
});

app.post('/api/comments', (req, res) => {
  const { guideId, content, username } = req.body;
  const newComment = {
    id: comments.length + 1,
    guide_id: parseInt(guideId),
    username,
    content,
    created_at: new Date().toISOString()
  };
  comments.push(newComment);
  res.json(newComment);
});

// Rutas de vistas
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Archivo de Guías</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; background: #2563eb; color: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; }
            .guides-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
            .guide-card { background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .guide-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem; color: #1f2937; }
            .guide-desc { color: #6b7280; margin-bottom: 1rem; }
            .btn { padding: 0.5rem 1rem; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; display: inline-block; }
            .btn:hover { background: #1d4ed8; }
            .auth-section { text-align: center; margin-bottom: 2rem; }
            .auth-section a { margin: 0 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📚 Archivo de Guías</h1>
                <p>Plataforma para compartir y gestionar guías de estudio</p>
            </div>
            
            <div class="auth-section">
                <a href="/login" class="btn">Iniciar Sesión</a>
                <a href="/admin" class="btn">Panel Admin</a>
            </div>
            
            <div class="guides-grid" id="guidesContainer">
                <div class="guide-card">
                    <div class="guide-title">Guía 1</div>
                    <div class="guide-desc">Primera guía de estudio</div>
                    <a href="/guide/1" class="btn">Ver Guía</a>
                </div>
                <div class="guide-card">
                    <div class="guide-title">Guía 2</div>
                    <div class="guide-desc">Segunda guía de estudio</div>
                    <a href="/guide/2" class="btn">Ver Guía</a>
                </div>
                <div class="guide-card">
                    <div class="guide-title">Guía 3</div>
                    <div class="guide-desc">Tercera guía de estudio</div>
                    <a href="/guide/3" class="btn">Ver Guía</a>
                </div>
                <div class="guide-card">
                    <div class="guide-title">Guía 4</div>
                    <div class="guide-desc">Cuarta guía de estudio</div>
                    <a href="/guide/4" class="btn">Ver Guía</a>
                </div>
                <div class="guide-card">
                    <div class="guide-title">Guía 5</div>
                    <div class="guide-desc">Quinta guía de estudio</div>
                    <a href="/guide/5" class="btn">Ver Guía</a>
                </div>
                <div class="guide-card">
                    <div class="guide-title">Guía 6</div>
                    <div class="guide-desc">Sexta guía de estudio</div>
                    <a href="/guide/6" class="btn">Ver Guía</a>
                </div>
                <div class="guide-card">
                    <div class="guide-title">Guía 7</div>
                    <div class="guide-desc">Séptima guía de estudio</div>
                    <a href="/guide/7" class="btn">Ver Guía</a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.get('/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Login - Archivo de Guías</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 400px; margin: 0 auto; background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 2rem; }
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
            input { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
            .btn { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem; }
            .btn:hover { background: #1d4ed8; }
            .link { text-align: center; margin-top: 1rem; }
            .link a { color: #2563eb; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Iniciar Sesión</h2>
            </div>
            <form id="loginForm">
                <div class="form-group">
                    <label for="username">Usuario:</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Contraseña:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="btn">Iniciar Sesión</button>
            </form>
            <div class="link">
                <a href="/">Volver al inicio</a>
            </div>
        </div>
        
        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem('user', JSON.stringify(data.user));
                        localStorage.setItem('token', data.token);
                        alert('¡Login exitoso!');
                        window.location.href = '/';
                    } else {
                        alert('Credenciales incorrectas');
                    }
                } catch (error) {
                    alert('Error de conexión');
                }
            });
        </script>
    </body>
    </html>
  `);
});

app.get('/guide/:id', (req, res) => {
  const guideId = req.params.id;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Guía ${guideId} - Archivo de Guías</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { background: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .comments-section { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .comment { border-bottom: 1px solid #eee; padding: 1rem 0; }
            .comment:last-child { border-bottom: none; }
            .comment-author { font-weight: bold; color: #2563eb; }
            .comment-content { margin-top: 0.5rem; }
            .comment-date { font-size: 0.8rem; color: #6b7280; margin-top: 0.5rem; }
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
            textarea { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
            .btn { padding: 0.75rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; }
            .btn:hover { background: #1d4ed8; }
            .back-link { display: inline-block; margin-bottom: 1rem; color: #2563eb; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <a href="/" class="back-link">← Volver al inicio</a>
            
            <div class="header">
                <h1>Guía ${guideId}</h1>
                <p>Contenido de la guía ${guideId}</p>
            </div>
            
            <div class="comments-section">
                <h3>Comentarios</h3>
                <div id="commentsList"></div>
                
                <form id="commentForm">
                    <div class="form-group">
                        <label for="commentContent">Agregar comentario:</label>
                        <textarea id="commentContent" rows="3" required></textarea>
                    </div>
                    <button type="submit" class="btn">Enviar Comentario</button>
                </form>
            </div>
        </div>
        
        <script>
            const guideId = ${guideId};
            
            async function loadComments() {
                try {
                    const response = await fetch('/api/comments/' + guideId);
                    const comments = await response.json();
                    const container = document.getElementById('commentsList');
                    
                    container.innerHTML = comments.length ? 
                        comments.map(comment => 
                            '<div class="comment">' +
                            '<div class="comment-author">' + comment.username + '</div>' +
                            '<div class="comment-content">' + comment.content + '</div>' +
                            '<div class="comment-date">' + new Date(comment.created_at).toLocaleString() + '</div>' +
                            '</div>'
                        ).join('') : 
                        '<p>No hay comentarios aún.</p>';
                } catch (error) {
                    console.error('Error loading comments:', error);
                }
            }
            
            document.getElementById('commentForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const content = document.getElementById('commentContent').value;
                const user = JSON.parse(localStorage.getItem('user') || '{"username": "Anónimo"}');
                
                try {
                    const response = await fetch('/api/comments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            guideId: guideId, 
                            content: content, 
                            username: user.username 
                        })
                    });
                    
                    if (response.ok) {
                        document.getElementById('commentContent').value = '';
                        loadComments();
                    }
                } catch (error) {
                    alert('Error al enviar comentario');
                }
            });
            
            loadComments();
        </script>
    </body>
    </html>
  `);
});

app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin - Archivo de Guías</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { background: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
            .admin-section { background: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .back-link { display: inline-block; margin-bottom: 1rem; color: #2563eb; text-decoration: none; }
            .btn { padding: 0.75rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }
        </style>
    </head>
    <body>
        <div class="container">
            <a href="/" class="back-link">← Volver al inicio</a>
            
            <div class="header">
                <h1>🔧 Panel de Administración</h1>
                <p>Gestiona las guías y contenido de la plataforma</p>
            </div>
            
            <div class="admin-section">
                <h3>Funciones disponibles:</h3>
                <ul>
                    <li>✅ Sistema de autenticación funcionando</li>
                    <li>✅ Gestión de guías (7 guías disponibles)</li>
                    <li>✅ Sistema de comentarios</li>
                    <li>⚠️ Carga de archivos (en desarrollo)</li>
                </ul>
                
                <p><strong>Credenciales de prueba:</strong></p>
                <p>Usuario: admin | Contraseña: admin123</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;