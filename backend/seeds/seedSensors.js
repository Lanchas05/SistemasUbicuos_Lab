const mongoose = require('mongoose');
const connectDB = require('../config/db');
const TrafficSensor = require('../models/TrafficSensor');

const SOURCE_COLLECTION = 'Anthem_CTC_PuntoMedidaTrafico';
const BATCH_SIZE = 1000;

/**
 * Convierte un valor a número finito o devuelve null.
 */
const toFiniteNumber = (value) => {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
};

/**
 * Lee los puntos de medida de tráfico de Madrid desde Atlas y los
 * inserta/actualiza en la colección `trafficsensors` de forma idempotente.
 */
const seedSensors = async () => {
  await connectDB();

  const db = mongoose.connection.db;
  const source = db.collection(SOURCE_COLLECTION);

  const sourceCount = await source.countDocuments();
  console.log(`📥 Documentos en ${SOURCE_COLLECTION}: ${sourceCount}`);

  // Asegurar colección e índices (incluido el 2dsphere)
  await TrafficSensor.syncIndexes();
  console.log('🧭 Índices de TrafficSensor sincronizados');

  const cursor = source.find(
    {},
    { projection: { _id: 0, id: 1, nombre: 1, distrito: 1, longitud: 1, latitud: 1 } }
  );

  let batch = [];
  let read = 0;
  let skipped = 0;
  let inserted = 0;
  let updated = 0;

  const flushBatch = async () => {
    if (batch.length === 0) {
      return;
    }

    const operations = batch.map((doc) => ({
      updateOne: {
        filter: { sensorId: doc.sensorId },
        update: { $set: { ...doc, updatedAt: new Date() } },
        upsert: true
      }
    }));

    const result = await TrafficSensor.bulkWrite(operations, { ordered: false });
    inserted += result.upsertedCount;
    updated += result.modifiedCount;

    batch = [];
  };

  for await (const raw of cursor) {
    read += 1;

    const sensorId = raw.id !== undefined && raw.id !== null ? String(raw.id).trim() : '';
    const longitude = toFiniteNumber(raw.longitud);
    const latitude = toFiniteNumber(raw.latitud);

    const validId = sensorId.length > 0;
    const validCoords =
      longitude !== null &&
      latitude !== null &&
      longitude >= -180 &&
      longitude <= 180 &&
      latitude >= -90 &&
      latitude <= 90;

    if (!validId || !validCoords) {
      skipped += 1;
      continue;
    }

    batch.push({
      sensorId,
      name:
        raw.nombre !== undefined && raw.nombre !== null && String(raw.nombre).trim() !== ''
          ? String(raw.nombre).trim()
          : `Sensor ${sensorId}`,
      district:
        raw.distrito !== undefined && raw.distrito !== null ? String(raw.distrito).trim() : undefined,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();

      if (read % 10000 === 0) {
        console.log(`   ... procesados ${read} (insertados: ${inserted}, actualizados: ${updated})`);
      }
    }
  }

  await flushBatch();

  const finalCount = await TrafficSensor.countDocuments();
  const indexes = await TrafficSensor.collection.indexes();

  console.log('\n===== RESUMEN DEL SEEDING =====');
  console.log(`Leídos:              ${read}`);
  console.log(`Descartados (invál.): ${skipped}`);
  console.log(`Insertados:          ${inserted}`);
  console.log(`Actualizados:        ${updated}`);
  console.log(`Total en trafficsensors: ${finalCount}`);
  console.log(`Índices:             ${indexes.map((i) => i.name).join(', ')}`);

  await mongoose.connection.close();
  console.log('🔒 Conexión cerrada correctamente');
};

seedSensors().catch(async (error) => {
  console.error('❌ Error en el seeding de sensores:', error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
