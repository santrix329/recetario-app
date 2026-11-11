/*
 * api.js
 * unica puerta de salida hacia themealdb. toda peticion pasa por pedirApi,
 * que verifica response.ok antes de leer el json y traduce cada falla a un
 * ErrorApi con un tipo que la interfaz sabe mostrar.
 *
 * las funciones de endpoint no son async: devuelven la promesa de pedirApi
 * (o de la cache). el try/catch vive en pedirApi, que es donde se manejan
 * los errores de red, de servidor y de lectura.
 */

const URL_BASE_API = "https://www.themealdb.com/api/json/v1/1/";

const TIPOS_ERROR_API = Object.freeze({
    SIN_CONEXION: "sin-conexion",
    SERVICIO_NO_DISPONIBLE: "servicio-no-disponible",
    RESPUESTA_INVALIDA: "respuesta-invalida",
    CANCELADA: "cancelada",
});

class ErrorApi extends Error {
    constructor(tipo, mensaje, estadoHttp = null) {
        super(mensaje);
        this.name = "ErrorApi";
        this.tipo = tipo;
        this.estadoHttp = estadoHttp;
    }
}

// opciones:
//   campo:        propiedad del json que trae la lista ("meals" o "categories")
//   transformar:  funcion sincronica que convierte la lista cruda en datos propios
//   signal:       señal de un AbortController para cancelar la peticion
//   sinCacheHttp: true para que el navegador no reutilice una respuesta anterior
async function pedirApi(ruta, opciones = {}) {
    const { campo = "meals", transformar = (lista) => lista, signal, sinCacheHttp = false } = opciones;

    // la etapa permite distinguir un fallo de red de una respuesta ilegible
    let etapa = "conexion";
    try {
        const respuesta = await fetch(URL_BASE_API + ruta, {
            signal,
            cache: sinCacheHttp ? "no-store" : "default",
        });
        if (!respuesta.ok) {
            throw new ErrorApi(
                TIPOS_ERROR_API.SERVICIO_NO_DISPONIBLE,
                `El servicio de recetas no está disponible en este momento (estado ${respuesta.status}).`,
                respuesta.status
            );
        }

        etapa = "lectura";
        const datos = await respuesta.json();

        // meals en null significa "sin resultados", no es un error
        etapa = "transformacion";
        const lista = Array.isArray(datos?.[campo]) ? datos[campo] : [];
        return transformar(lista);
    } catch (error) {
        throw traducirError(error, etapa);
    }
}

function traducirError(error, etapa) {
    if (error instanceof ErrorApi) return error;
    if (error?.name === "AbortError") {
        return new ErrorApi(TIPOS_ERROR_API.CANCELADA, "La petición fue cancelada.");
    }
    // un json mal formado lanza SyntaxError; cualquier otro fallo al leer es la red cortada
    const sinRespuestaUtil = etapa === "conexion" || (etapa === "lectura" && error?.name !== "SyntaxError");
    if (sinRespuestaUtil) {
        return new ErrorApi(
            TIPOS_ERROR_API.SIN_CONEXION,
            "No pudimos conectar con el servidor de recetas. Revisa tu conexión a internet."
        );
    }
    return new ErrorApi(
        TIPOS_ERROR_API.RESPUESTA_INVALIDA,
        "El servidor respondió con datos que no se pudieron interpretar."
    );
}

// ---------------------------------------------------------------------------
// claves de la cache en memoria

function claveReceta(id) {
    return "receta:" + id;
}

// guarda cada receta completa para no volver a pedirla por id
function recordarRecetasCompletas(recetasCrudas) {
    return recetasCrudas.map((cruda) => {
        const receta = normalizarReceta(cruda);
        guardarEnCache(claveReceta(receta.id), receta);
        return receta;
    });
}

function primeraRecetaCompleta(recetasCrudas) {
    const [receta] = recordarRecetasCompletas(recetasCrudas);
    if (!receta) {
        throw new ErrorApi(TIPOS_ERROR_API.RESPUESTA_INVALIDA, "El servidor no devolvió ninguna receta.");
    }
    return receta;
}

// ---------------------------------------------------------------------------
// endpoints permitidos por el enunciado (seccion 3.1)

// random.php no se cachea: cada llamada debe traer una receta nueva
function obtenerRecetaAleatoria() {
    return pedirApi("random.php", { sinCacheHttp: true, transformar: primeraRecetaCompleta });
}

// devuelve null si el id no existe
function obtenerRecetaPorId(id) {
    return recordarEnCache(claveReceta(id), () =>
        pedirApi("lookup.php?i=" + encodeURIComponent(id), {
            transformar: (crudas) => (crudas.length > 0 ? recordarRecetasCompletas(crudas)[0] : null),
        })
    );
}

// la lista de resultados no se cachea, pero cada receta completa si
function buscarRecetasPorNombre(nombre, { signal } = {}) {
    return pedirApi("search.php?s=" + encodeURIComponent(nombre), {
        signal,
        transformar: recordarRecetasCompletas,
    });
}

function obtenerCategorias() {
    return recordarEnCache("lista:categorias", () =>
        pedirApi("categories.php", {
            campo: "categories",
            transformar: (crudas) => crudas.map(normalizarCategoria),
        })
    );
}

function obtenerOrigenes() {
    return recordarEnCache("lista:origenes", () =>
        pedirApi("list.php?a=list", {
            transformar: (crudos) => crudos.map((origen) => limpiarTexto(origen.strArea)).filter(Boolean),
        })
    );
}

function obtenerIngredientes() {
    return recordarEnCache("lista:ingredientes", () =>
        pedirApi("list.php?i=list", {
            transformar: (crudos) => crudos.map((ingrediente) => limpiarTexto(ingrediente.strIngredient)).filter(Boolean),
        })
    );
}

// los filtros aceptan un solo valor por peticion y devuelven recetas resumidas
function filtrarRecetas(parametro, valor) {
    return recordarEnCache(`filtro:${parametro}:${valor}`, () =>
        pedirApi(`filter.php?${parametro}=` + encodeURIComponent(valor), {
            transformar: (crudas) => crudas.map(normalizarResumen),
        })
    );
}

function filtrarPorCategoria(categoria) {
    return filtrarRecetas("c", categoria);
}

function filtrarPorOrigen(origen) {
    return filtrarRecetas("a", origen);
}

function filtrarPorIngrediente(ingrediente) {
    return filtrarRecetas("i", ingrediente);
}
