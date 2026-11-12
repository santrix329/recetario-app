/*
 * EncabezadoFicha
 * cabecera de la ficha de una categoria o de un origen: nombre y cantidad de
 * recetas, mas imagen y descripcion completa cuando existen. como imagen y
 * descripcion son opcionales, el mismo componente sirve para las dos fichas.
 *
 * propiedades: { titulo, cantidad, tipo?, imagen?, descripcion? }
 *   tipo: rotulo corto sobre el titulo ("Categoría", "Origen")
 * no emite eventos: solo muestra datos.
 */
class EncabezadoFicha extends Componente {
    crearElemento() {
        const { titulo, cantidad, tipo, imagen, descripcion } = this.propiedades;

        const marco = imagen
            ? crearNodo("div", {
                clase: "encabezado-ficha__marco",
                hijos: [crearNodo("img", { clase: "encabezado-ficha__imagen", atributos: { src: imagen, alt: "" } })],
            })
            : null;

        const texto = crearNodo("div", {
            clase: "encabezado-ficha__texto",
            hijos: [
                tipo ? crearNodo("p", { clase: "encabezado-ficha__tipo", texto: tipo }) : null,
                crearNodo("h2", { clase: "encabezado-ficha__titulo", texto: titulo }),
                crearNodo("p", {
                    clase: "dato encabezado-ficha__cantidad",
                    texto: `${cantidad} ${cantidad === 1 ? "receta" : "recetas"}`,
                }),
                // pre-line en el css conserva los saltos de linea de la descripcion
                descripcion ? crearNodo("p", { clase: "encabezado-ficha__descripcion", texto: descripcion }) : null,
            ],
        });

        return crearNodo("header", {
            clase: `encabezado-ficha${marco ? " encabezado-ficha--con-imagen" : ""}`,
            hijos: [marco, texto],
        });
    }
}
