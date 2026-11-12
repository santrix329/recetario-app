/*
 * dom.js
 * ayuda para construir nodos sin innerHTML.
 * el texto siempre entra por textContent, asi un dato de la api nunca se
 * interpreta como html (un nombre con "<img onerror=...>" se ve como texto).
 */

// opciones: { clase, texto, atributos: { nombre: valor }, hijos: [nodos] }
// un atributo con valor null, undefined o false no se agrega
function crearNodo(etiqueta, opciones = {}) {
    const { clase, texto, atributos = {}, hijos = [] } = opciones;
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined && texto !== null) nodo.textContent = String(texto);
    for (const [nombre, valor] of Object.entries(atributos)) {
        if (valor === undefined || valor === null || valor === false) continue;
        nodo.setAttribute(nombre, valor === true ? "" : String(valor));
    }
    for (const hijo of hijos) {
        if (hijo) nodo.append(hijo);
    }
    return nodo;
}
