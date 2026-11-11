/*
 * PasosPreparacion
 * pasos numerados de la receta. los numeros los dibuja css con contadores,
 * asi conservan su estilo y la lista sigue siendo un ol para los lectores.
 *
 * propiedades: { pasos: [texto] }  (ya limpios por recetas.js)
 * no emite eventos
 */
class PasosPreparacion extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.pasos = propiedades.pasos ?? [];
    }

    montar() {
        super.montar();
        if (this.pasos.length === 0) {
            this.montarHijo(new EstadoCarga(this.elemento, {
                tipo: "vacio",
                titulo: "Sin pasos de preparación",
                mensaje: "Esta receta no trae instrucciones escritas. Revisa el video si está disponible.",
            }));
        }
        return this;
    }

    crearElemento() {
        const cantidad = this.pasos.length;
        const titulo = crearNodo("h2", {
            clase: "seccion__titulo detalle__titulo-panel",
            atributos: { id: "titulo-preparacion" },
            hijos: [
                crearNodo("span", { texto: "Preparación" }),
                crearNodo("span", {
                    clase: "detalle__cantidad",
                    texto: `${cantidad} ${cantidad === 1 ? "paso" : "pasos"}`,
                }),
            ],
        });

        const seccion = crearNodo("section", {
            clase: "pasos",
            atributos: { "aria-labelledby": "titulo-preparacion" },
            hijos: [titulo],
        });

        if (cantidad > 0) {
            seccion.append(crearNodo("ol", {
                clase: "pasos__lista",
                hijos: this.pasos.map((paso) => crearNodo("li", {
                    clase: "paso",
                    hijos: [crearNodo("p", { clase: "paso__texto", texto: paso })],
                })),
            }));
        }
        return seccion;
    }
}
