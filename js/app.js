/*
 * app.js
 * punto de entrada de la spa: monta la barra de navegacion y cambia de vista.
 *
 * al cambiar de vista:
 *   1. la vista que se va exporta su estado (busqueda, filtros, pagina)
 *   2. se destruye junto con todos sus pseudocomponentes
 *   3. se monta la nueva con su estado guardado, si lo tenia
 */

// nombre provisional: el enunciado pide uno original distinto de "Recetario"
const NOMBRE_APP = "Recetario";

const RUTAS_NAVEGACION = [
    { id: "inicio", texto: "Inicio" },
    { id: "explorar", texto: "Explorar" },
    { id: "categorias", texto: "Categorías y orígenes" },
    { id: "comparador", texto: "Comparador" },
];

const VISTAS = {
    inicio: { Clase: VistaPendiente, titulo: "Inicio" },
    explorar: { Clase: VistaPendiente, titulo: "Explorar" },
    categorias: { Clase: VistaPendiente, titulo: "Categorías y orígenes" },
    comparador: { Clase: VistaPendiente, titulo: "Comparador" },
    detalle: { Clase: VistaPendiente, titulo: "Detalle de receta" },
};

// estado de la sesion: vive solo en memoria y se pierde al recargar
const sesion = {
    idVistaActual: null,
    vistaActual: null,
    estadosGuardados: {},
    comparador: [null, null],
};

let barraNavegacion = null;
let contenedorVistas = null;

function navegarA(idVista, parametros = {}, { enfocar = true } = {}) {
    const definicion = VISTAS[idVista];
    if (!definicion) return;

    if (sesion.vistaActual) {
        sesion.estadosGuardados[sesion.idVistaActual] = sesion.vistaActual.exportarEstado();
        sesion.vistaActual.destruir();
    }

    sesion.idVistaActual = idVista;
    sesion.vistaActual = new definicion.Clase(contenedorVistas, {
        titulo: definicion.titulo,
        parametros,
        estadoGuardado: sesion.estadosGuardados[idVista] ?? null,
    }).montar();

    // el detalle no esta en la barra: se resalta la seccion desde la que se llego
    barraNavegacion.marcarActiva(idVista === "detalle" ? parametros.origen : idVista);

    window.scrollTo({ top: 0 });
    if (enfocar) contenedorVistas.querySelector(".vista__titulo")?.focus({ preventScroll: true });
}

function cantidadEnComparador() {
    return sesion.comparador.filter(Boolean).length;
}

document.addEventListener("DOMContentLoaded", () => {
    const contenedorNavegacion = document.querySelector("#contenedor-navegacion");
    contenedorVistas = document.querySelector("#app");

    barraNavegacion = new BarraNavegacion(contenedorNavegacion, {
        nombreApp: NOMBRE_APP,
        rutas: RUTAS_NAVEGACION,
        vistaActiva: "inicio",
        cantidadComparador: cantidadEnComparador(),
    }).montar();

    // los pseudocomponentes avisan con CustomEvent; app.js decide a donde ir
    contenedorNavegacion.addEventListener("navegacion:ir", (evento) => {
        navegarA(evento.detail.vista);
    });

    contenedorVistas.addEventListener("receta:abrir", (evento) => {
        navegarA("detalle", { id: evento.detail.id, origen: sesion.idVistaActual });
    });

    contenedorVistas.addEventListener("categoria:abrir", (evento) => {
        navegarA("categorias", { pestana: "categorias", seleccion: evento.detail.nombre });
    });

    navegarA("inicio", {}, { enfocar: false });
});
