const mongoose = require('mongoose');
const path = require('path');

// Cargar variables de entorno (.env) desde la raíz de /backend
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Conecta a MongoDB Atlas usando la cadena definida en DB_URI.
 * Termina el proceso con código 1 si la conexión falla.
 */
const connectDB = async () => {
  try {
    if (!process.env.DB_URI) {
      throw new Error('DB_URI no está definida en el archivo .env');
    }

    const conn = await mongoose.connect(process.env.DB_URI);

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📦 Base de datos: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error al conectar con MongoDB Atlas: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
