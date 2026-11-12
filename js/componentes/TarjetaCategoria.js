/*
 * TarjetaCategoria
 * categoria de la cuadricula de inicio: imagen, nombre y los primeros 120
 * caracteres de su descripcion. toda la tarjeta es un boton.
 *
 * propiedades: { categoria }  (categoria normalizada)
 * emite:       "categoria:abrir" con detail { nombre }
 */

const LARGO_DESCRIPCION_CATEGORIA = 120;

class TarjetaCategoria extends Componente {
    crearElemento() {
        const { categoria } = this.propiedades;
        return crearNodo("button", {
            clase: "tarjeta-categoria",
            atributos: { type: "button", "aria-label": `Ver la categoría ${categoria.nombre}` },
            hijos: [
                crearNodo("span", {
                    clase: "tarjeta-categoria__marco",
                    hijos: [
                        crearNodo("img", {
                            clase: "tarjeta-categoria__imagen",
                            atributos: { src: categoria.imagen, alt: "", loading: "lazy" },
                        }),
                    ],
                }),
                crearNodo("span", { clase: "tarjeta-categoria__nombre", texto: categoria.nombre }),
                crearNodo("span", {
                    clase: "tarjeta-categoria__descripcion",
                    texto: resumirTexto(categoria.descripcion, LARGO_DESCRIPCION_CATEGORIA),
                }),
            ],
        });
    }

    configurarEventos() {
        this.escuchar(this.elemento, "click", () => {
            this.emitir("categoria:abrir", { nombre: this.propiedades.categoria.nombre });
        });
    }
}
