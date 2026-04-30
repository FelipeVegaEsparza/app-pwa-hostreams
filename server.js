const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Rate Limiting - Protección contra DoS y scraping
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: IS_PRODUCTION ? 100 : 1000, // 100 requests por IP en producción, 1000 en dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// CORS - Restringido a orígenes específicos
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:8080'];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps, curl, service workers)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'HEAD'],
  allowedHeaders: ['Content-Type'],
  credentials: false
};
app.use(cors(corsOptions));

// Content Security Policy (CSP)
// Configurado para permitir todos los recursos que la app utiliza
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Necesario para scripts inline en templates
    "https://cdn.jsdelivr.net",
    "https://cdnjs.cloudflare.com",
    "https://cdn.onesignal.com",
    "https://unpkg.com"
  ],
  scriptSrcAttr: [
    "'unsafe-inline'" // Necesario para event handlers inline (onclick, etc.) en templates
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Necesario para estilos inline
    "https://fonts.googleapis.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com"
  ],
  imgSrc: [
    "'self'",
    "https://dashboard.ipstream.cl",
    "https:",
    "data:",
    "blob:"
  ],
  connectSrc: [
    "'self'",
    "https://dashboard.ipstream.cl",
    "https://stream.ipstream.cl",
    "https://video.ipstream.cl",
    "https://video.ipstream.cl:3710",
    "https://cdn.onesignal.com",
    "https://cdnjs.cloudflare.com",
    "https://fonts.googleapis.com",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com"
  ],
  fontSrc: [
    "'self'",
    "https://fonts.gstatic.com",
    "https://cdnjs.cloudflare.com",
    "data:"
  ],
  mediaSrc: [
    "'self'",
    "https://stream.ipstream.cl",
    "https://dashboard.ipstream.cl",
    "https://video.ipstream.cl",
    "https://video.ipstream.cl:3710",
    "blob:"
  ],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  upgradeInsecureRequests: []
};

app.use(helmet({
  contentSecurityPolicy: {
    directives: cspDirectives,
    reportOnly: false // Cambiar a true para modo solo-reporte si hay problemas
  },
  crossOriginEmbedderPolicy: false, // Necesario para recursos de terceros
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}));

// Compresión gzip
app.use(compression());

// Leer configuración al inicio
const fs = require('fs');
const https = require('https');
let currentTemplate = 'minimalista';
let clientId = null;
let ipstreamBaseUrl = null;
let clientConfig = null;

// Función helper para validar nombres de template (previene path traversal)
function isValidTemplateName(name) {
  if (!name || typeof name !== 'string') return false;
  // Solo permitir letras, números, guiones y guiones bajos
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) return false;
  // Verificar que no contenga secuencias de path traversal
  if (name.includes('..') || name.includes('/') || name.includes('\\')) return false;
  return true;
}

// Cargar config.json - buscar en múltiples ubicaciones
function loadConfig() {
  const possiblePaths = [
    path.join(process.cwd(), 'config', 'config.json'),
    path.join(__dirname, '..', '..', '..', 'config', 'config.json'),
    path.join(__dirname, '..', '..', '..', '..', 'config', 'config.json'),
    path.join(__dirname, 'config', 'config.json')
  ];
  
  let configPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      configPath = testPath;
      break;
    }
  }
  
  if (!configPath) {
    throw new Error('config.json not found in any expected location');
  }
  
  const configData = fs.readFileSync(configPath, 'utf8');
  clientConfig = JSON.parse(configData);
  clientId = clientConfig.clientId;
  ipstreamBaseUrl = clientConfig.ipstream_base_url;
  currentTemplate = clientConfig.template || 'minimalista';
  
  // Validar que el template sea seguro
  if (!isValidTemplateName(currentTemplate)) {
    console.error(`⚠️ Template name invalid: ${currentTemplate}, using fallback`);
    currentTemplate = 'minimalista';
  }
}

try {
  loadConfig();
  console.log(`📂 Config loaded. Template: ${currentTemplate}`);
} catch (error) {
  console.error('Error loading config:', error.message);
}

// Función para obtener el template desde la API
async function fetchTemplateFromAPI() {
  if (!clientId || !ipstreamBaseUrl) {
    return currentTemplate;
  }

  return new Promise((resolve) => {
    const apiUrl = `${ipstreamBaseUrl}/${clientId}`;
    
    https.get(apiUrl, { timeout: 5000 }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const apiData = JSON.parse(data);
          if (apiData.selectedTemplate && isValidTemplateName(apiData.selectedTemplate)) {
            currentTemplate = apiData.selectedTemplate;
          }
          resolve(currentTemplate);
        } catch (error) {
          resolve(currentTemplate);
        }
      });
    }).on('error', (error) => {
      resolve(currentTemplate);
    }).on('timeout', () => {
      resolve(currentTemplate);
    });
  });
}

// Obtener template de la API al iniciar
fetchTemplateFromAPI().then((template) => {
  currentTemplate = template;
  console.log(`🎨 Template activo: ${currentTemplate}`);
});

