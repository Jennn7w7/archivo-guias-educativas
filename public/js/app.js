// Configuración global
const API_BASE = '/api';
let currentUser = null;
let socket = null;

// Elementos del DOM
const elements = {
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    userMenu: document.getElementById('user-menu'),
    authMenu: document.getElementById('auth-menu'),
    usernameDisplay: document.getElementById('username-display'),
    totalGuides: document.getElementById('total-guides'),
    guidesGrid: document.querySelector('.guides-grid'),
    
    // Modales
    loginModal: document.getElementById('login-modal'),
    registerModal: document.getElementById('register-modal'),
    guideModal: document.getElementById('guide-modal'),
    
    // Formularios
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    commentForm: document.getElementById('comment-form'),
    
    // Links
    showRegister: document.getElementById('show-register'),
    showLogin: document.getElementById('show-login'),
    
    // Contenedores
    commentsContainer: document.getElementById('comments-container'),
    commentFormContainer: document.getElementById('comment-form-container'),
    loginToComment: document.getElementById('login-to-comment')
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadGuides();
});

// Configurar Socket.IO
function initializeSocket() {
    socket = io();
    
    socket.on('comment-added', (data) => {
        if (isGuideModalOpen() && getCurrentGuideId() == data.guideId) {
            addCommentToUI(data);
        }
    });
}

// Inicializar aplicación
async function initializeApp() {
    await checkAuthStatus();
    initializeSocket();
}

// Verificar estado de autenticación
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
            setCurrentUser(data.user);
        } else {
            localStorage.removeItem('token');
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        localStorage.removeItem('token');
    }
}

// Establecer usuario actual
function setCurrentUser(user) {
    currentUser = user;
    updateUIForUser();
}

// Actualizar UI según el usuario
function updateUIForUser() {
    if (currentUser) {
        elements.userMenu.style.display = 'flex';
        elements.authMenu.style.display = 'none';
        elements.usernameDisplay.textContent = currentUser.username;
        
        // Agregar enlace de admin si es administrador
        if (currentUser.role === 'admin') {
            addAdminLink();
        }
    } else {
        elements.userMenu.style.display = 'none';
        elements.authMenu.style.display = 'flex';
    }
}

// Agregar enlace de administración
function addAdminLink() {
    const existingLink = document.getElementById('admin-link');
    if (existingLink) return;

    const adminLink = document.createElement('a');
    adminLink.href = '/admin';
    adminLink.id = 'admin-link';
    adminLink.className = 'btn btn-outline';
    adminLink.innerHTML = '<i class="fas fa-cog"></i> Panel Admin';
    
    elements.userMenu.insertBefore(adminLink, elements.logoutBtn);
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    elements.loginBtn?.addEventListener('click', () => openModal('login'));
    elements.logoutBtn?.addEventListener('click', logout);
    elements.showRegister?.addEventListener('click', () => switchModal('register'));
    elements.showLogin?.addEventListener('click', () => switchModal('login'));

    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });

    // Formularios
    elements.loginForm?.addEventListener('submit', handleLogin);
    elements.registerForm?.addEventListener('submit', handleRegister);
    elements.commentForm?.addEventListener('submit', handleCommentSubmit);

    // Links de login en comentarios
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('login-link')) {
            e.preventDefault();
            closeModals();
            openModal('login');
        }
    });
}

// Cargar guías
async function loadGuides() {
    try {
        const headers = {};
        if (currentUser) {
            headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }

        const response = await fetch(`${API_BASE}/guides`, { headers });
        
        if (!response.ok) {
            throw new Error('Error al cargar guías');
        }

        const data = await response.json();
        displayGuides(data.guides);
        updateStats(data.totalGuides);
        
    } catch (error) {
        console.error('Error al cargar guías:', error);
        showAlert('Error al cargar las guías', 'error');
    }
}

// Mostrar guías en la UI
function displayGuides(guidesGrouped) {
    if (!elements.guidesGrid) return;

    elements.guidesGrid.innerHTML = '';

    const chapterTitles = {
        1: 'Guía 1',
        2: 'Guía 2',
        3: 'Guía 3',
        4: 'Guía 4',
        5: 'Guía 5',
        6: 'Guía 6',
        7: 'Guía 7'
    };

    for (let i = 1; i <= 7; i++) {
        const guides = guidesGrouped[i] || [];
        const chapterDiv = createChapterCard(i, chapterTitles[i], guides);
        elements.guidesGrid.appendChild(chapterDiv);
    }
}

