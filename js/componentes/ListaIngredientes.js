/*
 * ListaIngredientes
 * ingredientes de la receta con su imagen, nombre y medida.
 *
 * themealdb no tiene foto de todos los ingredientes (responde 404), asi que
 * cada imagen que falla se cambia una sola vez por la imagen alternativa.
 *
 * propiedades: { ingredientes: [{ nombre, medida, imagen }] }
 * no emite eventos
 */

const RUTA_IMAGEN_INGREDIENTE_ALTERNATIVA = "assets/ingrediente-alternativo.svg";

class ListaIngredientes extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.ingredientes = propiedades.ingredientes ?? [];
        this.imagenes = [];
    }

    montar() {
        super.montar();
        if (this.ingredientes.length === 0) {
            this.montarHijo(new EstadoCarga(this.elemento, {
                tipo: "vacio",
                titulo: "Sin ingredientes",
                mensaje: "Esta receta no tiene ingredientes registrados.",
            }));
        }
        return this;
    }

    crearElemento() {
        const cantidad = this.ingredientes.length;
        const titulo = crearNodo("h2", {
            clase: "seccion__titulo detalle__titulo-panel",
            atributos: { id: "titulo-ingredientes" },
            hijos: [
                crearNodo("span", { texto: "Ingredientes" }),
                // el numero se ve en la pastilla; el lector escucha la frase completa
                crearNodo("span", { clase: "detalle__cantidad", texto: cantidad, atributos: { "aria-hidden": "true" } }),
                crearNodo("span", {
                    clase: "solo-lectores",
                    texto: `(${cantidad} ${cantidad === 1 ? "ingrediente" : "ingredientes"})`,
                }),
            ],
        });

        const seccion = crearNodo("section", {
            clase: "ingredientes",
            atributos: { "aria-labelledby": "titulo-ingredientes" },
            hijos: [titulo],
        });

        if (cantidad > 0) {
            seccion.append(crearNodo("ul", {
                clase: "ingredientes__lista",
                hijos: this.ingredientes.map((ingrediente) => this.crearIngrediente(ingrediente)),
            }));
        }
        return seccion;
    }

    crearIngrediente(ingrediente) {
        const imagen = crearNodo("img", {
            clase: "ingrediente__imagen",
            atributos: { src: ingrediente.imagen, alt: "", loading: "lazy", width: 56, height: 56 },
        });
        this.imagenes.push(imagen);

        return crearNodo("li", {
            clase: "ingrediente",
            hijos: [
                imagen,
                crearNodo("div", {
                    clase: "ingrediente__texto",
                    hijos: [
                        crearNodo("span", { clase: "ingrediente__nombre", texto: ingrediente.nombre }),
                        crearNodo("span", {
                            clase: "ingrediente__medida",
                            texto: ingrediente.medida || "Sin medida",
                        }),
                    ],
                }),
            ],
        });
    }

    configurarEventos() {
        // el evento error no burbujea: se escucha en cada imagen
        for (const imagen of this.imagenes) {
            this.escuchar(imagen, "error", (evento) => this.usarImagenAlternativa(evento.currentTarget));
        }
    }

    // la marca evita un ciclo infinito si la alternativa tampoco cargara
    usarImagenAlternativa(imagen) {
        if (imagen.dataset.alternativa === "si") return;
        imagen.dataset.alternativa = "si";
        imagen.classList.add("ingrediente__imagen--alternativa");
        imagen.src = RUTA_IMAGEN_INGREDIENTE_ALTERNATIVA;
    }

    destruir() {
        this.imagenes = [];
        super.destruir();
    }
}
