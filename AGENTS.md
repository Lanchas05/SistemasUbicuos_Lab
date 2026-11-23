# Contexto del Proyecto: VialSafe (MERN Stack)

## Visión General
Aplicación web Full Stack sensible al contexto para la seguridad vial en Madrid (accidentalidad, multas y sensores de tráfico).
- **Stack obligatorio:** MongoDB Atlas (Mongoose), Express.js, React.js, Node.js (Pila MERN).
- **Arquitectura:** Repositorio desacoplado en `/backend` (API REST JSON pura) y `/frontend` (SPA React).

## División de Responsabilidades (Equipo de 2)
- **Carlos (Usuario actual):** Modelos `User.js` y `TrafficSensor.js` / `RiskZone.js`, script de carga de sensores de tráfico, autenticación JWT/bcryptjs y geolocalización.
- **Alex (Compañero):** Modelos `Accident.js` y `Fine.js`, script de carga de accidentes/multas de Madrid y mapas/heatmaps.

## Reglas Técnicas Inquebrantables
1. **Base de datos:** Siempre usar `process.env.DB_URI` via `dotenv`. Nunca hardcodear credenciales.
2. **Índices Geoespaciales:** Todo esquema con coordenadas debe usar el formato GeoJSON (`type: { type: String, enum: ['Point'], required: true }, coordinates: { type: [Number], required: true }`) con índice `2dsphere` (`[longitud, latitud]`).
3. **Seguridad:** Contraseñas siempre hasheadas con `bcryptjs` antes de guardar (`pre('save')` hook).
4. **Limpieza:** No tocar ni sobrescribir los archivos asignados a Alex (`Accident.js`, `Fine.js`) salvo para referenciar sus `ObjectId` si fuese estrictamente necesario.