// Crear card de capítulo
function createChapterCard(number, title, guides) {
    const div = document.createElement('div');
    div.className = 'guide-chapter';
    
    div.innerHTML = `
        <div class="chapter-header">
            <div class="chapter-number">${number}</div>
            <div class="chapter-title">
                <h4>${title}</h4>
                <div class="chapter-subtitle">${guides.length} guía${guides.length !== 1 ? 's' : ''} disponible${guides.length !== 1 ? 's' : ''}</div>
            </div>
        </div>
        <div class="guides-list">
            ${guides.length > 0 ? guides.map(guide => createGuideItem(guide)).join('') : '<div class="no-guides">No hay guías disponibles aún</div>'}
        </div>
    `;
    
    return div;
}

// Crear item de guía
function createGuideItem(guide) {
    const fileSize = formatFileSize(guide.file_size);
    const uploadDate = new Date(guide.created_at).toLocaleDateString('es-ES');
    
    return `
        <div class="guide-item" onclick="openGuideModal(${guide.id})">
            <div class="guide-title">${escapeHtml(guide.title)}</div>
            <div class="guide-meta">
                <span>Subido: ${uploadDate}</span>
                <span class="guide-size">
                    <i class="fas fa-file-excel"></i> ${fileSize}
                </span>
            </div>
        </div>
    `;
}

// Formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Abrir modal de guía
async function openGuideModal(guideId) {
    try {
        const headers = {};
        if (currentUser) {
            headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }

        // Cargar detalles de la guía
        const response = await fetch(`${API_BASE}/guides/${guideId}`, { headers });
        
        if (!response.ok) {
            throw new Error('Error al cargar la guía');
        }

        const guide = await response.json();
        
        // Mostrar detalles de la guía
        document.getElementById('guide-modal-title').textContent = guide.title;
        document.getElementById('guide-details').innerHTML = createGuideDetails(guide);
        
        // Cargar comentarios
        await loadComments(guideId);
        
        // Configurar formulario de comentarios
        setupCommentForm(guideId);
        
        // Unirse a la sala de Socket.IO
        if (socket) {
            socket.emit('join-guide', guideId);
        }
        
        elements.guideModal.style.display = 'block';
        
    } catch (error) {
        console.error('Error al cargar guía:', error);
        showAlert('Error al cargar la guía', 'error');
    }
}

// Crear detalles de la guía
function createGuideDetails(guide) {
    const uploadDate = new Date(guide.created_at).toLocaleDateString('es-ES');
    const fileSize = formatFileSize(guide.file_size);
    
    return `
        <div class="guide-info">
            <h5>${escapeHtml(guide.title)}</h5>
            ${guide.description ? `<p class="guide-description">${escapeHtml(guide.description)}</p>` : ''}
            <div class="guide-meta mb-2">
                <p><strong>Capítulo:</strong> ${guide.guide_number}</p>
                <p><strong>Subido por:</strong> ${escapeHtml(guide.uploaded_by_name || 'Administrador')}</p>
                <p><strong>Fecha:</strong> ${uploadDate}</p>
                <p><strong>Tamaño:</strong> ${fileSize}</p>
            </div>
            <div class="guide-actions">
                <a href="${API_BASE}/guides/${guide.id}/download" class="btn btn-primary" target="_blank">
                    <i class="fas fa-download"></i> Descargar Excel
                </a>
                <button onclick="copyGuideLink(${guide.id})" class="btn btn-outline">
                    <i class="fas fa-share"></i> Compartir
                </button>
            </div>
        </div>
    `;
}

// Cargar comentarios
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
        elements.commentsContainer.innerHTML = '<p class="text-error">Error al cargar comentarios</p>';
    }
}

// Mostrar comentarios
function displayComments(comments) {
    if (comments.length === 0) {
        elements.commentsContainer.innerHTML = '<p class="text-center text-light">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
        return;
    }

    elements.commentsContainer.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');
}

