const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado para permitir recursos externos
  crossOriginEmbedderPolicy: false
}));

// Compresión gzip
app.use(compression());

// CORS
app.use(cors());

// Servir archivos estáticos
app.use(express.static('.', {
  maxAge: '1d', // Cache por 1 día
  etag: true
}));

// Ruta principal - redirige al template configurado
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para servir templates específicos
app.get('/templates/:template/*', (req, res, next) => {
  const templatePath = path.join(__dirname, 'templates', req.params.template, req.params[0] || 'index.html');
  res.sendFile(templatePath, (err) => {
    if (err) {
      next(err);
    }
  });
});

// Ruta para el manifest.json
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

// Ruta para el service worker
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'service-worker.js'));
});

// Ruta para archivos de configuración
app.get('/config/:file', (req, res) => {
  res.sendFile(path.join(__dirname, 'config', req.params.file));
});

// Ruta para assets
app.get('/assets/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'assets', req.params[0]));
});

// Página offline
app.get('/offline.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'offline.html'));
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'offline.html'));
});

// Manejo de errores del servidor
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).send('Error interno del servidor');
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`📱 Aplicación disponible en: http://localhost:${PORT}`);
  console.log(`🌐 Modo: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});