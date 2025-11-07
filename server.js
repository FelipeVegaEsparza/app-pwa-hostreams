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

// Leer configuración al inicio
const fs = require('fs');
let currentTemplate = 'template5'; // Default

try {
  const configPath = path.join(__dirname, 'config', 'config.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configData);
  currentTemplate = config.template || 'template5';
  console.log(`📱 Template configurado: ${currentTemplate}`);
} catch (error) {
  console.error('Error loading config:', error);
}

// IMPORTANTE: Definir rutas específicas ANTES del middleware estático
// Ruta principal - sirve el template con rutas corregidas
app.get('/', (req, res) => {
  try {
    const templatePath = path.join(__dirname, 'templates', currentTemplate, 'index.html');
    
    if (fs.existsSync(templatePath)) {
      // Leer el HTML del template
      let html = fs.readFileSync(templatePath, 'utf8');
      
      // Reemplazar rutas relativas con rutas absolutas al template
      html = html.replace(/href="assets\//g, `href="/templates/${currentTemplate}/assets/`);
      html = html.replace(/src="assets\//g, `src="/templates/${currentTemplate}/assets/`);
      html = html.replace(/href='assets\//g, `href='/templates/${currentTemplate}/assets/`);
      html = html.replace(/src='assets\//g, `src='/templates/${currentTemplate}/assets/`);
      html = html.replace(/src="\.\/assets\//g, `src="/templates/${currentTemplate}/assets/`);
      html = html.replace(/src='\.\/assets\//g, `src='/templates/${currentTemplate}/assets/`);
      html = html.replace(/from '\.\/assets\//g, `from '/templates/${currentTemplate}/assets/`);
      html = html.replace(/from "\.\/assets\//g, `from "/templates/${currentTemplate}/assets/`);
      
      // Headers para evitar caché
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      
      // Enviar el HTML modificado
      res.send(html);
    } else {
      console.error('❌ Template no encontrado:', templatePath);
      res.sendFile(path.join(__dirname, 'index.html'));
    }
  } catch (error) {
    console.error('❌ Error serving template:', error);
    res.sendFile(path.join(__dirname, 'index.html'));
  }
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

// Ruta para assets - primero intenta del template, luego de la raíz
app.get('/assets/*', (req, res, next) => {
  const assetPath = req.params[0];
  
  // Primero intentar desde el template actual
  const templateAssetPath = path.join(__dirname, 'templates', currentTemplate, 'assets', assetPath);
  
  if (fs.existsSync(templateAssetPath)) {
    res.sendFile(templateAssetPath);
  } else {
    // Si no existe en el template, intentar desde la raíz
    const rootAssetPath = path.join(__dirname, 'assets', assetPath);
    if (fs.existsSync(rootAssetPath)) {
      res.sendFile(rootAssetPath);
    } else {
      next();
    }
  }
});

// Página offline
app.get('/offline.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'offline.html'));
});

// Servir archivos estáticos DESPUÉS de las rutas específicas
app.use(express.static('.', {
  maxAge: '1d',
  etag: true,
  index: false // No servir index.html automáticamente
}));

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