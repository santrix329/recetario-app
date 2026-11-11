/*
 * VistaCategoriasOrigenes
 * dos pestanas, categorias y origenes. cada una muestra su listado de
 * opciones y la ficha de la opcion elegida con sus recetas paginadas.
 *
 * la lista de opciones y la ficha son secciones independientes, cada una con
 * su propio turno ("lista" y "ficha"): si el usuario cambia de pestana o de
 * opcion antes de que termine una carga, la respuesta tardia se descarta y
 * cada error reintenta solo su seccion.
 *
 * estado inicial: los parametros { pestana, seleccion } (llegan al hacer clic
 * en una categoria de inicio) ganan al estado guardado al volver a la vista.
 *
 * escucha:      "pestanas:cambiar", "opcion:elegir", "listado:pagina",
 *               "estado:reintentar"
 * deja subir:   "receta:abrir" y "receta:comparar" (los resuelve app.js)
 * estado que exporta: { pestana, seleccion, pagina }
 */

const PESTANAS_VISTA_CATEGORIAS = Object.freeze([
    { id: "categorias", texto: "Categorías" },
    { id: "origenes", texto: "Orígenes" },
]);
const ID_PANEL_VISTA_CATEGORIAS = "panel-categorias-origenes";
const FANTASMAS_OPCIONES_VISTA_CATEGORIAS = 14;
const FANTASMAS_FICHA_VISTA_CATEGORIAS = 6;

// textos que cambian segun la pestana activa
const TEXTOS_VISTA_CATEGORIAS = Object.freeze({
    categorias: {
        etiqueta: "Categorías",
        tipo: "Categoría",
        tituloSinSeleccion: "Ninguna categoría elegida",
        sinSeleccion: "Elige una categoría para ver su ficha y sus recetas.",
        sinRecetas: "Esta categoría todavía no tiene recetas en TheMealDB.",
        tituloSinOpciones: "No hay categorías",
        sinOpciones: "El servicio no devolvió categorías para mostrar.",
    },
    origenes: {
        etiqueta: "Orígenes",
        tipo: "Origen",
        tituloSinSeleccion: "Ningún origen elegido",
        sinSeleccion: "Elige un origen para ver sus recetas.",
        sinRecetas: "Este origen todavía no tiene recetas en TheMealDB.",
        tituloSinOpciones: "No hay orígenes",
        sinOpciones: "El servicio no devolvió orígenes para mostrar.",
    },
});

