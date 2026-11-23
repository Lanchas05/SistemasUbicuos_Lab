# Plan de Ejecución de Código: Fase 1 — Persistencia y Modelos (VialSafe)

## 1. Rol y Contexto del Proyecto
- **Proyecto:** VialSafe (Aplicación Full Stack sensible al contexto para seguridad vial en Madrid).
- **Stack Obligatorio:** MongoDB Atlas (Mongoose), Express.js, React.js, Node.js (Pila MERN).
- **Responsable de este plan:** Carlos.
- **Límite de alcance (CRÍTICO):** Trabajar únicamente en `/backend` para los modelos `User.js`, `TrafficSensor.js` (o `RiskZone.js`), la conexión a Atlas y el script de ingesta de sensores. **NO crear ni modificar** `Accident.js` ni `Fine.js` (asignados a Alex).

---

## 2. Checklist de Tareas y Estado (Memoria Persistente)
Actualiza este bloque marcando con `[x]` cada paso completado y verificado:

- [x] **Paso 1 — Verificación de entorno y dependencias:** Comprobar `/backend/package.json` (instalar `mongoose`, `dotenv`, `bcryptjs` si faltan) y verificar que `.env` tiene `DB_URI` y está incluido en `.gitignore`.
- [x] **Paso 2 — Conexión a MongoDB Atlas (`/backend/config/db.js`):** Implementar y probar la función asíncrona `connectDB()`.
- [x] **Paso 3 — Modelo de Usuarios (`/backend/models/User.js`):** Esquema Mongoose con hash automático de contraseñas (`bcryptjs`) y método de validación.
- [x] **Paso 4 — Modelo de Sensores de Tráfico (`/backend/models/TrafficSensor.js`):** Esquema Mongoose con coordenadas GeoJSON e índice geoespacial `2dsphere`.
- [x] **Paso 5 — Script de Data Seeding (`/backend/seeds/seedSensors.js`):** Lectura de la colección `Anthem_CTC_PuntoMedidaTrafico` en MongoDB Atlas e inserción/actualización masiva en `trafficsensors`.

---

## 3. Especificaciones Técnicas Detalladas

### A. Conexión a Base de Datos (`/backend/config/db.js`)
- Conectar usando `mongoose.connect(process.env.DB_URI)`.
- Capturar errores con `try/catch`, mostrar mensaje descriptivo en consola y ejecutar `process.exit(1)` en caso de fallo.

### B. Modelo `User` (`/backend/models/User.js`)
- **Campos:**
  - `username`: `String`, `required: true`, `unique: true`, `trim: true`
  - `email`: `String`, `required: true`, `unique: true`, `lowercase: true`, `trim: true`
  - `password`: `String`, `required: true`
  - `role`: `String`, `enum: ['user', 'admin']`, `default: 'user'`
  - `preferences`: `{ alertRadiusMeters: { type: Number, default: 500 }, transportMode: { type: String, enum: ['car', 'bike', 'pedestrian'], default: 'car' } }`
  - `createdAt`: `Date`, `default: Date.now`
- **Hooks y Métodos:**
  - Middleware `pre('save')` usando `bcryptjs` (10 salt rounds) que cifre `password` únicamente si `this.isModified('password')`.
  - Método de instancia `comparePassword(candidatePassword)` que devuelva `bcrypt.compare(candidatePassword, this.password)`.

### C. Modelo `TrafficSensor` (`/backend/models/TrafficSensor.js`)
- **Campos:**
  - `sensorId`: `String`, `required: true`, `unique: true`, `index: true`
  - `name`: `String`, `required: true`
  - `district`: `String`
  - `location`: Objeto GeoJSON obligatorio:
    ```javascript
    location: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: { type: [Number], required: true } // Orden estricto: [longitud, latitud]
    }
    ```
  - `intensity`: `Number` (vehículos/hora)
  - `occupancy`: `Number` (porcentaje de ocupación)
  - `load`: `Number` (nivel de carga de la vía)
  - `riskLevel`: `String`, `enum: ['low', 'medium', 'high', 'critical']`, `default: 'low'`
  - `updatedAt`: `Date`, `default: Date.now`
- **Índices:** Declarar `trafficSensorSchema.index({ location: '2dsphere' });`.

### D. Script de Carga (`/backend/seeds/seedSensors.js`)
- **Origen de datos: MongoDB Atlas**, colección `Anthem_CTC_PuntoMedidaTrafico` de la base de datos `Vialsafe` (NO usar ficheros locales ni `csv-parser`, que se ha desinstalado).
- Estructura real de origen: `{ _id, tipo_elem, distrito, id, cod_cent, nombre, utm_x, utm_y, longitud, latitud }` — 53.832 documentos.
- Mapeo a `TrafficSensor`: `sensorId = String(id)`, `name = nombre`, `district = String(distrito)`, `location.coordinates = [parseFloat(longitud), parseFloat(latitud)]`. `intensity`, `occupancy` y `load` no existen en el origen (se dejarán sin definir); `riskLevel` usará el valor por defecto `'low'`.
- Descartar registros con `longitud`/`latitud` nulas o `NaN` (y contar cuántos se omiten).
- Utilizar `TrafficSensor.bulkWrite()` con `updateOne` y `upsert: true` por `sensorId` para evitar duplicados si se ejecuta varias veces.
- Cerrar la conexión de Mongoose al finalizar el proceso (`await mongoose.connection.close()`).
- Tras la carga, comprobar que el índice `2dsphere` está creado (`syncIndexes()`/`init()`).

---

## 4. Reglas de Ejecución para el Agente
1. **Paso a paso:** Ejecuta un paso del checklist a la vez, comprueba que no hay errores de sintaxis ni de ejecución, marca la casilla `[x]` en este archivo y pasa al siguiente.
2. **Validación:** Antes de dar por terminado un modelo o script, verifica su funcionamiento ejecutando una prueba rápida con Node.js contra MongoDB Atlas.