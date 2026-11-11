/*
 * app.js
 * punto de entrada de la spa: monta la barra de navegacion, cambia de vista
 * y resuelve las acciones que cruzan vistas (abrir una receta, volver,
 * agregar al comparador).
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
    inicio: { Clase: VistaInicio, titulo: "Inicio" },
    explorar: { Clase: VistaPendiente, titulo: "Explorar" },
    categorias: { Clase: VistaPendiente, titulo: "Categorías y orígenes" },
    comparador: { Clase: VistaPendiente, titulo: "Comparador" },
    detalle: { Clase: VistaDetalle, titulo: "Detalle de receta" },
};

// estado de navegacion de la sesion: vive solo en memoria
const sesion = {
    idVistaActual: null,
    vistaActual: null,
    estadosGuardados: {},
    // vista a la que vuelve el boton volver del detalle
    origenDetalle: "inicio",
};

let barraNavegacion = null;
let contenedorVistas = null;
let capaAvisos = null;
let capaDialogos = null;
let avisoActual = null;
let dialogoActual = null;
// receta que espera a que el usuario elija que panel reemplazar
let recetaPorColocar = null;

// ---------------------------------------------------------------------------
// navegacion

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
    barraNavegacion.marcarActiva(idVista === "detalle" ? sesion.origenDetalle : idVista);

    window.scrollTo({ top: 0 });
    if (enfocar) contenedorVistas.querySelector(".vista__titulo")?.focus({ preventScroll: true });
}

function abrirReceta(id) {
    // desde una receta relacionada se sigue volviendo a la vista de origen original
    if (sesion.idVistaActual !== "detalle") sesion.origenDetalle = sesion.idVistaActual;
    navegarA("detalle", { id, origen: sesion.origenDetalle });
}

function volverDesdeDetalle() {
    navegarA(sesion.origenDetalle);
}

// ---------------------------------------------------------------------------
// avisos en pantalla

function mostrarAviso(mensaje, tipo = "info") {
    cerrarAviso();
    avisoActual = new Aviso(capaAvisos, { mensaje, tipo }).montar();
}

function cerrarAviso() {
    avisoActual?.destruir();
    avisoActual = null;
}

// ---------------------------------------------------------------------------
// comparador: la receta ocupa el primer panel libre; si los dos estan
// ocupados se pregunta en pantalla cual reemplazar

async function agregarAlComparador(id) {
    try {
        const panelOcupado = panelDeReceta(id);
        if (panelOcupado !== -1) {
            mostrarAviso(`Esa receta ya está en el panel ${LETRAS_PANELES[panelOcupado]}: no se puede comparar consigo misma.`, "info");
            return;
        }

        // el comparador necesita la receta completa (sale de la cache si ya se pidio)
        const receta = await obtenerRecetaPorId(id);
        if (!receta) {
            mostrarAviso("No se encontró la receta para agregarla al comparador.", "error");
            return;
        }

        const libre = primerPanelLibre();
        if (libre === -1) {
            preguntarPanelAReemplazar(receta);
            return;
        }
        colocarEnPanel(libre, receta);
        mostrarAviso(`«${receta.nombre}» se agregó al panel ${LETRAS_PANELES[libre]} del comparador.`, "exito");
    } catch (error) {
        mostrarAviso(error instanceof ErrorApi ? error.message : "No se pudo agregar la receta al comparador.", "error");
    }
}

function preguntarPanelAReemplazar(receta) {
    cerrarDialogo();
    recetaPorColocar = receta;
    dialogoActual = new DialogoReemplazo(capaDialogos, { receta, paneles: recetasEnComparador() }).montar();
}

function reemplazarPanel(indice) {
    const receta = recetaPorColocar;
    const reemplazada = recetasEnComparador()[indice];
    cerrarDialogo();
    if (!receta || !reemplazada) return;

    if (colocarEnPanel(indice, receta) === "repetida") {
        mostrarAviso("Esa receta ya está en el comparador: no se puede comparar consigo misma.", "info");
        return;
    }
    mostrarAviso(`«${receta.nombre}» reemplazó a «${reemplazada.nombre}» en el panel ${LETRAS_PANELES[indice]}.`, "exito");
}

function cerrarDialogo() {
    dialogoActual?.destruir();
    dialogoActual = null;
    recetaPorColocar = null;
}

// ---------------------------------------------------------------------------

function crearCapa(clase, atributos = {}) {
    const capa = crearNodo("div", { clase, atributos });
    document.body.append(capa);
    return capa;
}

document.addEventListener("DOMContentLoaded", () => {
    const contenedorNavegacion = document.querySelector("#contenedor-navegacion");
    contenedorVistas = document.querySelector("#app");
    capaAvisos = crearCapa("capa-avisos", { "aria-live": "polite" });
    capaDialogos = crearCapa("capa-dialogos");

    barraNavegacion = new BarraNavegacion(contenedorNavegacion, {
        nombreApp: NOMBRE_APP,
        rutas: RUTAS_NAVEGACION,
        vistaActiva: "inicio",
        cantidadComparador: cantidadEnComparador(),
    }).montar();

    // la sesion del comparador avisa cada cambio; la barra muestra cuantas hay
    avisosComparador.addEventListener("cambio", () => {
        barraNavegacion.mostrarCantidadComparador(cantidadEnComparador());
    });

    // los pseudocomponentes avisan con CustomEvent; app.js decide que hacer
    contenedorNavegacion.addEventListener("navegacion:ir", (evento) => {
        navegarA(evento.detail.vista);
    });

    contenedorVistas.addEventListener("receta:abrir", (evento) => abrirReceta(evento.detail.id));
    contenedorVistas.addEventListener("vista:volver", () => volverDesdeDetalle());
    contenedorVistas.addEventListener("receta:comparar", (evento) => agregarAlComparador(evento.detail.id));
    contenedorVistas.addEventListener("categoria:abrir", (evento) => {
        navegarA("categorias", { pestana: "categorias", seleccion: evento.detail.nombre });
    });

    capaAvisos.addEventListener("aviso:cerrar", () => cerrarAviso());
    capaDialogos.addEventListener("reemplazo:elegir", (evento) => reemplazarPanel(evento.detail.indice));
    capaDialogos.addEventListener("reemplazo:cancelar", () => cerrarDialogo());

    navegarA("inicio", {}, { enfocar: false });
});
