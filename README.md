# Radio PWA Templates

Una colección de templates PWA modernos y responsivos para estaciones de radio con múltiples diseños y funcionalidades avanzadas.

## 🚀 Características

- **7 Templates únicos** con diseños modernos
- **PWA completa** con instalación automática
- **Responsive design** perfecto para móviles
- **Pantallas de carga** animadas y personalizadas
- **Títulos dinámicos** desde configuración
- **Sistema de instalación** inteligente para iOS/Android
- **Optimizado para streaming** de audio

## 📱 Templates Disponibles

1. **Template 2** - Radio Landing (Diseño clásico)
2. **Template 3** - Radio Stream (Estilo Spotify)
3. **Template 4** - Radio News Hub (Enfoque noticias)
4. **Template 5** - Radio Nexus (Diseño moderno)
5. **Template 6** - Radio Pulse (Diseño dinámico)
6. **Template 7** - Radio Pulse Player (Reproductor minimalista)

## 🛠 Instalación Local

### Prerrequisitos
- Node.js 16+ 
- npm 8+

### Pasos
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/radio-pwa-templates.git
cd radio-pwa-templates

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Abrir en navegador
# http://localhost:3000
```

## 🐳 Despliegue con Docker

```bash
# Construir imagen
docker build -t radio-pwa .

# Ejecutar contenedor
docker run -p 3000:3000 radio-pwa

# O usar docker-compose
docker-compose up -d
```

## ☁️ Despliegue en EasyPanel

### Método 1: Desde GitHub
1. Conecta tu repositorio de GitHub a EasyPanel
2. Selecciona "Node.js App" como tipo de aplicación
3. Configura las variables:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: `3000`

### Método 2: Con Dockerfile
1. EasyPanel detectará automáticamente el Dockerfile
2. La aplicación se construirá y desplegará automáticamente
3. Estará disponible en el dominio asignado

## ⚙️ Configuración

### Archivo `config/config.json`
```json
{
  "template": "template6",
  "project_name": "Tu Radio",
  "clientId": "tu-client-id",
  "ipstream_base_url": "https://dashboard.ipstream.cl/api/public",
  "sonicpanel_stream_url": "tu-stream-url",
  "sonicpanel_api_url": "tu-api-url"
}
```

### Variables de Entorno
- `PORT`: Puerto del servidor (default: 3000)
- `NODE_ENV`: Entorno de ejecución (production/development)

## 🔧 Personalización

### Cambiar Template Activo
Edita `config/config.json` y cambia el valor de `"template"`:
```json
{
  "template": "template7"
}
```

### Cambiar Nombre del Proyecto
El nombre se actualiza automáticamente desde `project_name` en el config.

### Personalizar Estilos
Cada template tiene su archivo CSS en:
```
templates/templateX/assets/css/style.css
```

## 📱 Funcionalidades PWA

- **Instalación automática** en dispositivos compatibles
- **Funcionamiento offline** con Service Worker
- **Notificaciones push** (configurables)
- **Iconos adaptativos** para todas las plataformas
- **Pantalla de splash** personalizada

## 🎨 Responsive Design

- **Breakpoints optimizados**: 480px, 768px, 1024px
- **Navegación móvil** con menús hamburguesa
- **Controles táctiles** de 44px mínimo
- **Layouts adaptativos** que se reorganizan automáticamente

## 🔊 Integración de Audio

- Compatible con **SonicPanel**
- Soporte para **IPStream**
- **Metadata en tiempo real**
- **Controles de volumen** optimizados

## 📊 Monitoreo

El servidor incluye:
- **Health checks** para contenedores
- **Logs estructurados**
- **Manejo de errores** robusto
- **Métricas de rendimiento**

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas con el despliegue:

1. **Verifica los logs** en EasyPanel
2. **Comprueba las variables de entorno**
3. **Asegúrate de que el puerto 3000 esté disponible**
4. **Revisa que todas las dependencias estén instaladas**

### Comandos de Diagnóstico
```bash
# Verificar que el servidor inicie localmente
npm start

# Verificar dependencias
npm list

# Limpiar cache de npm
npm cache clean --force
```

---

**¡Tu radio PWA está lista para el mundo!** 🎵📻