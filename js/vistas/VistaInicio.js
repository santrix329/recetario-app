/*
 * VistaInicio
 * receta destacada al azar y cuadricula de categorias.
 *
 * la receta destacada y las categorias se piden en paralelo con
 * Promise.allSettled: si una falla, la otra se muestra igual y la que fallo
 * muestra su propio error con opcion de reintentar.
 *
 * escucha:      "destacada:otra", "estado:reintentar"
 * deja subir:   "receta:abrir" y "categoria:abrir" (los resuelve app.js)
 * estado que exporta: { idDestacada } para no repetir la receta al volver
 */

const INTENTOS_RECETA_DISTINTA = 5;
const CANTIDAD_FANTASMAS_CATEGORIAS = 8;

class VistaInicio extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.estado = { idDestacada: propiedades.estadoGuardado?.idDestacada ?? null };
        this.zonaDestacada = null;
        this.zonaEstadoCategorias = null;
        this.cuadriculaCategorias = null;
    }

    montar() {
        super.montar();
        this.cargarInicio();
        return this;
    }

    crearElemento() {
        const vista = crearNodo("div", { clase: "vista vista-inicio" });

        const encabezado = crearNodo("header", {
            clase: "inicio__encabezado",
            hijos: [
                crearNodo("h1", { clase: "vista__titulo", texto: "¿Qué cocinamos hoy?", atributos: { tabindex: "-1" } }),
                crearNodo("p", {
                    clase: "inicio__bajada",
                    texto: "Una receta al azar para inspirarte y todas las categorías para seguir explorando.",
                }),
            ],
        });

        this.zonaDestacada = crearNodo("div", { clase: "inicio__zona" });
        const seccionDestacada = crearNodo("section", {
            clase: "seccion",
            atributos: { "aria-labelledby": "titulo-destacada" },
            hijos: [
                crearNodo("h2", { clase: "seccion__titulo", texto: "Receta destacada", atributos: { id: "titulo-destacada" } }),
                this.zonaDestacada,
            ],
        });

        this.zonaEstadoCategorias = crearNodo("div", { clase: "inicio__zona" });
        this.cuadriculaCategorias = crearNodo("div", { clase: "cuadricula" });
        const seccionCategorias = crearNodo("section", {
            clase: "seccion",
            atributos: { "aria-labelledby": "titulo-categorias" },
            hijos: [
                crearNodo("h2", { clase: "seccion__titulo", texto: "Categorías", atributos: { id: "titulo-categorias" } }),
                crearNodo("p", { clase: "seccion__descripcion", texto: "Elige una para ver su ficha y todas sus recetas." }),
                this.zonaEstadoCategorias,
                this.cuadriculaCategorias,
            ],
        });

        vista.append(encabezado, seccionDestacada, seccionCategorias);
        return vista;
    }

    configurarEventos() {
        this.escuchar(this.elemento, "destacada:otra", () => {
            this.mostrarOtraReceta({ enfocar: true });
        });

        this.escuchar(this.elemento, "estado:reintentar", (evento) => {
            if (evento.detail.seccion === "destacada") this.mostrarOtraReceta({ enfocar: true });
            if (evento.detail.seccion === "categorias") this.recargarCategorias();
        });
    }

    exportarEstado() {
        return { idDestacada: this.estado.idDestacada };
    }

    // -------------------------------------------------------------------
    // cargas

    async cargarInicio() {
        const turnoDestacada = this.iniciarOperacion("destacada");
        const turnoCategorias = this.iniciarOperacion("categorias");
        this.mostrarCarga("destacada");
        this.mostrarCarga("categorias");

        try {
            // allSettled nunca se rechaza: devuelve el resultado de cada peticion
            // por separado, asi el fallo de una no oculta a la otra
            const [destacada, categorias] = await Promise.allSettled([
                this.pedirRecetaDistinta(this.estado.idDestacada),
                obtenerCategorias(),
            ]);

            if (this.sigueVigente("destacada", turnoDestacada)) {
                if (destacada.status === "fulfilled") this.mostrarDestacada(destacada.value);
                else this.mostrarError("destacada", destacada.reason);
            }
            if (this.sigueVigente("categorias", turnoCategorias)) {
                if (categorias.status === "fulfilled") this.mostrarCategorias(categorias.value);
                else this.mostrarError("categorias", categorias.reason);
            }
        } catch (error) {
            if (this.sigueVigente("destacada", turnoDestacada)) this.mostrarError("destacada", error);
            if (this.sigueVigente("categorias", turnoCategorias)) this.mostrarError("categorias", error);
        }
    }

    async mostrarOtraReceta({ enfocar = false } = {}) {
        const turno = this.iniciarOperacion("destacada");
        this.mostrarCarga("destacada");
        try {
            const receta = await this.pedirRecetaDistinta(this.estado.idDestacada);
            if (this.sigueVigente("destacada", turno)) this.mostrarDestacada(receta, { enfocar });
        } catch (error) {
            if (this.sigueVigente("destacada", turno)) this.mostrarError("destacada", error, { enfocar });
        }
    }

    async recargarCategorias() {
        const turno = this.iniciarOperacion("categorias");
        this.mostrarCarga("categorias");
        try {
            const categorias = await obtenerCategorias();
            if (this.sigueVigente("categorias", turno)) this.mostrarCategorias(categorias);
        } catch (error) {
            if (this.sigueVigente("categorias", turno)) this.mostrarError("categorias", error, { enfocar: true });
        }
    }

    // la receta no puede repetirse de forma consecutiva. aqui si se espera
    // dentro del ciclo: cada intento depende del resultado del anterior.
    // los errores no se atrapan aqui: suben hasta quien los muestra.
    async pedirRecetaDistinta(idAnterior) {
        for (let intento = 1; intento <= INTENTOS_RECETA_DISTINTA; intento++) {
            const receta = await obtenerRecetaAleatoria();
            if (receta.id !== idAnterior) return receta;
        }
        throw new ErrorApi(
            TIPOS_ERROR_API.RESPUESTA_INVALIDA,
            "El servidor devolvió la misma receta varias veces. Intenta de nuevo."
        );
    }

    // -------------------------------------------------------------------
    // pintado de cada seccion

    mostrarCarga(seccion) {
        this.vaciarRanura(seccion);
        const propiedades = seccion === "destacada"
            ? { tipo: "carga", forma: "destacada" }
            : { tipo: "carga", forma: "tarjetas", cantidad: CANTIDAD_FANTASMAS_CATEGORIAS };
        this.montarEnRanura(seccion, new EstadoCarga(this.zonaDeEstado(seccion), propiedades));
    }

    mostrarError(seccion, error, { enfocar = false } = {}) {
        this.vaciarRanura(seccion);
        const estado = this.montarEnRanura(seccion, new EstadoCarga(this.zonaDeEstado(seccion), { tipo: "error", error, seccion }));
        if (enfocar) estado.enfocar();
    }

    mostrarDestacada(receta, { enfocar = false } = {}) {
        this.vaciarRanura("destacada");
        this.actualizarEstado({ idDestacada: receta.id });
        const destacada = this.montarEnRanura("destacada", new RecetaDestacada(this.zonaDestacada, { receta }));
        if (enfocar) destacada.enfocarOtraReceta();
    }

    mostrarCategorias(categorias) {
        this.vaciarRanura("categorias");
        if (categorias.length === 0) {
            this.montarEnRanura("categorias", new EstadoCarga(this.zonaEstadoCategorias, {
                tipo: "vacio",
                titulo: "No hay categorías",
                mensaje: "El servicio no devolvió categorías para mostrar.",
            }));
            return;
        }
        for (const categoria of categorias) {
            this.montarEnRanura("categorias", new TarjetaCategoria(this.cuadriculaCategorias, { categoria }));
        }
    }

    zonaDeEstado(seccion) {
        return seccion === "destacada" ? this.zonaDestacada : this.zonaEstadoCategorias;
    }
}
