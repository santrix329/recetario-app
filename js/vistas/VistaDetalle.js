/*
 * VistaDetalle
 * detalle completo de una receta: cabecera, ingredientes, pasos y dos
 * secciones de recetas relacionadas (misma categoria y mismo origen).
 *
 * las relacionadas se piden en paralelo con Promise.allSettled: si una
 * consulta falla, la otra seccion se muestra igual y la que fallo ofrece
 * reintentar solo su parte.
 *
 * parametros: { id, origen }  (origen = vista desde la que se llego)
 * escucha:    "estado:reintentar" y el clic del boton volver
 * emite:      "vista:volver" {} (app.js regresa a la vista de origen)
 * deja subir: "receta:abrir" y "receta:comparar" (los resuelve app.js)
 */

const NOMBRES_VISTAS_ORIGEN = {
    inicio: "Inicio",
    explorar: "Explorar",
    categorias: "Categorías y orígenes",
    comparador: "Comparador",
};

const MAXIMO_RELACIONADAS = 6;
const CANTIDAD_FANTASMAS_RELACIONADAS = 3;
const TITULO_CARGANDO_RECETA = "Cargando receta…";

// cada seccion relacionada sabe que dato de la receta usa y como nombrarse
const SECCIONES_RELACIONADAS = {
    "relacionadas-categoria": {
        campo: "categoria",
        titulo: (valor) => (valor ? `Más recetas de ${valor}` : "Más recetas de la misma categoría"),
        sinDato: "Esta receta no tiene una categoría registrada.",
        sinResultados: "No hay otras recetas de esta categoría.",
    },
    "relacionadas-origen": {
        campo: "origen",
        titulo: (valor) => (valor ? `Más recetas de cocina ${valor}` : "Más recetas del mismo origen"),
        sinDato: "Esta receta no tiene un origen registrado.",
        sinResultados: "No hay otras recetas de este origen.",
    },
};

