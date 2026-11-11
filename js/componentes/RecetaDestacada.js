/*
 * RecetaDestacada
 * receta al azar que se muestra en la vista de inicio.
 *
 * propiedades: { receta }  (receta completa normalizada)
 * emite:       "receta:abrir" con detail { id }
 *              "destacada:otra" con detail { id } (id de la receta mostrada)
 */
class RecetaDestacada extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.botonOtra = null;
    }

    crearElemento() {
        const { receta } = this.propiedades;

        const imagen = crearNodo("img", {
            clase: "destacada__imagen",
            atributos: { src: receta.imagen, alt: receta.nombre },
        });

        const datos = crearNodo("ul", {
            clase: "destacada__datos",
            hijos: [
                this.crearDato("Categoría", receta.categoria),
                this.crearDato("Origen", receta.origen),
            ],
        });

        const verReceta = crearNodo("button", {
            clase: "boton boton--primario",
            texto: "Ver receta",
            atributos: { type: "button", "data-accion": "abrir" },
        });
        this.botonOtra = crearNodo("button", {
            clase: "boton",
            texto: "Otra receta",
            atributos: { type: "button", "data-accion": "otra" },
        });

        const informacion = crearNodo("div", {
            clase: "destacada__informacion",
            hijos: [
                crearNodo("h3", { clase: "destacada__nombre", texto: receta.nombre }),
                datos,
                crearNodo("div", { clase: "destacada__acciones", hijos: [verReceta, this.botonOtra] }),
            ],
        });

        return crearNodo("article", { clase: "destacada", hijos: [imagen, informacion] });
    }

    crearDato(etiqueta, valor) {
        return crearNodo("li", {
            clase: "dato",
            hijos: [
                crearNodo("span", { clase: "dato__etiqueta", texto: etiqueta }),
                crearNodo("span", { clase: "dato__valor", texto: valor || "Sin dato" }),
            ],
        });
    }

    configurarEventos() {
        this.escuchar(this.elemento, "click", (evento) => {
            const boton = evento.target.closest("[data-accion]");
            if (!boton) return;
            const { id } = this.propiedades.receta;
            if (boton.dataset.accion === "abrir") this.emitir("receta:abrir", { id });
            if (boton.dataset.accion === "otra") this.emitir("destacada:otra", { id });
        });
    }

    // devuelve el foco al boton tras cambiar de receta con el teclado
    enfocarOtraReceta() {
        this.botonOtra?.focus();
    }
}