// Crear HTML de comentario
function createCommentHTML(comment) {
    const date = new Date(comment.created_at).toLocaleString('es-ES');
    const canDelete = currentUser && (currentUser.id === comment.user_id || currentUser.role === 'admin');
    
    return `
        <div class="comment" data-comment-id="${comment.id}">
            <div class="comment-header">
                <span class="comment-author">${escapeHtml(comment.username)}</span>
                <div>
                    <span class="comment-date">${date}</span>
                    ${canDelete ? `<button onclick="deleteComment(${comment.id})" class="btn btn-danger" style="margin-left: 8px; padding: 4px 8px; font-size: 12px;"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </div>
            <div class="comment-text">${escapeHtml(comment.comment)}</div>
        </div>
    `;
}

// Configurar formulario de comentarios
function setupCommentForm(guideId) {
    const commentForm = elements.commentForm;
    const commentFormContainer = elements.commentFormContainer;
    const loginToComment = elements.loginToComment;
    
    // Limpiar formulario
    if (commentForm) {
        commentForm.reset();
        commentForm.dataset.guideId = guideId;
    }
    
    if (currentUser) {
        commentFormContainer.style.display = 'block';
        loginToComment.style.display = 'none';
    } else {
        commentFormContainer.style.display = 'none';
        loginToComment.style.display = 'block';
    }
}

// Manejar envío de comentario
async function handleCommentSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showAlert('Debes iniciar sesión para comentar', 'error');
        return;
    }

    const form = e.target;
    const guideId = form.dataset.guideId;
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
        
        // Limpiar formulario
        form.reset();
        
        // Agregar comentario a la UI
        addCommentToUI(data.comment);
        
        // Emitir evento de Socket.IO
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
}

// Agregar comentario a la UI
function addCommentToUI(comment) {
    const container = elements.commentsContainer;
    
    // Si no hay comentarios, limpiar mensaje de "no hay comentarios"
    if (container.innerHTML.includes('No hay comentarios aún')) {
        container.innerHTML = '';
    }
    
    const commentHTML = createCommentHTML(comment);
    container.insertAdjacentHTML('beforeend', commentHTML);
    
    // Scroll al nuevo comentario
    const newComment = container.lastElementChild;
    newComment.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Eliminar comentario
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

        // Remover comentario de la UI
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

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error en el login');
        }

        localStorage.setItem('token', data.token);
        setCurrentUser(data.user);
        closeModals();
        showAlert(`¡Bienvenido, ${data.user.username}!`, 'success');
        
        // Recargar guías para mostrar funcionalidades de usuario autenticado
        loadGuides();

    } catch (error) {
        console.error('Error en login:', error);
        showAlert(error.message, 'error');
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error en el registro');
        }

        localStorage.setItem('token', data.token);
        setCurrentUser(data.user);
        closeModals();
        showAlert(`¡Cuenta creada exitosamente! Bienvenido, ${data.user.username}!`, 'success');
        
        // Recargar guías
        loadGuides();

    } catch (error) {
        console.error('Error en registro:', error);
        showAlert(error.message, 'error');
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateUIForUser();
    closeModals();
    showAlert('Sesión cerrada exitosamente', 'success');
    
    // Recargar guías
    loadGuides();
}

// Utilidades de modal
function openModal(modalType) {
    closeModals();
    const modal = modalType === 'login' ? elements.loginModal : elements.registerModal;
    if (modal) {
        modal.style.display = 'block';
    }
}

function switchModal(modalType) {
    openModal(modalType);
}

function closeModals() {
    [elements.loginModal, elements.registerModal, elements.guideModal].forEach(modal => {
        if (modal) {
            modal.style.display = 'none';
        }
    });
}

function isGuideModalOpen() {
    return elements.guideModal && elements.guideModal.style.display === 'block';
}

function getCurrentGuideId() {
    const form = elements.commentForm;
    return form ? form.dataset.guideId : null;
}

// Copiar enlace de guía
function copyGuideLink(guideId) {
    const url = `${window.location.origin}/guide/${guideId}`;
    navigator.clipboard.writeText(url).then(() => {
        showAlert('Enlace copiado al portapapeles', 'success');
    }).catch(() => {
        showAlert('No se pudo copiar el enlace', 'error');
    });
}

// Actualizar estadísticas
function updateStats(totalGuides) {
    if (elements.totalGuides) {
        elements.totalGuides.textContent = totalGuides;
    }
}

// Mostrar alertas
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insertar en la parte superior del body
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Escape HTML para prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Funciones globales para ser llamadas desde HTML
window.openGuideModal = openGuideModal;
window.deleteComment = deleteComment;
window.copyGuideLink = copyGuideLink;