/*
 * TarjetaReceta
 * receta en una cuadricula: imagen, nombre, categoria, origen y cantidad de
 * ingredientes. los filtros solo traen id, nombre e imagen, asi que la tarjeta
 * nace "cargando" y el listado la completa cuando resuelve el detalle.
 *
 * propiedades: { receta, estado: "cargando" | "completa" | "incompleta" }
 * emite:       "receta:abrir" { id }, "receta:comparar" { id },
 *              "tarjeta:reintentar" { id }
 *
 * la estructura fija (imagen, nombre, botones) se crea una vez; renderizar
 * solo reemplaza la zona de datos, asi el foco de los botones no se pierde.
 */
class TarjetaReceta extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        const { receta } = propiedades;
        this.estado = {
            receta,
            resolucion: propiedades.estado ?? (receta.completa ? "completa" : "cargando"),
        };
        this.zonaDatos = null;
    }

    get id() {
        return this.estado.receta.id;
    }

    crearElemento() {
        const { receta } = this.estado;
        this.zonaDatos = crearNodo("div", { clase: "tarjeta-receta__datos" });

        return crearNodo("article", {
            clase: "tarjeta-receta",
            hijos: [
                crearNodo("img", {
                    clase: "tarjeta-receta__imagen",
                    atributos: { src: miniaturaReceta(receta.imagen), alt: "", loading: "lazy" },
                }),
                crearNodo("div", {
                    clase: "tarjeta-receta__cuerpo",
                    hijos: [
                        crearNodo("h3", { clase: "tarjeta-receta__nombre", texto: receta.nombre }),
                        this.zonaDatos,
                        crearNodo("div", {
                            clase: "tarjeta-receta__acciones",
                            hijos: [
                                crearNodo("button", {
                                    clase: "boton boton--primario boton--chico",
                                    texto: "Ver receta",
                                    atributos: { type: "button", "data-accion": "abrir" },
                                }),
                                crearNodo("button", {
                                    clase: "boton boton--chico",
                                    texto: "Comparar",
                                    atributos: { type: "button", "data-accion": "comparar", "aria-label": `Agregar ${receta.nombre} al comparador` },
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });
    }

    renderizar() {
        const { resolucion } = this.estado;
        this.elemento.classList.toggle("tarjeta-receta--incompleta", resolucion === "incompleta");
        this.elemento.setAttribute("aria-busy", String(resolucion === "cargando"));
        this.zonaDatos.replaceChildren(...this.crearDatos());
    }

    crearDatos() {
        const { receta, resolucion } = this.estado;

        if (resolucion === "cargando") {
            return [
                crearNodo("span", { clase: "esqueleto esqueleto--dato", atributos: { "aria-hidden": "true" } }),
                crearNodo("span", { clase: "esqueleto esqueleto--dato", atributos: { "aria-hidden": "true" } }),
                crearNodo("span", { clase: "solo-lectores", texto: "Cargando datos de la receta…" }),
            ];
        }

        if (resolucion === "incompleta") {
            return [
                crearNodo("span", { clase: "tarjeta-receta__aviso", texto: "Datos incompletos" }),
                crearNodo("button", {
                    clase: "boton-texto",
                    texto: "Reintentar",
                    atributos: { type: "button", "data-accion": "reintentar" },
                }),
            ];
        }

        const cantidad = receta.ingredientes.length;
        return [
            crearNodo("span", { clase: "dato", texto: receta.categoria || "Sin categoría" }),
            crearNodo("span", { clase: "dato", texto: receta.origen || "Sin origen" }),
            crearNodo("span", { clase: "dato", texto: `${cantidad} ${cantidad === 1 ? "ingrediente" : "ingredientes"}` }),
        ];
    }

    configurarEventos() {
        this.escuchar(this.elemento, "click", (evento) => {
            const boton = evento.target.closest("[data-accion]");
            if (!boton) return;
            const acciones = {
                abrir: "receta:abrir",
                comparar: "receta:comparar",
                reintentar: "tarjeta:reintentar",
            };
            this.emitir(acciones[boton.dataset.accion], { id: this.id });
        });
    }

    completar(receta) {
        this.actualizarEstado({ receta, resolucion: "completa" });
    }

    marcarIncompleta() {
        this.actualizarEstado({ resolucion: "incompleta" });
    }

    marcarCargando() {
        this.actualizarEstado({ resolucion: "cargando" });
    }
}
