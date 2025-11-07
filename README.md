# IPStream PWA
Aplicación PWA modular para clientes IPStream.

## Configuración
1. Edita `/config/config.json` y define:
   - `template`: plantilla activa (`template1`, `template2`, etc.)
   - `clientId`: ID público del cliente.
   - `sonicpanel_stream_url` y `sonicpanel_api_url` según corresponda.

2. Ejecuta localmente con un servidor simple:
   ```bash
   npx http-server
   ```

3. Abre en el navegador y se cargará automáticamente la plantilla activa.

## Estructura
- `/templates/`: distintas plantillas del sitio.
- `/assets/js/api.js`: conexión con la API pública de IPStream.
- `/config/config.json`: configuración global.
- `/service-worker.js`: caché offline.

## Despliegue
Sube todo el contenido al servidor (por ejemplo EasyPanel o Nginx estático).
