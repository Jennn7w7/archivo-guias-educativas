const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'estadistica.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
      } else {
        console.log('✅ Conectado a la base de datos SQLite');
        this.initTables();
      }
    });
  }

  initTables() {
    // Tabla de usuarios
    this.db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de guías
    this.db.run(`CREATE TABLE IF NOT EXISTS guides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      guide_number INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users (id)
    )`);

    // Tabla de comentarios
    this.db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guide_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guide_id) REFERENCES guides (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    console.log('✅ Tablas de la base de datos inicializadas');
  }

  // Métodos para usuarios
  createUser(username, email, hashedPassword, role = 'user') {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)');
      stmt.run([username, email, hashedPassword, role], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      stmt.finalize();
    });
  }

  getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT id, username, email, role FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Métodos para guías
  createGuide(title, description, guideNumber, filename, originalName, filePath, fileSize, uploadedBy) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO guides (title, description, guide_number, filename, original_name, file_path, file_size, uploaded_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([title, description, guideNumber, filename, originalName, filePath, fileSize, uploadedBy], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      stmt.finalize();
    });
  }

  getAllGuides() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT g.*, u.username as uploaded_by_name 
        FROM guides g 
        LEFT JOIN users u ON g.uploaded_by = u.id 
        ORDER BY g.guide_number ASC, g.created_at DESC
      `, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getGuideById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT g.*, u.username as uploaded_by_name 
        FROM guides g 
        LEFT JOIN users u ON g.uploaded_by = u.id 
        WHERE g.id = ?
      `, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  getGuidesByNumber(guideNumber) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT g.*, u.username as uploaded_by_name 
        FROM guides g 
        LEFT JOIN users u ON g.uploaded_by = u.id 
        WHERE g.guide_number = ?
        ORDER BY g.created_at DESC
      `, [guideNumber], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  deleteGuide(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM guides WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Métodos para comentarios
  createComment(guideId, userId, comment) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('INSERT INTO comments (guide_id, user_id, comment) VALUES (?, ?, ?)');
      stmt.run([guideId, userId, comment], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      stmt.finalize();
    });
  }

  getCommentsByGuide(guideId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT c.*, u.username 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.guide_id = ? 
        ORDER BY c.created_at ASC
      `, [guideId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  deleteComment(id, userId) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM comments WHERE id = ? AND user_id = ?', [id, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error al cerrar la base de datos:', err.message);
      } else {
        console.log('Base de datos cerrada correctamente');
      }
    });
  }
}

module.exports = new Database();