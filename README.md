# Recetario (nombre provisional)

SPA de recetas que consume la API pública [TheMealDB](https://www.themealdb.com/api.php) en tiempo de ejecución. Proyecto 2 de Desarrollo de Lenguajes para Clientes Web (URU).

> El enunciado exige un nombre original distinto de "Recetario". Se define en `NOMBRE_APP` (`js/app.js`).

## Estado

| Vista | Estado |
| --- | --- |
| Inicio | Lista: receta destacada al azar y cuadrícula de categorías. |
| Explorar | Lista: nombre, categoría, origen e ingrediente combinados por intersección, paginación de 12. |
| Detalle | Lista: ingredientes, pasos, video, etiquetas, relacionadas y botón Volver. |
| Categorías y orígenes | Lista: pestañas, ficha de categoría u origen con sus recetas. |
| Comparador | Pendiente. Ya se pueden agregar recetas desde cualquier vista (el contador de la barra lo refleja). |

## Integrantes

| Integrante | División del trabajo |
| --- | --- |
| Leandro Jay (`Lejayk`) | Servicios (petición centralizada, caché, normalización, sesión del comparador), pseudocomponente base, navegación, vistas de inicio, explorar, detalle y categorías y orígenes. |
| `santrix329` | Núcleo inicial de la SPA (`index.html`, estilos base, `app.js`) y primer servicio de la API. |

## Cómo ejecutarlo

Abrir `index.html` en el navegador. No necesita servidor ni instalación: los datos se piden a TheMealDB, así que hace falta conexión a internet.

## Estructura

```
index.html                      barra de navegación + contenedor de vistas
css/styles.css                  base: tokens en :root, botones, tarjetas, estados
css/explorar.css, detalle.css, categorias.css   estilos propios de cada vista
assets/ingrediente-alternativo.svg              imagen alternativa de ingredientes
js/servicios/recetas.js         normalización, intersección y orden de recetas
js/servicios/cache.js           caché en memoria (sin persistencia)
js/servicios/api.js             petición centralizada y endpoints permitidos
js/servicios/sesionComparador.js  las dos recetas del comparador
js/servicios/comparacion.js     métricas del comparador y receta más sencilla
js/utilidades/dom.js            crearNodo: construye nodos sin innerHTML
js/componentes/                 pseudocomponentes (uno por archivo)
js/vistas/                      vistas, también pseudocomponentes
js/app.js                       punto de entrada, cambio de vistas y comparador
```

## Pseudocomponentes

Todos heredan de `Componente`, que separa `crearElemento`, `renderizar`, `configurarEventos` y `destruir`. Se comunican con `CustomEvent` (los datos viajan en `detail`) y ninguno toca el DOM interno de otro. Al cambiar de vista, la vista anterior se destruye junto con todos sus pseudocomponentes.

| Pseudocomponente | Responsabilidad | Eventos que emite |
| --- | --- | --- |
| `BarraNavegacion` | Acceso a las vistas, vista activa y contador del comparador (0, 1 o 2). | `navegacion:ir` `{ vista }` |
| `EstadoCarga` | Indicadores de carga con la forma del contenido, estado vacío y error con reintento. | `estado:reintentar` `{ seccion }` |
| `Aviso` | Mensaje breve en pantalla (reemplaza a `alert`). | `aviso:cerrar` |
| `DialogoReemplazo` | Pregunta qué panel del comparador reemplazar (reemplaza a `confirm`). | `reemplazo:elegir` `{ indice }`, `reemplazo:cancelar` |
| `RecetaDestacada` | Receta al azar de la vista de inicio. | `receta:abrir` `{ id }`, `destacada:otra` `{ id }` |
| `TarjetaCategoria` | Categoría con imagen, nombre y descripción recortada a 120 caracteres. | `categoria:abrir` `{ nombre }` |
| `TarjetaReceta` | Receta con imagen, nombre, categoría, origen y cantidad de ingredientes; marca si quedó incompleta. Se reutiliza en explorar, categorías y orígenes y relacionadas. | `receta:abrir` `{ id }`, `receta:comparar` `{ id }`, `tarjeta:reintentar` `{ id }` |
| `Paginador` | Anterior, siguiente y "Página x de y". | `paginador:cambiar` `{ pagina }` |
| `ListadoRecetas` | Cuadrícula paginada que resuelve en paralelo el detalle de la página visible. | `listado:pagina` `{ pagina }` |
| `FormularioBusqueda` | Criterios de explorar con validación junto a cada campo. | `busqueda:enviar` `{ criterios }`, `busqueda:limpiar` |
| `CampoSugerencias` | Campo de ingrediente con sugerencias filtradas mientras se escribe (combobox accesible). | `sugerencias:cambiar` `{ valor }`, `sugerencias:elegir` `{ valor }` |
| `CabeceraReceta` | Imagen, categoría, origen, etiquetas, video y botón para comparar. | `receta:comparar` `{ id }` |
| `ListaIngredientes` | Ingredientes con imagen (con alternativa si no carga), nombre y medida. | — |
| `PasosPreparacion` | Pasos numerados. | — |
| `Pestanas` | Pestañas accesibles (flechas, Inicio, Fin). | `pestanas:cambiar` `{ id }` |
| `ListaOpciones` | Lista de categorías u orígenes, con filtro opcional. Se instancia una vez por pestaña. | `opcion:elegir` `{ valor }` |
| `EncabezadoFicha` | Encabezado de la ficha de una categoría o de un origen. | — |
| `TablaComparacion` | Métricas entre las recetas A y B: resalta el menor valor numérico, lista etiquetas e ingredientes en común y exclusivos, similitud y receta más sencilla (menos ingredientes, luego menos pasos, luego menos palabras). | — |
| `VistaInicio`, `VistaExplorar`, `VistaDetalle`, `VistaCategoriasOrigenes` | Componen los pseudocomponentes de cada vista. `VistaDetalle` emite `vista:volver`. | — |
| `VistaPendiente` | Marcador temporal del comparador. | — |

## `Promise.all` y `Promise.allSettled`

| Dónde | Cuál | Por qué |
| --- | --- | --- |
| `VistaInicio.cargarInicio` | `Promise.allSettled` | La receta destacada y las categorías son independientes: si una falla, la otra se muestra igual y la que falló ofrece reintentar. |
| `ListadoRecetas.mostrarPagina` | `Promise.allSettled` | El detalle de cada receta de la página es independiente: si una falla, solo esa tarjeta queda incompleta y ofrece reintentar. |
| `VistaDetalle.cargarRelacionadas` | `Promise.allSettled` | Las relacionadas por categoría y por origen son dos secciones separadas: el fallo de una no impide mostrar la otra. |
| `VistaExplorar` (carga del formulario) | `Promise.all` | El formulario necesita las tres listas (categorías, orígenes, ingredientes) para ofrecer todos sus criterios. |
| `VistaExplorar.buscar` | `Promise.all` | La intersección necesita la lista de cada criterio aplicado: si falta una, no hay resultado correcto que mostrar. |
| `VistaCategoriasOrigenes` (ficha de categoría) | `Promise.all` | La ficha necesita a la vez los datos de la categoría y sus recetas. |

## Decisiones de diseño

Pendiente de definir en pareja: paleta definitiva, tipografía, iconografía y referencias. Por ahora se conserva la base oscura del núcleo inicial (`#121212`, `#e0e0e0`, Segoe UI) con un acento ámbar provisional.

## Capturas

Pendientes hasta completar las cinco vistas.
