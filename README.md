# Archivo de Guías - Plataforma Web

Una plataforma web moderna para compartir y gestionar un archivo organizado de guías de estudio con sistema de usuarios y comentarios en tiempo real.

## 🚀 Características

- **7 Guías Organizadas**: Organización clara numerada del 1 al 7
- **Subida de Archivos Excel**: Solo administradores pueden subir guías
- **Sistema de Usuarios**: Registro, login y roles (usuario/admin)
- **Comentarios en Tiempo Real**: Socket.IO para interacción instantánea
- **Panel de Administración**: Gestión completa de guías y estadísticas
- **Diseño Responsivo**: Hermosa interfaz que funciona en todos los dispositivos
- **Seguridad**: Autenticación JWT, validación de archivos, rate limiting

## 📋 Requisitos

- Node.js 16+ 
- npm o yarn

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd Esta
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Inicializar la base de datos**
   ```bash
   npm run init-db
   ```

4. **Iniciar el servidor**
   ```bash
   npm run dev
   # o para producción:
   npm start
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 👥 Usuarios por Defecto

### Administrador
- **Email**: `admin@estadistica.com`
- **Password**: `admin123`
- **Permisos**: Subir guías, eliminar guías, gestionar contenido

### Usuario de Ejemplo
- **Email**: `usuario@ejemplo.com`
- **Password**: `usuario123`
- **Permisos**: Ver guías, comentar, descargar archivos

## 📁 Estructura del Proyecto

```
Esta/
├── database/           # Configuración de base de datos SQLite
├── middleware/         # Middleware de autenticación
├── public/            # Archivos estáticos (CSS, JS, imágenes)
├── routes/            # Rutas de la API
├── scripts/           # Scripts de inicialización
├── uploads/           # Archivos Excel subidos
├── views/             # Páginas HTML
├── server.js          # Servidor principal
└── package.json       # Dependencias y scripts
```

## 🎯 Funcionalidades por Rol

### Visitantes (No autenticados)
- ✅ Ver todas las guías disponibles
- ✅ Descargar archivos Excel
- ✅ Ver comentarios existentes
- ❌ No pueden comentar
- ❌ No pueden subir contenido

### Usuarios Registrados
- ✅ Todo lo de visitantes +
- ✅ Escribir comentarios
- ✅ Eliminar sus propios comentarios
- ❌ No pueden subir guías

### Administradores
- ✅ Todo lo de usuarios +
- ✅ Subir nuevas guías Excel
- ✅ Eliminar cualquier guía
- ✅ Eliminar cualquier comentario
- ✅ Acceso al panel de administración
- ✅ Ver estadísticas del sistema

## 📚 Guías Disponibles

1. **Guía 1**
2. **Guía 2**
3. **Guía 3**
4. **Guía 4**
5. **Guía 5**
6. **Guía 6**
7. **Guía 7**

## 🔧 Configuración

### Variables de Entorno (Opcionales)
Puedes crear un archivo `.env` para configurar:

```env
PORT=3000
JWT_SECRET=tu-secreto-jwt-aqui
SESSION_SECRET=tu-secreto-sesion-aqui
```

### Configuración de Archivos
- **Tipos permitidos**: `.xlsx`, `.xls`
- **Tamaño máximo**: 10MB
- **Almacenamiento**: Carpeta `/uploads`

## 🚀 Despliegue en Producción

1. **Instalar dependencias de producción**
   ```bash
   npm ci --only=production
   ```

2. **Configurar variables de entorno**
   ```bash
   export NODE_ENV=production
   export PORT=80
   export JWT_SECRET=tu-secreto-super-seguro
   ```

3. **Inicializar base de datos**
   ```bash
   npm run init-db
   ```

4. **Iniciar servidor**
   ```bash
   npm start
   ```

## 🔒 Seguridad

- Autenticación JWT con expiración
- Validación de tipos de archivo
- Rate limiting para prevenir ataques
- Sanitización de HTML para prevenir XSS
- Helmet.js para headers de seguridad
- Validación de entrada en backend

## 🐛 Solución de Problemas

### Error de Base de Datos
```bash
# Reinicializar la base de datos
npm run init-db
```

### Error de Permisos de Archivos
```bash
# En Linux/Mac, dar permisos a la carpeta uploads
chmod 755 uploads/
```

### Puerto en Uso
```bash
# Cambiar el puerto en server.js o usar variable de entorno
export PORT=3001
```

## 📞 Soporte

Si encuentras algún problema:

1. Verifica que Node.js esté instalado (`node --version`)
2. Asegúrate de que todas las dependencias estén instaladas (`npm install`)
3. Revisa que el puerto 3000 esté disponible
4. Consulta los logs del servidor para errores específicos

## 🎨 Personalización

### Cambiar Colores
Edita las variables CSS en `/public/css/styles.css`:
```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #f8fafc;
    /* ... más colores */
}
```

### Agregar Más Guías
1. Actualiza los arrays en `/public/js/app.js` y `/public/js/admin.js`
2. Modifica la validación en `/routes/admin.js`

## 📄 Licencia

MIT License - Creado por Jennifer Gómez y David Salinas.

---

**Integrantes del Proyecto:**
- Jennifer Gómez
- David Salinas

¡Disfruta usando la plataforma de Archivo de Guías! 📚✨