// Ruta principal - sirve el template con rutas corregidas
app.get('/', async (req, res) => {
  try {
    await fetchTemplateFromAPI();

    if (!isValidTemplateName(currentTemplate)) {
      return res.status(500).send('Invalid template configuration');
    }

    const templatePath = path.join(__dirname, 'templates', currentTemplate, 'index.html');
    
    if (fs.existsSync(templatePath)) {
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
      
      // Headers de seguridad adicionales
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Frame-Options', 'DENY');
      
      res.send(html);
    } else {
      console.error('Template not found:', templatePath);
      res.sendFile(path.join(__dirname, 'index.html'));
    }
  } catch (error) {
    console.error('Error serving template:', error);
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Ruta para servir templates específicos - CON PROTECCIÓN PATH TRAVERSAL
app.get('/templates/:template/*', (req, res, next) => {
  const templateName = req.params.template;
  const filePath = req.params[0] || 'index.html';
  
  // Validar nombre del template
  if (!isValidTemplateName(templateName)) {
    return res.status(400).send('Invalid template name');
  }
  
  // Validar que el filePath no salga del directorio del template
  const requestedPath = path.join(__dirname, 'templates', templateName, filePath);
  const resolvedPath = path.resolve(requestedPath);
  const allowedPath = path.resolve(__dirname, 'templates', templateName);
  
  if (!resolvedPath.startsWith(allowedPath)) {
    return res.status(403).send('Access denied');
  }
  
  res.sendFile(requestedPath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).send('File not found');
      }
      next(err);
    }
  });
});

// Ruta para el manifest.json
app.get('/manifest.json', (req, res) => {
  const clientManifest = path.join(__dirname, 'manifest.json');
  const coreManifest = path.join(__dirname, 'node_modules', '@felipevegaesparza', 'radio-pwa-core', 'manifest.json');
  
  if (fs.existsSync(clientManifest)) {
    res.sendFile(clientManifest);
  } else if (fs.existsSync(coreManifest)) {
    res.sendFile(coreManifest);
  } else {
    res.status(404).send('Manifest not found');
  }
});

// Ruta para el service worker
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, 'service-worker.js'));
});

// Ruta para archivos de configuración - CON PROTECCIÓN PATH TRAVERSAL
app.get('/config/:file', (req, res) => {
  const fileName = req.params.file;
  
  // Validar nombre de archivo
  if (!/^[a-zA-Z0-9_-]+\.json$/.test(fileName)) {
    return res.status(400).send('Invalid config filename');
  }
  
  const possiblePaths = [
    path.join(process.cwd(), 'config', fileName),
    path.join(__dirname, '..', '..', '..', 'config', fileName),
    path.join(__dirname, '..', '..', '..', '..', 'config', fileName),
    path.join(__dirname, 'config', fileName)
  ];
  
  let configPath = null;
  for (const testPath of possiblePaths) {
    const resolvedTestPath = path.resolve(testPath);
    // Verificar que el path resuelto no salga de los directorios permitidos
    const allowedRoots = [
      path.resolve(process.cwd(), 'config'),
      path.resolve(__dirname, 'config')
    ];
    
    if (fs.existsSync(testPath) && allowedRoots.some(root => resolvedTestPath.startsWith(root))) {
      configPath = testPath;
      break;
    }
  }
  
  if (configPath) {
    res.sendFile(configPath);
  } else {
    res.status(404).send('Config file not found');
  }
});

// Endpoint para obtener el template actual
app.get('/api/current-template', (req, res) => {
  res.json({ 
    template: currentTemplate,
    source: clientId ? 'api' : 'local',
    timestamp: new Date().toISOString()
  });
});

// Ruta para assets - CON VALIDACIÓN
app.get('/assets/*', (req, res, next) => {
  const assetPath = req.params[0];
  
  // Validar que no haya path traversal
  if (assetPath.includes('..') || assetPath.includes('~')) {
    return res.status(403).send('Access denied');
  }
  
  // Primero intentar desde el template actual
  if (isValidTemplateName(currentTemplate)) {
    const templateAssetPath = path.join(__dirname, 'templates', currentTemplate, 'assets', assetPath);
    const resolvedTemplatePath = path.resolve(templateAssetPath);
    const allowedTemplatePath = path.resolve(__dirname, 'templates', currentTemplate, 'assets');
    
    if (resolvedTemplatePath.startsWith(allowedTemplatePath) && fs.existsSync(templateAssetPath)) {
      return res.sendFile(templateAssetPath);
    }
  }
  
  // Si no existe en el template, intentar desde la raíz
  const rootAssetPath = path.join(__dirname, 'assets', assetPath);
  const resolvedRootPath = path.resolve(rootAssetPath);
  const allowedRootPath = path.resolve(__dirname, 'assets');
  
  if (resolvedRootPath.startsWith(allowedRootPath) && fs.existsSync(rootAssetPath)) {
    return res.sendFile(rootAssetPath);
  }
  
  next();
});

// Página offline
app.get('/offline.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'offline.html'));
});

// Servir archivos estáticos DESPUÉS de las rutas específicas
app.use(express.static('.', {
  maxAge: '1d',
  etag: true,
  index: false,
  dotfiles: 'deny' // No servir archivos ocultos
}));

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'offline.html'));
});

// Manejo de errores del servidor
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  if (IS_PRODUCTION) {
    res.status(500).send('Internal server error');
  } else {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`🌐 Modo: ${NODE_ENV}`);
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