class VistaDetalle extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        const parametros = propiedades.parametros ?? {};
        this.idReceta = parametros.id ?? null;
        this.origen = parametros.origen ?? null;
        this.estado = { receta: null, titulo: TITULO_CARGANDO_RECETA };

        this.titulo = null;
        this.zonaEstadoReceta = null;
        this.contenido = null;
        this.zonaCabecera = null;
        this.columnaIngredientes = null;
        this.columnaPasos = null;
        this.titulosRelacionadas = {};
        this.zonasRelacionadas = {};
    }

    montar() {
        super.montar();
        this.cargarReceta();
        return this;
    }

    crearElemento() {
        const vista = crearNodo("div", { clase: "vista vista-detalle" });

        const nombreOrigen = NOMBRES_VISTAS_ORIGEN[this.origen];
        const volver = crearNodo("button", {
            clase: "boton boton--chico detalle__volver",
            atributos: { type: "button", "data-accion": "volver" },
            hijos: [
                crearNodo("span", { texto: "←", atributos: { "aria-hidden": "true" } }),
                crearNodo("span", { texto: nombreOrigen ? `Volver a ${nombreOrigen}` : "Volver" }),
            ],
        });

        this.titulo = crearNodo("h1", { clase: "vista__titulo", atributos: { tabindex: "-1" } });
        const encabezado = crearNodo("header", {
            clase: "detalle__encabezado",
            hijos: [crearNodo("div", { clase: "detalle__barra", hijos: [volver] }), this.titulo],
        });

        this.zonaEstadoReceta = crearNodo("div", { clase: "detalle__zona" });

        // el contenido queda oculto hasta que la receta llega
        this.zonaCabecera = crearNodo("div", { clase: "detalle__zona" });
        this.columnaIngredientes = crearNodo("div", { clase: "detalle__columna detalle__columna--ingredientes" });
        this.columnaPasos = crearNodo("div", { clase: "detalle__columna detalle__columna--pasos" });
        const cuerpo = crearNodo("div", {
            clase: "detalle__cuerpo",
            hijos: [this.columnaIngredientes, this.columnaPasos],
        });

        this.contenido = crearNodo("div", {
            clase: "detalle__contenido",
            atributos: { hidden: true },
            hijos: [
                this.zonaCabecera,
                cuerpo,
                this.crearSeccionRelacionada("relacionadas-categoria"),
                this.crearSeccionRelacionada("relacionadas-origen"),
            ],
        });

        vista.append(encabezado, this.zonaEstadoReceta, this.contenido);
        return vista;
    }

    crearSeccionRelacionada(seccion) {
        const idTitulo = `titulo-${seccion}`;
        this.titulosRelacionadas[seccion] = crearNodo("h2", { clase: "seccion__titulo", atributos: { id: idTitulo } });
        this.zonasRelacionadas[seccion] = crearNodo("div", { clase: "detalle__zona" });
        return crearNodo("section", {
            clase: "seccion detalle__relacionadas",
            atributos: { "aria-labelledby": idTitulo },
            hijos: [this.titulosRelacionadas[seccion], this.zonasRelacionadas[seccion]],
        });
    }

    renderizar() {
        const { receta, titulo } = this.estado;
        this.titulo.textContent = titulo;
        this.contenido.hidden = !receta;
        if (!receta) return;
        for (const [seccion, configuracion] of Object.entries(SECCIONES_RELACIONADAS)) {
            this.titulosRelacionadas[seccion].textContent = configuracion.titulo(receta[configuracion.campo]);
        }
    }

    configurarEventos() {
        this.escuchar(this.elemento, "click", (evento) => {
            if (evento.target.closest("[data-accion='volver']")) this.emitir("vista:volver", {});
        });

        this.escuchar(this.elemento, "estado:reintentar", (evento) => {
            const { seccion } = evento.detail;
            if (seccion === "receta") this.cargarReceta({ enfocar: true });
            if (SECCIONES_RELACIONADAS[seccion]) this.recargarRelacionada(seccion);
        });
    }

    // -------------------------------------------------------------------
    // carga de la receta

    async cargarReceta({ enfocar = false } = {}) {
        const turno = this.iniciarOperacion("receta");
        this.mostrarCargaReceta();

        // sin id no hay nada que pedir
        if (!this.idReceta) {
            this.mostrarRecetaNoEncontrada();
            return;
        }

        try {
            const receta = await obtenerRecetaPorId(this.idReceta);
            if (!this.sigueVigente("receta", turno)) return;
            if (receta) this.mostrarReceta(receta);
            else this.mostrarRecetaNoEncontrada();
        } catch (error) {
            if (this.sigueVigente("receta", turno)) this.mostrarErrorReceta(error, { enfocar });
        }
    }

    mostrarCargaReceta() {
        this.vaciarRanura("receta");
        this.actualizarEstado({ titulo: TITULO_CARGANDO_RECETA });
        this.montarEnRanura("receta", new EstadoCarga(this.zonaEstadoReceta, { tipo: "carga", forma: "detalle" }));
    }

    mostrarRecetaNoEncontrada() {
        this.vaciarRanura("receta");
        this.actualizarEstado({ titulo: "Receta no encontrada" });
        this.montarEnRanura("receta", new EstadoCarga(this.zonaEstadoReceta, {
            tipo: "vacio",
            titulo: "Receta no encontrada",
            mensaje: "Puede que el enlace sea antiguo o que la receta ya no exista.",
        }));
    }

    mostrarErrorReceta(error, { enfocar = false } = {}) {
        this.vaciarRanura("receta");
        this.actualizarEstado({ titulo: "No pudimos cargar la receta" });
        const estado = this.montarEnRanura("receta", new EstadoCarga(this.zonaEstadoReceta, {
            tipo: "error",
            error,
            seccion: "receta",
        }));
        if (enfocar) estado.enfocar();
    }

    mostrarReceta(receta) {
        this.vaciarRanura("receta");
        this.vaciarRanura("contenido");
        this.actualizarEstado({ receta, titulo: receta.nombre });

        this.montarEnRanura("contenido", new CabeceraReceta(this.zonaCabecera, { receta }));
        this.montarEnRanura("contenido", new ListaIngredientes(this.columnaIngredientes, { ingredientes: receta.ingredientes }));
        this.montarEnRanura("contenido", new PasosPreparacion(this.columnaPasos, { pasos: receta.pasos }));

        this.cargarRelacionadas(receta);
    }

    // -------------------------------------------------------------------
    // recetas relacionadas

    async cargarRelacionadas(receta) {
        const turnoCategoria = this.iniciarOperacion("relacionadas-categoria");
        const turnoOrigen = this.iniciarOperacion("relacionadas-origen");
        this.mostrarCargaRelacionada("relacionadas-categoria");
        this.mostrarCargaRelacionada("relacionadas-origen");

        try {
            // allSettled nunca se rechaza: cada seccion recibe su propio
            // resultado y el fallo de una no oculta a la otra
            const [porCategoria, porOrigen] = await Promise.allSettled([
                this.pedirRelacionadas("relacionadas-categoria", receta),
                this.pedirRelacionadas("relacionadas-origen", receta),
            ]);
            this.resolverRelacionada("relacionadas-categoria", turnoCategoria, porCategoria, receta);
            this.resolverRelacionada("relacionadas-origen", turnoOrigen, porOrigen, receta);
        } catch (error) {
            if (this.sigueVigente("relacionadas-categoria", turnoCategoria)) this.mostrarErrorRelacionada("relacionadas-categoria", error);
            if (this.sigueVigente("relacionadas-origen", turnoOrigen)) this.mostrarErrorRelacionada("relacionadas-origen", error);
        }
    }

    resolverRelacionada(seccion, turno, resultado, receta) {
        if (!this.sigueVigente(seccion, turno)) return;
        if (resultado.status === "fulfilled") this.mostrarRelacionadas(seccion, resultado.value, receta);
        else this.mostrarErrorRelacionada(seccion, resultado.reason);
    }

    // el reintento solo vuelve a pedir la seccion que fallo
    async recargarRelacionada(seccion) {
        const { receta } = this.estado;
        if (!receta) return;
        const turno = this.iniciarOperacion(seccion);
        this.mostrarCargaRelacionada(seccion);
        try {
            const recetas = await this.pedirRelacionadas(seccion, receta);
            if (this.sigueVigente(seccion, turno)) this.mostrarRelacionadas(seccion, recetas, receta);
        } catch (error) {
            if (this.sigueVigente(seccion, turno)) this.mostrarErrorRelacionada(seccion, error, { enfocar: true });
        }
    }

    // no es async: devuelve la promesa del filtro (o una lista vacia si la
    // receta no tiene ese dato) y el error lo maneja quien la espera
    pedirRelacionadas(seccion, receta) {
        const valor = receta[SECCIONES_RELACIONADAS[seccion].campo];
        if (!valor) return Promise.resolve([]);
        return seccion === "relacionadas-categoria" ? filtrarPorCategoria(valor) : filtrarPorOrigen(valor);
    }

    // excluye la receta actual, ordena por nombre y se queda con las primeras
    seleccionarRelacionadas(recetas, receta) {
        const otras = recetas.filter((relacionada) => relacionada.id !== receta.id);
        return ordenarPorNombre(otras).slice(0, MAXIMO_RELACIONADAS);
    }

    mostrarCargaRelacionada(seccion) {
        this.vaciarRanura(seccion);
        this.montarEnRanura(seccion, new EstadoCarga(this.zonasRelacionadas[seccion], {
            tipo: "carga",
            forma: "tarjetas",
            cantidad: CANTIDAD_FANTASMAS_RELACIONADAS,
        }));
    }

    mostrarRelacionadas(seccion, recetas, receta) {
        this.vaciarRanura(seccion);
        const configuracion = SECCIONES_RELACIONADAS[seccion];
        const seleccion = this.seleccionarRelacionadas(recetas, receta);

        if (seleccion.length === 0) {
            this.montarEnRanura(seccion, new EstadoCarga(this.zonasRelacionadas[seccion], {
                tipo: "vacio",
                titulo: "Sin recetas relacionadas",
                mensaje: receta[configuracion.campo] ? configuracion.sinResultados : configuracion.sinDato,
            }));
            return;
        }

        // el listado resuelve en paralelo el detalle de cada tarjeta
        this.montarEnRanura(seccion, new ListadoRecetas(this.zonasRelacionadas[seccion], {
            recetas: seleccion,
            porPagina: MAXIMO_RELACIONADAS,
            conPaginador: false,
            mostrarTotal: false,
        }));
    }

    mostrarErrorRelacionada(seccion, error, { enfocar = false } = {}) {
        this.vaciarRanura(seccion);
        const estado = this.montarEnRanura(seccion, new EstadoCarga(this.zonasRelacionadas[seccion], {
            tipo: "error",
            error,
            seccion,
        }));
        if (enfocar) estado.enfocar();
    }
}
