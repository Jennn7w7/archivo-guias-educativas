// Página individual de guía
const API_BASE = '/api';
let currentUser = null;
let socket = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

async function initializePage() {
    await checkAuthStatus();
    initializeSocket();
    await loadGuide();
}

function initializeSocket() {
    socket = io();
    
    socket.on('comment-added', (data) => {
        if (getCurrentGuideId() == data.guideId) {
            addCommentToUI(data);
        }
    });
}

async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
        } else {
            localStorage.removeItem('token');
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
    }
}

async function loadGuide() {
    const guideId = getGuideIdFromUrl();
    if (!guideId) {
        showError('ID de guía no válido');
        return;
    }

    try {
        const headers = {};
        if (currentUser) {
            headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }

        const response = await fetch(`${API_BASE}/guides/${guideId}`, { headers });
        
        if (!response.ok) {
            throw new Error('Guía no encontrada');
        }

        const guide = await response.json();
        displayGuide(guide);
        await loadComments(guideId);
        
        if (socket) {
            socket.emit('join-guide', guideId);
        }
        
    } catch (error) {
        console.error('Error al cargar guía:', error);
        showError('Error al cargar la guía');
    }
}

function getGuideIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/guide\/(\d+)/);
    return match ? match[1] : null;
}

function displayGuide(guide) {
    const container = document.getElementById('guide-content');
    const chapterTitles = {
        1: 'Guía 1',
        2: 'Guía 2',
        3: 'Guía 3',
        4: 'Guía 4',
        5: 'Guía 5',
        6: 'Guía 6',
        7: 'Guía 7'
    };
    
    container.innerHTML = `
        <div class="guide-header">
            <div class="guide-breadcrumb">
                <a href="/">Inicio</a> / 
                <span>${chapterTitles[guide.guide_number]}</span>
            </div>
            <h1>${escapeHtml(guide.title)}</h1>
            ${guide.description ? `<p class="guide-description">${escapeHtml(guide.description)}</p>` : ''}
            
            <div class="guide-meta">
                <div class="meta-item">
                    <i class="fas fa-book"></i>
                    <span>Guía ${guide.guide_number}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-user"></i>
                    <span>${escapeHtml(guide.uploaded_by_name || 'Administrador')}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>${new Date(guide.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-file-excel"></i>
                    <span>${formatFileSize(guide.file_size)}</span>
                </div>
            </div>
            
            <div class="guide-actions">
                <a href="${API_BASE}/guides/${guide.id}/download" class="btn btn-primary btn-large" target="_blank">
                    <i class="fas fa-download"></i> Descargar Excel
                </a>
                <button onclick="shareGuide()" class="btn btn-outline">
                    <i class="fas fa-share"></i> Compartir
                </button>
            </div>
        </div>
        
        <div class="comments-section">
            <h3>Comentarios</h3>
            <div id="comments-container"></div>
            
            ${currentUser ? `
                <div class="comment-form-container">
                    <form id="comment-form">
                        <div class="form-group">
                            <textarea id="comment-text" placeholder="Escribe tu comentario..." rows="3" maxlength="1000"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Enviar Comentario</button>
                    </form>
                </div>
            ` : `
                <div class="login-prompt">
                    <p>Debes <a href="/" class="login-link">iniciar sesión</a> para comentar</p>
                </div>
            `}
        </div>
    `;
    
    // Configurar formulario de comentarios
    if (currentUser) {
        setupCommentForm(guide.id);
    }
    
    // Configurar enlaces de login
    document.querySelectorAll('.login-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/';
        });
    });
}

async function loadComments(guideId) {
    try {
        const headers = {};
        if (currentUser) {
            headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }

        const response = await fetch(`${API_BASE}/comments/guide/${guideId}`, { headers });
        
        if (!response.ok) {
            throw new Error('Error al cargar comentarios');
        }

        const data = await response.json();
        displayComments(data.comments);
        
    } catch (error) {
        console.error('Error al cargar comentarios:', error);
        document.getElementById('comments-container').innerHTML = '<p class="text-error">Error al cargar comentarios</p>';
    }
}

function displayComments(comments) {
    const container = document.getElementById('comments-container');
    
    if (comments.length === 0) {
        container.innerHTML = '<p class="no-comments">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
        return;
    }

    container.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');
}

function createCommentHTML(comment) {
    const date = new Date(comment.created_at).toLocaleString('es-ES');
    const canDelete = currentUser && (currentUser.id === comment.user_id || currentUser.role === 'admin');
    
    return `
        <div class="comment" data-comment-id="${comment.id}">
            <div class="comment-header">
                <span class="comment-author">${escapeHtml(comment.username)}</span>
                <div>
                    <span class="comment-date">${date}</span>
                    ${canDelete ? `<button onclick="deleteComment(${comment.id})" class="btn btn-danger btn-small"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </div>
            <div class="comment-text">${escapeHtml(comment.comment)}</div>
        </div>
    `;
}

function setupCommentForm(guideId) {
    const form = document.getElementById('comment-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const commentText = document.getElementById('comment-text').value.trim();
        
        if (!commentText) {
            showAlert('El comentario no puede estar vacío', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/comments/guide/${guideId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ comment: commentText })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al enviar comentario');
            }

            const data = await response.json();
            
            form.reset();
            addCommentToUI(data.comment);
            
            if (socket) {
                socket.emit('new-comment', {
                    guideId: parseInt(guideId),
                    comment: data.comment
                });
            }
            
            showAlert('Comentario enviado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al enviar comentario:', error);
            showAlert(error.message, 'error');
        }
    });
}

function addCommentToUI(comment) {
    const container = document.getElementById('comments-container');
    
    if (container.innerHTML.includes('No hay comentarios aún')) {
        container.innerHTML = '';
    }
    
    const commentHTML = createCommentHTML(comment);
    container.insertAdjacentHTML('beforeend', commentHTML);
    
    const newComment = container.lastElementChild;
    newComment.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function deleteComment(commentId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar comentario');
        }

        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.remove();
        }

        showAlert('Comentario eliminado exitosamente', 'success');

    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        showAlert(error.message, 'error');
    }
}

function shareGuide() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showAlert('Enlace copiado al portapapeles', 'success');
    }).catch(() => {
        showAlert('No se pudo copiar el enlace', 'error');
    });
}

function getCurrentGuideId() {
    return getGuideIdFromUrl();
}

function showError(message) {
    document.getElementById('guide-content').innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>Error</h2>
            <p>${message}</p>
            <a href="/" class="btn btn-primary">Volver al Inicio</a>
        </div>
    `;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Funciones globales
window.deleteComment = deleteComment;
window.shareGuide = shareGuide;