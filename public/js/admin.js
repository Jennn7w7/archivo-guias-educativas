// Configuración global
const API_BASE = '/api';
let currentUser = null;
let currentGuideToDelete = null;

// Elementos del DOM
const elements = {
    usernameDisplay: document.getElementById('username-display'),
    userMenu: document.getElementById('user-menu'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Stats
    totalGuidesStat: document.getElementById('total-guides-stat'),
    totalCommentsStat: document.getElementById('total-comments-stat'),
    totalUsersStat: document.getElementById('total-users-stat'),
    
    // Tabs
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Upload form
    uploadForm: document.getElementById('upload-form'),
    fileUploadArea: document.getElementById('file-upload-area'),
    fileInput: document.getElementById('guide-file'),
    fileInfo: document.getElementById('file-info'),
    
    // Manage guides
    refreshGuidesBtn: document.getElementById('refresh-guides'),
    guidesTableBody: document.getElementById('guides-table-body'),
    
    // Analytics
    chapterStats: document.getElementById('chapter-stats'),
    recentActivity: document.getElementById('recent-activity'),
    
    // Modal
    deleteModal: document.getElementById('delete-modal'),
    confirmDeleteBtn: document.getElementById('confirm-delete'),
    guideToDelete: document.getElementById('guide-to-delete')
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Inicializar aplicación
async function initializeApp() {
    await checkAuthStatus();
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '/';
        return;
    }
    
    await loadDashboardData();
}

// Verificar estado de autenticación
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

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
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

// Establecer usuario actual
function setCurrentUser(user) {
    currentUser = user;
    if (elements.usernameDisplay) {
        elements.usernameDisplay.textContent = user.username;
        elements.userMenu.style.display = 'flex';
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Logout
    elements.logoutBtn?.addEventListener('click', logout);
    
    // Tabs
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Upload form
    elements.uploadForm?.addEventListener('submit', handleUpload);
    
    // File upload area
    setupFileUpload();
    
    // Refresh guides
    elements.refreshGuidesBtn?.addEventListener('click', loadGuides);
    
    // Modal
    elements.confirmDeleteBtn?.addEventListener('click', confirmDelete);
    
    // Close modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Configurar file upload con drag & drop
function setupFileUpload() {
    if (!elements.fileUploadArea || !elements.fileInput) return;
    
    // Drag & drop events
    elements.fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.fileUploadArea.classList.add('dragover');
    });
    
    elements.fileUploadArea.addEventListener('dragleave', () => {
        elements.fileUploadArea.classList.remove('dragover');
    });
    
    elements.fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            elements.fileInput.files = files;
            handleFileSelect();
        }
    });
    
    // File input change
    elements.fileInput.addEventListener('change', handleFileSelect);
}

// Manejar selección de archivo
function handleFileSelect() {
    const file = elements.fileInput.files[0];
    if (!file) {
        elements.fileInfo.style.display = 'none';
        return;
    }
    
    // Validar tipo de archivo
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type)) {
        showAlert('Solo se permiten archivos Excel (.xlsx, .xls)', 'error');
        elements.fileInput.value = '';
        elements.fileInfo.style.display = 'none';
        return;
    }
    
    // Validar tamaño
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showAlert('El archivo no puede exceder 10MB', 'error');
        elements.fileInput.value = '';
        elements.fileInfo.style.display = 'none';
        return;
    }
    
    // Mostrar información del archivo
    elements.fileInfo.innerHTML = `
        <i class="fas fa-file-excel"></i>
        <div>
            <div><strong>${file.name}</strong></div>
            <div class="text-light">${formatFileSize(file.size)}</div>
        </div>
    `;
    elements.fileInfo.style.display = 'flex';
}

// Cambiar tab
function switchTab(tabName) {
    // Actualizar botones
    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Actualizar contenido
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Cargar datos específicos del tab
    if (tabName === 'manage') {
        loadGuides();
    } else if (tabName === 'analytics') {
        loadAnalytics();
    }
}

// Cargar datos del dashboard
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadGuides(),
        loadAnalytics()
    ]);
}

