/*
 * cache.js
 * guarda en memoria lo que ya se obtuvo de la api durante la sesion.
 * no usa localStorage ni nada persistente: al recargar la pagina se vacia.
 *
 * se guarda la promesa y no el valor: si dos partes de la aplicacion piden
 * lo mismo al mismo tiempo, las dos esperan la misma peticion en vuelo.
 */

const memoriaCache = new Map();

// devuelve lo guardado bajo la clave o, si no existe, lo pide una sola vez.
// pedir debe ser una funcion que devuelva una promesa (por ejemplo pedirApi).
function recordarEnCache(clave, pedir) {
    if (!memoriaCache.has(clave)) {
        memoriaCache.set(clave, esperarYOlvidarSiFalla(clave, pedir));
    }
    return memoriaCache.get(clave);
}

// si la peticion falla se borra la entrada, asi el reintento vuelve a pedirla
// en lugar de recibir el mismo error guardado para siempre
async function esperarYOlvidarSiFalla(clave, pedir) {
    try {
        return await pedir();
    } catch (error) {
        memoriaCache.delete(clave);
        throw error;
    }
}

// guarda un valor ya obtenido por otro camino (por ejemplo una busqueda)
function guardarEnCache(clave, valor) {
    memoriaCache.set(clave, Promise.resolve(valor));
}
