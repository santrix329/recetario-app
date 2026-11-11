/*
 * app.js
 * punto de entrada de la spa: monta la barra de navegacion.
 */

// nombre provisional: el enunciado pide uno original distinto de "Recetario"
const NOMBRE_APP = "Recetario";

const RUTAS_NAVEGACION = [
    { id: "inicio", texto: "Inicio" },
    { id: "explorar", texto: "Explorar" },
    { id: "categorias", texto: "Categorías y orígenes" },
    { id: "comparador", texto: "Comparador" },
];

let barraNavegacion = null;

document.addEventListener("DOMContentLoaded", () => {
    const contenedorNavegacion = document.querySelector("#contenedor-navegacion");

    barraNavegacion = new BarraNavegacion(contenedorNavegacion, {
        nombreApp: NOMBRE_APP,
        rutas: RUTAS_NAVEGACION,
        vistaActiva: "inicio",
        cantidadComparador: 0,
    }).montar();

    contenedorNavegacion.addEventListener("navegacion:ir", (evento) => {
        barraNavegacion.marcarActiva(evento.detail.vista);
    });
});