// Cargar estadísticas
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        
        const stats = await response.json();
        
        if (elements.totalGuidesStat) {
            elements.totalGuidesStat.textContent = stats.totalGuides;
        }
        
        // Simular otras estadísticas (en una app real, estas vendrían del backend)
        if (elements.totalCommentsStat) {
            elements.totalCommentsStat.textContent = Math.floor(stats.totalGuides * 2.5);
        }
        if (elements.totalUsersStat) {
            elements.totalUsersStat.textContent = Math.floor(stats.totalGuides * 0.8) + 2;
        }
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Cargar guías
async function loadGuides() {
    if (!elements.guidesTableBody) return;
    
    try {
        elements.guidesTableBody.innerHTML = '<tr><td colspan="6" class="loading-row">Cargando guías...</td></tr>';
        
        const response = await fetch(`${API_BASE}/admin/guides`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar guías');
        
        const data = await response.json();
        displayGuides(data.guides);
        
    } catch (error) {
        console.error('Error al cargar guías:', error);
        elements.guidesTableBody.innerHTML = '<tr><td colspan="6" class="text-error">Error al cargar guías</td></tr>';
    }
}

// Mostrar guías en la tabla
function displayGuides(guides) {
    if (!elements.guidesTableBody) return;
    
    if (guides.length === 0) {
        elements.guidesTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No hay guías disponibles</p>
                </td>
            </tr>
        `;
        return;
    }
    
    elements.guidesTableBody.innerHTML = guides.map(guide => `
        <tr>
            <td>${guide.id}</td>
            <td>${escapeHtml(guide.title)}</td>
            <td><span class="chapter-badge">Guía ${guide.guide_number}</span></td>
            <td>${formatFileSize(guide.file_size)}</td>
            <td>${new Date(guide.created_at).toLocaleDateString('es-ES')}</td>
            <td>
                <div class="table-actions">
                    <a href="${API_BASE}/guides/${guide.id}/download" target="_blank" class="btn btn-outline btn-table">
                        <i class="fas fa-download"></i>
                    </a>
                    <button onclick="deleteGuide(${guide.id}, '${escapeHtml(guide.title)}')" class="btn btn-danger btn-table">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Cargar analíticas
async function loadAnalytics() {
    if (!elements.chapterStats) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar analíticas');
        
        const stats = await response.json();
        displayChapterStats(stats.guidesByNumber);
        displayRecentActivity();
        
    } catch (error) {
        console.error('Error al cargar analíticas:', error);
    }
}

// Mostrar estadísticas por capítulo
function displayChapterStats(guidesByNumber) {
    const chapterTitles = {
        1: 'Guía 1',
        2: 'Guía 2',
        3: 'Guía 3',
        4: 'Guía 4',
        5: 'Guía 5',
        6: 'Guía 6',
        7: 'Guía 7'
    };
    
    elements.chapterStats.innerHTML = Object.keys(chapterTitles).map(chapter => `
        <div class="chapter-stat-item">
            <span class="chapter-stat-name">${chapterTitles[chapter]}</span>
            <span class="chapter-stat-count">${guidesByNumber[chapter] || 0}</span>
        </div>
    `).join('');
}

// Mostrar actividad reciente (simulada)
function displayRecentActivity() {
    const activities = [
        { type: 'upload', title: 'Nueva guía subida', time: 'Hace 2 horas' },
        { type: 'comment', title: 'Nuevo comentario recibido', time: 'Hace 4 horas' },
        { type: 'user', title: 'Nuevo usuario registrado', time: 'Hace 6 horas' },
        { type: 'upload', title: 'Guía actualizada', time: 'Hace 1 día' },
        { type: 'comment', title: 'Comentario eliminado', time: 'Hace 2 días' }
    ];
    
    const iconMap = {
        upload: 'fas fa-upload',
        comment: 'fas fa-comment',
        user: 'fas fa-user-plus'
    };
    
    elements.recentActivity.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${iconMap[activity.type]}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

// Manejar subida de guía
async function handleUpload(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!elements.fileInput.files[0]) {
        showAlert('Por favor selecciona un archivo Excel', 'error');
        return;
    }
    
    try {
        // Deshabilitar botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
        
        const response = await fetch(`${API_BASE}/admin/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al subir la guía');
        }
        
        showAlert('Guía subida exitosamente', 'success');
        
        // Limpiar formulario
        e.target.reset();
        elements.fileInfo.style.display = 'none';
        
        // Actualizar datos
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error al subir guía:', error);
        showAlert(error.message, 'error');
    } finally {
        // Habilitar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> Subir Guía';
    }
}

// Eliminar guía
function deleteGuide(guideId, guideTitle) {
    currentGuideToDelete = guideId;
    elements.guideToDelete.innerHTML = `<strong>"${guideTitle}"</strong>`;
    elements.deleteModal.style.display = 'block';
}

// Confirmar eliminación
async function confirmDelete() {
    if (!currentGuideToDelete) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin/guides/${currentGuideToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar la guía');
        }
        
        showAlert('Guía eliminada exitosamente', 'success');
        closeModal();
        
        // Actualizar datos
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error al eliminar guía:', error);
        showAlert(error.message, 'error');
    }
}

// Cerrar modal
function closeModal() {
    elements.deleteModal.style.display = 'none';
    currentGuideToDelete = null;
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// Formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Escape HTML para prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mostrar alertas
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
window.deleteGuide = deleteGuide;