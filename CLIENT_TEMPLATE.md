# Template para Repo de Cliente

Este documento explica cómo crear un nuevo repo para un cliente.

## Estructura del repo del cliente

```
cliente-radio/
├── config/
│   └── config.json          ← Configuración única del cliente
├── assets/
│   └── icons/               ← Iconos personalizados del cliente
│       ├── icon-72x72.png
│       ├── icon-96x96.png
│       ├── icon-128x128.png
│       ├── icon-144x144.png
│       ├── icon-152x152.png
│       ├── icon-192x192.png
│       ├── icon-384x384.png
│       └── icon-512x512.png
├── package.json             ← Instala el core
├── .npmrc                   ← Configuración de GitHub Packages
└── README.md
```

## package.json del cliente

```json
{
  "name": "cliente-radio",
  "version": "1.0.0",
  "private": true,
  "description": "Radio PWA para [Nombre del Cliente]",
  "scripts": {
    "start": "node node_modules/@hostreams/radio-pwa-core/server.js",
    "dev": "node node_modules/@hostreams/radio-pwa-core/server.js"
  },
  "dependencies": {
    "@hostreams/radio-pwa-core": "^1.0.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

## .npmrc del cliente

```
@hostreams:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

## config/config.json del cliente

```json
{
  "template": "blue",
  "project_name": "Radio Cliente",
  "clientId": "ID_DEL_CLIENTE_EN_IPSTREAM",
  "ipstream_base_url": "https://dashboard.ipstream.cl/api/public",
  "sonicpanel_stream_url": "https://stream.ipstream.cl/PUERTO/stream",
  "sonicpanel_api_url": "https://stream.ipstream.cl/cp/get_info.php?p=PUERTO",
  "cache_version": "v1",
  "offline_page": "/offline.html",
  "pagination": {
    "news_per_page": 10,
    "podcasts_per_page": 10,
    "videocasts_per_page": 10
  }
}
```

## Pasos para crear un nuevo cliente

1. Crear nuevo repo en GitHub
2. Copiar estructura de archivos
3. Personalizar `config/config.json` con datos del cliente
4. Agregar iconos personalizados en `assets/icons/`
5. Configurar secret `NPM_TOKEN` en el repo (mismo token que el core)
6. Hacer `npm install`
7. Configurar deploy en Dockploy

## Actualización automática

Cuando se publique una nueva versión del core:
- GitHub Actions detectará la actualización
- Instalará la nueva versión automáticamente
- Hará commit y push
- Dockploy desplegará automáticamente
