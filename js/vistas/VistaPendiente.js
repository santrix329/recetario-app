/*
 * VistaPendiente
 * vista provisional para las secciones que todavia no se construyen.
 * deja ver que la navegacion y los parametros llegan bien.
 *
 * propiedades: { titulo, parametros }
 */
class VistaPendiente extends Componente {
    crearElemento() {
        const vista = crearNodo("section", { clase: "vista vista-pendiente" });
        const titulo = crearNodo("h1", {
            clase: "vista__titulo",
            texto: this.propiedades.titulo,
            atributos: { tabindex: "-1" },
        });
        const aviso = crearNodo("p", {
            clase: "vista-pendiente__aviso",
            texto: "Esta sección todavía está en construcción.",
        });
        vista.append(titulo, aviso);

        // muestra lo que la vista recibio, por ejemplo el id de la receta a abrir
        const parametros = Object.entries(this.propiedades.parametros ?? {});
        if (parametros.length > 0) {
            const lista = crearNodo("dl", { clase: "vista-pendiente__parametros" });
            for (const [nombre, valor] of parametros) {
                lista.append(crearNodo("dt", { texto: nombre }), crearNodo("dd", { texto: valor }));
            }
            vista.append(lista);
        }
        return vista;
    }
}
