const fs = require('fs');
const path = require('path');

class JsonDatabase {
  constructor() {
    this.dataDir = '/tmp'; // Vercel permite escritura en /tmp
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.guidesFile = path.join(this.dataDir, 'guides.json');
    this.commentsFile = path.join(this.dataDir, 'comments.json');
    
    this.initFiles();
  }

  initFiles() {
    // Crear archivos si no existen
    if (!fs.existsSync(this.usersFile)) {
      const defaultUsers = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          password: '$2a$10$8kY8Y8Y8Y8Y8Y8Y8Y8Y8YO', // admin123 hasheado
          role: 'admin',
          created_at: new Date().toISOString()
        }
      ];
      fs.writeFileSync(this.usersFile, JSON.stringify(defaultUsers, null, 2));
    }

    if (!fs.existsSync(this.guidesFile)) {
      const defaultGuides = [
        { id: 1, title: 'Guía 1', description: 'Primera guía de estudio', file_path: null, uploaded_at: new Date().toISOString() },
        { id: 2, title: 'Guía 2', description: 'Segunda guía de estudio', file_path: null, uploaded_at: new Date().toISOString() },
        { id: 3, title: 'Guía 3', description: 'Tercera guía de estudio', file_path: null, uploaded_at: new Date().toISOString() },
        { id: 4, title: 'Guía 4', description: 'Cuarta guía de estudio', file_path: null, uploaded_at: new Date().toISOString() },
        { id: 5, title: 'Guía 5', description: 'Quinta guía de estudio', file_path: null, uploaded_at: new Date().toISOString() },
        { id: 6, title: 'Guía 6', description: 'Sexta guía de estudio', file_path: null, uploaded_at: new Date().toISOString() },
        { id: 7, title: 'Guía 7', description: 'Séptima guía de estudio', file_path: null, uploaded_at: new Date().toISOString() }
      ];
      fs.writeFileSync(this.guidesFile, JSON.stringify(defaultGuides, null, 2));
    }

    if (!fs.existsSync(this.commentsFile)) {
      fs.writeFileSync(this.commentsFile, JSON.stringify([], null, 2));
    }
  }

  readFile(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return [];
    }
  }

  writeFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  // Métodos de usuarios
  createUser(username, email, hashedPassword, role = 'user') {
    return new Promise((resolve, reject) => {
      try {
        const users = this.readFile(this.usersFile);
        const newUser = {
          id: Math.max(...users.map(u => u.id), 0) + 1,
          username,
          email,
          password: hashedPassword,
          role,
          created_at: new Date().toISOString()
        };
        users.push(newUser);
        this.writeFile(this.usersFile, users);
        resolve(newUser);
      } catch (error) {
        reject(error);
      }
    });
  }

  getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      try {
        const users = this.readFile(this.usersFile);
        const user = users.find(u => u.username === username);
        resolve(user || null);
      } catch (error) {
        reject(error);
      }
    });
  }

  getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      try {
        const users = this.readFile(this.usersFile);
        const user = users.find(u => u.email === email);
        resolve(user || null);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Métodos de guías
  getAllGuides() {
    return new Promise((resolve, reject) => {
      try {
        const guides = this.readFile(this.guidesFile);
        resolve(guides);
      } catch (error) {
        reject(error);
      }
    });
  }

  getGuideById(id) {
    return new Promise((resolve, reject) => {
      try {
        const guides = this.readFile(this.guidesFile);
        const guide = guides.find(g => g.id === parseInt(id));
        resolve(guide || null);
      } catch (error) {
        reject(error);
      }
    });
  }

  updateGuide(id, title, description, filePath) {
    return new Promise((resolve, reject) => {
      try {
        const guides = this.readFile(this.guidesFile);
        const index = guides.findIndex(g => g.id === parseInt(id));
        if (index !== -1) {
          guides[index] = { ...guides[index], title, description, file_path: filePath, uploaded_at: new Date().toISOString() };
          this.writeFile(this.guidesFile, guides);
          resolve(guides[index]);
        } else {
          reject(new Error('Guía no encontrada'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // Métodos de comentarios
  addComment(guideId, username, content) {
    return new Promise((resolve, reject) => {
      try {
        const comments = this.readFile(this.commentsFile);
        const newComment = {
          id: Math.max(...comments.map(c => c.id), 0) + 1,
          guide_id: parseInt(guideId),
          username,
          content,
          created_at: new Date().toISOString()
        };
        comments.push(newComment);
        this.writeFile(this.commentsFile, comments);
        resolve(newComment);
      } catch (error) {
        reject(error);
      }
    });
  }

  getCommentsByGuideId(guideId) {
    return new Promise((resolve, reject) => {
      try {
        const comments = this.readFile(this.commentsFile);
        const guideComments = comments.filter(c => c.guide_id === parseInt(guideId));
        resolve(guideComments);
      } catch (error) {
        reject(error);
      }
    });
  }

  close() {
    // No necesario para archivos JSON
    return Promise.resolve();
  }
}

module.exports = new JsonDatabase();