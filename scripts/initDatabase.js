const bcrypt = require('bcryptjs');
const database = require('../database/database');

async function initDatabase() {
  try {
    console.log('🔧 Inicializando base de datos...');

    // Crear usuario administrador por defecto
    const adminEmail = 'admin@estadistica.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    try {
      await database.createUser('Admin', adminEmail, hashedPassword, 'admin');
      console.log('✅ Usuario administrador creado:');
      console.log('   Email: admin@estadistica.com');
      console.log('   Password: admin123');
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log('ℹ️  Usuario administrador ya existe');
      } else {
        throw error;
      }
    }

    // Crear usuario de ejemplo
    try {
      const userPassword = await bcrypt.hash('usuario123', 10);
      await database.createUser('UsuarioEjemplo', 'usuario@ejemplo.com', userPassword, 'user');
      console.log('✅ Usuario de ejemplo creado:');
      console.log('   Email: usuario@ejemplo.com');
      console.log('   Password: usuario123');
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log('ℹ️  Usuario de ejemplo ya existe');
      } else {
        throw error;
      }
    }

    console.log('✅ Base de datos inicializada correctamente');

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = initDatabase;