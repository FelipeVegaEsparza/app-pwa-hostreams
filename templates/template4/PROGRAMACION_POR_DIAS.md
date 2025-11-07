# Programación por Días de la Semana - Template 7

## 📅 Nueva Funcionalidad Implementada

La sección de programas del Template 7 "Radio News Hub" ha sido completamente renovada para organizar los programas por días de la semana, proporcionando una experiencia más intuitiva y organizada para los oyentes.

## 🎯 Características Principales

### Navegación por Días
- **7 botones de navegación**: Lunes a Domingo
- **Día actual automático**: Se abre automáticamente en el día de la semana actual
- **Diseño limpio**: Sin títulos innecesarios, enfoque directo en el contenido
- **Diseño responsive**: Se adapta a todos los dispositivos
- **Animaciones suaves**: Transiciones elegantes al cambiar de día
- **Estado activo visual**: El día seleccionado se destaca claramente

### Cards de Programas
Cada programa se muestra en una card individual con:

#### Información del Programa
- **Imagen**: Imagen representativa del programa (con placeholder si no está disponible)
- **Horario**: Hora de inicio y fin (si está disponible)
- **Nombre del programa**: Título principal
- **Conductor**: Nombre del host/DJ (si está disponible)
- **Descripción**: Breve descripción del contenido
- **Tags**: Etiquetas de categorización (si están disponibles)

#### Estados en Tiempo Real
- **🔴 EN VIVO**: Programa actualmente al aire
- **🟡 PRÓXIMO**: Siguiente programa a transmitir
- **⚪ PROGRAMADO**: Programas futuros
- **🟢 FINALIZADO**: Programas ya transmitidos

#### Botón de Acción
- **"Escuchar"**: Activo solo para programas en vivo
- **"Programado"**: Para programas que no están al aire

## 🔧 Implementación Técnica

### HTML Structure
```html
<!-- Navegación por días -->
<div class="weekly-schedule-nav">
  <button class="day-btn active" data-day="lunes">Lunes</button>
  <!-- ... otros días ... -->
</div>

<!-- Contenido por día -->
<div class="programs-by-day">
  <div class="day-programs active" id="lunes-programs">
    <h2 class="day-title">Programación del Lunes</h2>
    <div class="programs-grid" id="lunes-grid">
      <!-- Cards de programas -->
    </div>
  </div>
  <!-- ... otros días ... -->
</div>
```

### CSS Styling
- **Grid responsive**: `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`
- **Imágenes adaptativas**: Altura fija con object-fit: cover
- **Placeholders elegantes**: Iconos cuando no hay imagen disponible
- **Overlay de estado**: Indicador "EN VIVO" sobre la imagen
- **Animaciones**: Fade in/out con CSS transitions y zoom en hover
- **Estados visuales**: Colores diferenciados para cada estado
- **Hover effects**: Interacciones suaves al pasar el mouse

### JavaScript Functionality
- **Organización automática**: Los programas se organizan por día automáticamente
- **Día actual por defecto**: Detecta y muestra automáticamente el día actual
- **Detección de estado**: Calcula si un programa está en vivo, próximo, etc.
- **Navegación fluida**: Cambio entre días sin recargar la página
- **Integración con API**: Consume datos de `getPrograms()`

## 📱 Responsive Design

### Desktop (1024px+)
- Grid de 3-4 columnas
- Navegación horizontal completa
- Cards con información completa

### Tablet (768px - 1024px)
- Grid de 2-3 columnas
- Navegación adaptada
- Información condensada

### Mobile (< 768px)
- Grid de 1 columna
- Navegación en 2 filas
- Cards optimizadas para touch

## 🎨 Estilos Visuales

### Paleta de Colores
- **Primario**: #3498db (Azul)
- **Secundario**: #e74c3c (Rojo)
- **Texto**: #2c3e50 (Gris oscuro)
- **Fondo**: #f8f9fa (Gris claro)

### Estados de Programa
- **En Vivo**: Borde rojo con animación pulse
- **Próximo**: Fondo naranja
- **Programado**: Fondo gris
- **Finalizado**: Fondo verde

## 🔄 Detección Automática del Día Actual

### Funcionamiento Técnico
```javascript
// Función que obtiene el día actual
getCurrentDayName() {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const today = new Date().getDay(); // 0 = domingo, 1 = lunes, etc.
  return days[today];
}

// Función que establece el día actual como activo
setCurrentDayAsActive() {
  const currentDay = this.getCurrentDayName();
  
  // Actualizar botones de navegación
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.day === currentDay) {
      btn.classList.add('active');
    }
  });
  
  // Mostrar la sección del día actual
  this.showDayPrograms(currentDay);
}
```

### Flujo de Inicialización
1. **Carga de programas**: Se obtienen todos los programas de la API
2. **Organización por días**: Los programas se distribuyen por días de la semana
3. **Renderizado**: Se crean las cards para cada día
4. **Detección automática**: Se detecta el día actual y se establece como activo
5. **Actualización visual**: Se actualiza la interfaz para mostrar el día correcto

## 🚀 Funcionalidades Futuras

### Posibles Mejoras
- **Filtros por género**: Música, Noticias, Deportes, etc.
- **Búsqueda de programas**: Buscar por nombre o conductor
- **Favoritos**: Marcar programas favoritos
- **Notificaciones**: Alertas cuando inicia un programa favorito
- **Compartir**: Enlaces directos a programas específicos
- **Historial**: Recordar el último día visitado por el usuario

## 📋 Uso de la API

### Estructura de Datos Esperada
```javascript
// Ejemplo de programa con días específicos
{
  id: "1",
  name: "Buenos Días Radio",
  startTime: "06:00",
  endTime: "10:00",
  host: "Juan Pérez",
  description: "El mejor programa matutino",
  imageUrl: "/uploads/programs/buenos-dias-radio.jpg", // Nueva propiedad
  days: ["lunes", "martes", "miércoles", "jueves", "viernes"],
  tags: ["música", "noticias", "entretenimiento"]
}
```

### Manejo de Imágenes
- **Con imagen**: Se muestra la imagen del programa desde `https://dashboard.ipstream.cl${program.imageUrl}`
- **Sin imagen**: Se muestra un placeholder con icono de micrófono
- **Lazy loading**: Las imágenes se cargan solo cuando son visibles
- **Responsive**: Las imágenes se adaptan a diferentes tamaños de pantalla

### Fallback
Si un programa no tiene días específicos, se asigna automáticamente a lunes-viernes.

## 🎯 Beneficios para el Usuario

1. **Navegación intuitiva**: Fácil encontrar programas por día
2. **Información clara**: Estados visuales inmediatos
3. **Experiencia moderna**: Diseño actualizado y responsive
4. **Interactividad**: Botones funcionales y animaciones
5. **Organización**: Programas ordenados por horario automáticamente
6. **Diseño limpio**: Sin elementos innecesarios, enfoque directo en el contenido
7. **Carga rápida**: Menos elementos DOM mejoran el rendimiento

---

*Implementado en Template 7 "Radio News Hub" - Noviembre 2025*