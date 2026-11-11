/*
 * sesionComparador.js
 * las dos recetas cargadas en el comparador (paneles a y b).
 * vive en memoria: se conserva al navegar entre vistas y se pierde al recargar.
 *
 * quien necesite enterarse de los cambios (el contador de la barra, la vista
 * del comparador) escucha el evento "cambio" de avisosComparador.
 */

const LETRAS_PANELES = Object.freeze(["A", "B"]);
const panelesComparador = [null, null];
const avisosComparador = new EventTarget();

function notificarCambioComparador() {
    avisosComparador.dispatchEvent(new Event("cambio"));
}

// copia: desde afuera no se puede modificar la sesion sin pasar por estas funciones
function recetasEnComparador() {
    return [...panelesComparador];
}

function cantidadEnComparador() {
    return panelesComparador.filter(Boolean).length;
}

// indice del panel que tiene la receta, o -1
function panelDeReceta(id) {
    return panelesComparador.findIndex((receta) => receta?.id === id);
}

// indice del primer panel vacio, o -1 si los dos estan ocupados
function primerPanelLibre() {
    return panelesComparador.indexOf(null);
}

// devuelve "colocada", o "repetida" si la receta ya esta en algun panel:
// una receta no se puede comparar consigo misma
function colocarEnPanel(indice, receta) {
    if (panelDeReceta(receta.id) !== -1) return "repetida";
    panelesComparador[indice] = receta;
    notificarCambioComparador();
    return "colocada";
}

function vaciarPanel(indice) {
    panelesComparador[indice] = null;
    notificarCambioComparador();
}

function intercambiarPaneles() {
    panelesComparador.reverse();
    notificarCambioComparador();
}
