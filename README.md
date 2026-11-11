# Recetario (nombre provisional)

SPA de recetas que consume la API pública [TheMealDB](https://www.themealdb.com/api.php) en tiempo de ejecución. Proyecto 2 de Desarrollo de Lenguajes para Clientes Web (URU).

> El enunciado exige un nombre original distinto de "Recetario". Se define en `NOMBRE_APP` (`js/app.js`).

## Integrantes

| Integrante | División del trabajo |
| --- | --- |
| Leandro Jay (`Lejayk`) | Servicios (petición centralizada, caché, normalización), pseudocomponente base, navegación y vista de inicio. |
| `santrix329` | Núcleo inicial de la SPA (`index.html`, estilos base, `app.js`). |

## Cómo ejecutarlo

Abrir `index.html` en el navegador. No necesita servidor ni instalación: los datos se piden a TheMealDB, así que hace falta conexión a internet.

## Estructura

```
index.html                 barra de navegación + contenedor de vistas
css/styles.css             estilos (tokens en :root)
js/servicios/recetas.js    normalización: ingredientes, pasos, etiquetas, palabras
js/servicios/cache.js      caché en memoria (sin persistencia)
js/servicios/api.js        petición centralizada y endpoints permitidos
js/utilidades/dom.js       crearNodo: construye nodos sin innerHTML
js/componentes/            pseudocomponentes (uno por archivo)
js/vistas/                 vistas, también pseudocomponentes
js/app.js                  punto de entrada y cambio de vistas
```

## Pseudocomponentes

Todos heredan de `Componente`, que separa `crearElemento`, `renderizar`, `configurarEventos` y `destruir`. Se comunican con `CustomEvent` (los datos viajan en `detail`) y ninguno toca el DOM interno de otro.

| Pseudocomponente | Responsabilidad | Eventos que emite |
| --- | --- | --- |
| `BarraNavegacion` | Acceso a las vistas, vista activa y contador del comparador. | `navegacion:ir` `{ vista }` |
| `EstadoCarga` | Indicadores de carga con la forma del contenido, estado vacío y error con reintento. | `estado:reintentar` `{ seccion }` |
| `RecetaDestacada` | Receta al azar de la vista de inicio. | `receta:abrir` `{ id }`, `destacada:otra` `{ id }` |
| `TarjetaCategoria` | Categoría con imagen, nombre y descripción recortada a 120 caracteres. Se instancia una vez por categoría. | `categoria:abrir` `{ nombre }` |
| `VistaInicio` | Compone la receta destacada y la cuadrícula de categorías. | — (deja subir los eventos de sus hijos) |
| `VistaPendiente` | Marcador temporal de las vistas que faltan. | — |

## `Promise.all` y `Promise.allSettled`

| Dónde | Cuál | Por qué |
| --- | --- | --- |
| `VistaInicio.cargarInicio` | `Promise.allSettled` | La receta destacada y las categorías son independientes: si una falla, la otra se muestra igual y la que falló ofrece reintentar. |

## Decisiones de diseño

Pendiente de definir en pareja: paleta definitiva, tipografía, iconografía y referencias. Por ahora se conserva la base oscura del núcleo inicial (`#121212`, `#e0e0e0`, Segoe UI) con un acento ámbar provisional.

## Capturas

Pendientes hasta completar las cinco vistas.
