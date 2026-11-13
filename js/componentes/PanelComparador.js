/*
 * PanelComparador
 * uno de los dos paneles del comparador (a o b). muestra su receta y trae un
 * buscador interno por nombre que muestra resultados mientras se escribe.
 *
 * el buscador espera 400 ms a que el usuario deje de escribir (debounce) y
 * cancela con AbortController la peticion anterior cuando arranca una nueva.
 * una peticion cancelada no se muestra como error.
 *
 * propiedades: { indice, letra, receta (o null) }
 * emite:       "panel:elegir" { indice, receta }, "panel:vaciar" { indice },
 *              "receta:abrir" { id }
 */

const ESPERA_BUSQUEDA_PANEL = 400;
const MAXIMO_RESULTADOS_PANEL = 8;
const MINIMO_CARACTERES_PANEL = 2;

class PanelComparador extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.estado = {
            receta: propiedades.receta ?? null,
            resultados: null,
            buscando: false,
            error: null,
            mensaje: "",
        };
        this.temporizador = null;
        this.controlador = null;
        this.ultimaConsulta = "";

        this.zonaReceta = null;
        this.campo = null;
        this.zonaMensaje = null;
        this.zonaResultados = null;
    }

    crearElemento() {
        const { indice, letra } = this.propiedades;
        const idCampo = `panel-${indice}-busqueda`;
        const idMensaje = `panel-${indice}-mensaje`;

        this.zonaReceta = crearNodo("div", { clase: "panel-comparador__receta" });
        this.campo = crearNodo("input", {
            clase: "panel-comparador__campo",
            atributos: {
                id: idCampo,
                type: "search",
                placeholder: "Busca una receta por nombre…",
                autocomplete: "off",
                "aria-describedby": idMensaje,
            },
        });
        this.zonaMensaje = crearNodo("p", {
            clase: "panel-comparador__mensaje",
            atributos: { id: idMensaje, "aria-live": "polite" },
        });
        this.zonaResultados = crearNodo("div", { clase: "panel-comparador__resultados" });

        return crearNodo("section", {
            clase: `panel-comparador panel-comparador--${letra.toLowerCase()}`,
            atributos: { "aria-label": `Panel ${letra}` },
            hijos: [
                crearNodo("header", {
                    clase: "panel-comparador__cabecera",
                    hijos: [
                        crearNodo("span", { clase: "panel-comparador__letra", texto: letra }),
                        crearNodo("h2", { clase: "panel-comparador__titulo", texto: `Panel ${letra}` }),
                    ],
                }),
                this.zonaReceta,
                crearNodo("div", {
                    clase: "panel-comparador__buscador",
                    hijos: [
                        crearNodo("label", {
                            clase: "panel-comparador__etiqueta",
                            texto: `Buscar receta para el panel ${letra}`,
                            atributos: { for: idCampo },
                        }),
                        this.campo,
                        this.zonaMensaje,
                        this.zonaResultados,
                    ],
                }),
            ],
        });
    }

    renderizar() {
        const { receta, resultados, buscando, error, mensaje } = this.estado;
        this.elemento.classList.toggle("panel-comparador--vacio", !receta);
        this.zonaReceta.replaceChildren(receta ? this.crearReceta(receta) : this.crearVacio());

        this.zonaMensaje.textContent = mensaje;
        this.zonaMensaje.classList.toggle("panel-comparador__mensaje--error", Boolean(error) || this.estado.aviso === true);

        if (buscando) {
            this.zonaResultados.replaceChildren(this.crearFantasmas());
        } else if (error) {
            this.zonaResultados.replaceChildren(crearNodo("button", {
                clase: "boton boton--chico",
                texto: "Reintentar",
                atributos: { type: "button", "data-accion": "reintentar" },
            }));
        } else if (resultados && resultados.length > 0) {
            this.zonaResultados.replaceChildren(this.crearResultados(resultados));
        } else {
            this.zonaResultados.replaceChildren();
        }
        this.zonaResultados.setAttribute("aria-busy", String(buscando));
    }

    crearReceta(receta) {
        return crearNodo("div", {
            clase: "panel-comparador__ficha",
            hijos: [
                crearNodo("img", {
                    clase: "panel-comparador__imagen",
                    atributos: { src: miniaturaReceta(receta.imagen), alt: receta.nombre },
                }),
                crearNodo("div", {
                    clase: "panel-comparador__datos",
                    hijos: [
                        crearNodo("h3", { clase: "panel-comparador__nombre", texto: receta.nombre }),
                        crearNodo("div", {
                            clase: "panel-comparador__chips",
                            hijos: [
                                crearNodo("span", { clase: "dato", texto: receta.categoria || "Sin categoría" }),
                                crearNodo("span", { clase: "dato", texto: receta.origen || "Sin origen" }),
                            ],
                        }),
                        crearNodo("div", {
                            clase: "panel-comparador__acciones",
                            hijos: [
                                crearNodo("button", {
                                    clase: "boton boton--chico",
                                    texto: "Ver receta",
                                    atributos: { type: "button", "data-accion": "abrir" },
                                }),
                                crearNodo("button", {
                                    clase: "boton-texto",
                                    texto: "Vaciar panel",
                                    atributos: { type: "button", "data-accion": "vaciar" },
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });
    }

    crearVacio() {
        return crearNodo("div", {
            clase: "panel-comparador__vacio",
            hijos: [
                crearNodo("p", { clase: "panel-comparador__vacio-titulo", texto: "Panel libre" }),
                crearNodo("p", {
                    texto: "Busca una receta aquí abajo o usa el botón «Comparar» de cualquier tarjeta.",
                }),
            ],
        });
    }

    crearFantasmas() {
        return crearNodo("div", {
            clase: "panel-comparador__fantasmas",
            atributos: { "aria-hidden": "true" },
            hijos: Array.from({ length: 3 }, () => crearNodo("div", { clase: "esqueleto panel-comparador__fantasma" })),
        });
    }

    crearResultados(resultados) {
        return crearNodo("ul", {
            clase: "panel-comparador__lista",
            atributos: { "aria-label": "Resultados de la búsqueda" },
            hijos: resultados.map((receta, posicion) => crearNodo("li", {
                hijos: [crearNodo("button", {
                    clase: "panel-comparador__resultado",
                    atributos: { type: "button", "data-posicion": posicion },
                    hijos: [
                        crearNodo("img", { atributos: { src: miniaturaReceta(receta.imagen), alt: "", loading: "lazy" } }),
                        crearNodo("span", {
                            clase: "panel-comparador__resultado-texto",
                            hijos: [
                                crearNodo("span", { clase: "panel-comparador__resultado-nombre", texto: receta.nombre }),
                                crearNodo("span", {
                                    clase: "panel-comparador__resultado-meta",
                                    texto: [receta.categoria, receta.origen].filter(Boolean).join(" · "),
                                }),
                            ],
                        }),
                    ],
                })],
            })),
        });
    }

    configurarEventos() {
        this.escuchar(this.campo, "input", () => this.programarBusqueda());

        this.escuchar(this.elemento, "click", (evento) => {
            const resultado = evento.target.closest("[data-posicion]");
            if (resultado) {
                const receta = this.estado.resultados?.[Number(resultado.dataset.posicion)];
                if (receta) this.emitir("panel:elegir", { indice: this.propiedades.indice, receta });
                return;
            }
            const boton = evento.target.closest("[data-accion]");
            if (!boton) return;
            const accion = boton.dataset.accion;
            if (accion === "abrir") this.emitir("receta:abrir", { id: this.estado.receta.id });
            if (accion === "vaciar") this.emitir("panel:vaciar", { indice: this.propiedades.indice });
            if (accion === "reintentar") this.buscar(this.ultimaConsulta);
        });

        // al destruir el panel no puede quedar un temporizador ni una peticion viva
        this.alDestruir(() => {
            clearTimeout(this.temporizador);
            this.controlador?.abort();
        });
    }

    // -------------------------------------------------------------------
    // busqueda con debounce y cancelacion

    programarBusqueda() {
        clearTimeout(this.temporizador);
        const consulta = this.campo.value.trim();

        if (consulta.length === 0) {
            this.cancelarBusqueda();
            this.actualizarEstado({ resultados: null, buscando: false, error: null, mensaje: "", aviso: false });
            return;
        }
        if (consulta.length < MINIMO_CARACTERES_PANEL) {
            // entrada invalida: mensaje junto al campo y ninguna peticion
            this.cancelarBusqueda();
            this.actualizarEstado({ resultados: null, buscando: false, error: null, aviso: false, mensaje: "Escribe al menos 2 caracteres." });
            return;
        }
        this.temporizador = setTimeout(() => this.buscar(consulta), ESPERA_BUSQUEDA_PANEL);
    }

    cancelarBusqueda() {
        this.controlador?.abort();
        this.controlador = null;
    }

    async buscar(consulta) {
        this.cancelarBusqueda();
        const controlador = new AbortController();
        this.controlador = controlador;
        this.ultimaConsulta = consulta;
        this.actualizarEstado({ buscando: true, error: null, aviso: false, mensaje: "Buscando…" });

        try {
            const recetas = await buscarRecetasPorNombre(consulta, { signal: controlador.signal });
            if (controlador !== this.controlador || this.destruido) return;
            const resultados = ordenarPorNombre(recetas).slice(0, MAXIMO_RESULTADOS_PANEL);
            this.actualizarEstado({
                buscando: false,
                resultados,
                mensaje: resultados.length === 0
                    ? `No hay recetas que se llamen «${consulta}».`
                    : `${recetas.length} ${recetas.length === 1 ? "resultado" : "resultados"}${recetas.length > resultados.length ? `, se muestran los primeros ${resultados.length}` : ""}.`,
            });
        } catch (error) {
            // una busqueda cancelada no es un error: ya hay otra en camino
            if (error instanceof ErrorApi && error.tipo === TIPOS_ERROR_API.CANCELADA) return;
            if (controlador !== this.controlador || this.destruido) return;
            this.actualizarEstado({
                buscando: false,
                resultados: null,
                error,
                mensaje: error instanceof ErrorApi ? error.message : "No se pudo completar la búsqueda.",
            });
        }
    }

    // -------------------------------------------------------------------
    // metodos publicos para la vista

    mostrarReceta(receta) {
        if (receta?.id === this.estado.receta?.id) return;
        this.actualizarEstado({ receta });
    }

    // tras elegir una receta se limpia el buscador
    limpiarBusqueda() {
        clearTimeout(this.temporizador);
        this.cancelarBusqueda();
        this.campo.value = "";
        this.actualizarEstado({ resultados: null, buscando: false, error: null, aviso: false, mensaje: "" });
    }

    mostrarAviso(texto) {
        this.actualizarEstado({ mensaje: texto, aviso: true });
    }
}