class VistaCategoriasOrigenes extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.estado = this.calcularEstadoInicial(propiedades);
        this.pestanas = null;
        this.listaOpciones = null;
        this.zonaPestanas = null;
        this.panel = null;
        this.zonaOpciones = null;
        this.zonaFicha = null;
    }

    // los parametros de navegacion ganan; si no hay, se recupera lo guardado
    calcularEstadoInicial({ parametros, estadoGuardado }) {
        const pedido = parametros ?? {};
        if (pedido.pestana || pedido.seleccion) {
            return {
                pestana: this.pestanaValida(pedido.pestana),
                seleccion: pedido.seleccion || null,
                pagina: 1,
            };
        }
        if (estadoGuardado) {
            return {
                pestana: this.pestanaValida(estadoGuardado.pestana),
                seleccion: estadoGuardado.seleccion || null,
                pagina: estadoGuardado.pagina ?? 1,
            };
        }
        return { pestana: "categorias", seleccion: null, pagina: 1 };
    }

    pestanaValida(id) {
        return PESTANAS_VISTA_CATEGORIAS.some((pestana) => pestana.id === id) ? id : "categorias";
    }

    get textos() {
        return TEXTOS_VISTA_CATEGORIAS[this.estado.pestana];
    }

    montar() {
        super.montar();
        this.pestanas = this.montarHijo(new Pestanas(this.zonaPestanas, {
            pestanas: PESTANAS_VISTA_CATEGORIAS,
            activa: this.estado.pestana,
            idPanel: ID_PANEL_VISTA_CATEGORIAS,
            etiqueta: "Explorar por categorías u orígenes",
        }));
        // con las pestanas ya montadas el panel puede rotularse con la activa
        this.renderizar();
        this.abrirPestana();
        return this;
    }

    crearElemento() {
        const vista = crearNodo("div", { clase: "vista vista-categorias" });

        const encabezado = crearNodo("header", {
            clase: "categorias__encabezado",
            hijos: [
                crearNodo("h1", { clase: "vista__titulo", texto: "Categorías y orígenes", atributos: { tabindex: "-1" } }),
                crearNodo("p", {
                    clase: "categorias__bajada",
                    texto: "Recorre la cocina por tipo de plato o viaja por el origen de cada receta.",
                }),
            ],
        });

        this.zonaPestanas = crearNodo("div", { clase: "categorias__pestanas" });
        this.zonaOpciones = crearNodo("div", { clase: "categorias__opciones" });
        this.zonaFicha = crearNodo("div", { clase: "categorias__ficha" });
        this.panel = crearNodo("div", {
            clase: "categorias__panel",
            atributos: { id: ID_PANEL_VISTA_CATEGORIAS, role: "tabpanel" },
            hijos: [this.zonaOpciones, this.zonaFicha],
        });

        vista.append(encabezado, crearNodo("div", {
            clase: "categorias__explorador",
            hijos: [this.zonaPestanas, this.panel],
        }));
        return vista;
    }

    renderizar() {
        if (this.pestanas) {
            this.panel.setAttribute("aria-labelledby", this.pestanas.idDePestana(this.estado.pestana));
        }
    }

    configurarEventos() {
        this.escuchar(this.elemento, "pestanas:cambiar", (evento) => {
            this.cambiarPestana(evento.detail.id);
        });

        this.escuchar(this.elemento, "opcion:elegir", (evento) => {
            this.elegirOpcion(evento.detail.valor);
        });

        // el listado avisa cada cambio de pagina para poder restaurarla al volver
        this.escuchar(this.elemento, "listado:pagina", (evento) => {
            this.actualizarEstado({ pagina: evento.detail.pagina });
        });

        this.escuchar(this.elemento, "estado:reintentar", (evento) => {
            if (evento.detail.seccion === "lista") this.cargarLista({ enfocar: true });
            if (evento.detail.seccion === "ficha") this.cargarFicha({ pagina: this.estado.pagina, enfocar: true });
        });
    }

    exportarEstado() {
        const { pestana, seleccion, pagina } = this.estado;
        return { pestana, seleccion, pagina };
    }

    // -------------------------------------------------------------------
    // acciones del usuario

    cambiarPestana(id) {
        const pestana = this.pestanaValida(id);
        if (pestana === this.estado.pestana) return;
        // al cambiar de pestana la seleccion anterior deja de tener sentido
        this.actualizarEstado({ pestana, seleccion: null, pagina: 1 });
        this.abrirPestana();
    }

    elegirOpcion(valor) {
        if (!valor || valor === this.estado.seleccion) return;
        this.actualizarEstado({ seleccion: valor, pagina: 1 });
        this.listaOpciones?.marcar(valor);
        this.cargarFicha({ pagina: 1 });
    }

    // la lista y la ficha se piden a la vez y cada una pinta su propia seccion;
    // al restaurar, la ficha reabre la seleccion en la pagina guardada
    abrirPestana() {
        this.cargarLista();
        if (this.estado.seleccion) this.cargarFicha({ pagina: this.estado.pagina });
        else this.mostrarSinSeleccion();
    }

    // -------------------------------------------------------------------
    // cargas

    async cargarLista({ enfocar = false } = {}) {
        const turno = this.iniciarOperacion("lista");
        const { pestana } = this.estado;
        this.reemplazarLista(new EstadoCarga(this.zonaOpciones, {
            tipo: "carga",
            forma: "opciones",
            cantidad: FANTASMAS_OPCIONES_VISTA_CATEGORIAS,
        }));

        try {
            // las dos listas se piden una sola vez por sesion (cache en memoria)
            const datos = await (pestana === "categorias" ? obtenerCategorias() : obtenerOrigenes());
            if (this.sigueVigente("lista", turno)) this.mostrarLista(pestana, datos);
        } catch (error) {
            if (this.sigueVigente("lista", turno)) this.mostrarError("lista", error, { enfocar });
        }
    }

    async cargarFicha({ pagina = 1, enfocar = false } = {}) {
        const turno = this.iniciarOperacion("ficha");
        const { pestana, seleccion } = this.estado;
        this.reemplazarFicha(new EstadoCarga(this.zonaFicha, {
            tipo: "carga",
            forma: "tarjetas",
            cantidad: FANTASMAS_FICHA_VISTA_CATEGORIAS,
        }));

        try {
            if (pestana === "categorias") {
                // Promise.all: la ficha necesita a la vez los datos de la categoria
                // (imagen y descripcion) y sus recetas; sin una de las dos no hay ficha
                const [categorias, recetas] = await Promise.all([
                    obtenerCategorias(),
                    filtrarPorCategoria(seleccion),
                ]);
                if (!this.sigueVigente("ficha", turno)) return;
                const categoria = categorias.find((candidata) => candidata.nombre === seleccion);
                this.mostrarFicha(
                    { titulo: seleccion, imagen: categoria?.imagen, descripcion: categoria?.descripcion },
                    recetas,
                    pagina
                );
            } else {
                const recetas = await filtrarPorOrigen(seleccion);
                if (this.sigueVigente("ficha", turno)) this.mostrarFicha({ titulo: seleccion }, recetas, pagina);
            }
        } catch (error) {
            if (this.sigueVigente("ficha", turno)) this.mostrarError("ficha", error, { enfocar });
        }
    }

    // -------------------------------------------------------------------
    // pintado de cada seccion

    reemplazarLista(componente) {
        this.vaciarRanura("lista");
        this.listaOpciones = null;
        return this.montarEnRanura("lista", componente);
    }

    reemplazarFicha(...componentes) {
        this.vaciarRanura("ficha");
        return componentes.map((componente) => this.montarEnRanura("ficha", componente));
    }

    mostrarLista(pestana, datos) {
        const textos = TEXTOS_VISTA_CATEGORIAS[pestana];
        if (datos.length === 0) {
            this.reemplazarLista(new EstadoCarga(this.zonaOpciones, {
                tipo: "vacio",
                titulo: textos.tituloSinOpciones,
                mensaje: textos.sinOpciones,
            }));
            return;
        }

        // categorias llegan como objetos y origenes como textos; la lista solo usa el nombre
        const nombres = pestana === "categorias" ? datos.map((categoria) => categoria.nombre) : datos;
        const opciones = [...nombres]
            .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
            .map((nombre) => ({ valor: nombre, texto: nombre }));

        this.listaOpciones = this.reemplazarLista(new ListaOpciones(this.zonaOpciones, {
            opciones,
            seleccionada: this.estado.seleccion,
            etiqueta: textos.etiqueta,
            conFiltro: pestana === "origenes",
        }));
    }

    mostrarFicha(datosFicha, recetas, pagina) {
        const encabezado = new EncabezadoFicha(this.zonaFicha, {
            ...datosFicha,
            tipo: this.textos.tipo,
            cantidad: recetas.length,
        });

        if (recetas.length === 0) {
            this.reemplazarFicha(encabezado, new EstadoCarga(this.zonaFicha, {
                tipo: "vacio",
                titulo: "Sin recetas",
                mensaje: this.textos.sinRecetas,
            }));
            this.actualizarEstado({ pagina: 1 });
            return;
        }

        // el encabezado ya dice cuantas recetas hay: el listado no repite el total
        this.reemplazarFicha(encabezado, new ListadoRecetas(this.zonaFicha, {
            recetas: ordenarPorNombre(recetas),
            pagina,
            mostrarTotal: false,
        }));
    }

    mostrarSinSeleccion() {
        // un turno nuevo descarta cualquier ficha que siga en camino
        this.iniciarOperacion("ficha");
        this.reemplazarFicha(new EstadoCarga(this.zonaFicha, {
            tipo: "vacio",
            titulo: this.textos.tituloSinSeleccion,
            mensaje: this.textos.sinSeleccion,
        }));
    }

    mostrarError(seccion, error, { enfocar = false } = {}) {
        const zona = seccion === "lista" ? this.zonaOpciones : this.zonaFicha;
        const estadoError = new EstadoCarga(zona, { tipo: "error", error, seccion });
        if (seccion === "lista") this.reemplazarLista(estadoError);
        else this.reemplazarFicha(estadoError);
        if (enfocar) estadoError.enfocar();
    }
}
