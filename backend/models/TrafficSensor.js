const mongoose = require('mongoose');

const trafficSensorSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: [true, 'El identificador del sensor es obligatorio'],
    unique: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'El nombre del sensor es obligatorio'],
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coords) =>
          Array.isArray(coords) &&
          coords.length === 2 &&
          coords.every((n) => typeof n === 'number' && Number.isFinite(n)),
        message: 'Las coordenadas deben ser [longitud, latitud] numéricas'
      }
    }
  },
  intensity: {
    type: Number
  },
  occupancy: {
    type: Number
  },
  load: {
    type: Number
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índice geoespacial obligatorio para consultas $near / $geoWithin
trafficSensorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('TrafficSensor', trafficSensorSchema);
