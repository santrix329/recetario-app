/*
 * CabeceraReceta
 * parte superior del detalle: imagen grande, categoria, origen, etiquetas,
 * enlace al video y acceso para agregar la receta al comparador.
 * el nombre no se repite aqui: lo muestra el titulo h1 de la vista.
 *
 * propiedades: { receta }  (receta completa normalizada)
 * emite:       "receta:comparar" con detail { id }
 */
class CabeceraReceta extends Componente {
    crearElemento() {
        const { receta } = this.propiedades;

        const imagen = crearNodo("img", {
            clase: "cabecera-receta__imagen",
            atributos: { src: receta.imagen, alt: receta.nombre },
        });

        const datos = crearNodo("ul", {
            clase: "cabecera-receta__datos",
            hijos: [
                this.crearDato("Categoría", receta.categoria),
                this.crearDato("Origen", receta.origen),
            ],
        });

        const informacion = crearNodo("div", {
            clase: "cabecera-receta__informacion",
            hijos: [datos, this.crearEtiquetas(receta.etiquetas), this.crearAcciones(receta)],
        });

        return crearNodo("div", { clase: "cabecera-receta", hijos: [imagen, informacion] });
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

    crearEtiquetas(etiquetas = []) {
        const titulo = crearNodo("p", { clase: "cabecera-receta__subtitulo", texto: "Etiquetas" });

        if (etiquetas.length === 0) {
            return crearNodo("div", {
                clase: "cabecera-receta__bloque",
                hijos: [
                    titulo,
                    crearNodo("p", { clase: "cabecera-receta__sin-etiquetas", texto: "Esta receta no tiene etiquetas." }),
                ],
            });
        }

        return crearNodo("div", {
            clase: "cabecera-receta__bloque",
            hijos: [
                titulo,
                crearNodo("ul", {
                    clase: "cabecera-receta__etiquetas",
                    atributos: { "aria-label": "Etiquetas de la receta" },
                    hijos: etiquetas.map((etiqueta) => crearNodo("li", { clase: "dato dato--etiqueta", texto: etiqueta })),
                }),
            ],
        });
    }

    crearAcciones(receta) {
        const comparar = crearNodo("button", {
            clase: "boton boton--primario",
            texto: "Agregar al comparador",
            atributos: { type: "button", "data-accion": "comparar" },
        });
        return crearNodo("div", {
            clase: "cabecera-receta__acciones",
            hijos: [comparar, this.crearEnlaceVideo(receta.video)],
        });
    }

    // el enlace solo se muestra si la receta trae una direccion web valida;
    // asi un valor raro de la api nunca termina en un href peligroso
    crearEnlaceVideo(video) {
        if (!this.esDireccionWeb(video)) return null;
        return crearNodo("a", {
            clase: "boton cabecera-receta__video",
            atributos: { href: video, target: "_blank", rel: "noopener noreferrer" },
            hijos: [
                crearNodo("span", { texto: "Ver video de la preparación" }),
                crearNodo("span", { clase: "cabecera-receta__icono", texto: "↗", atributos: { "aria-hidden": "true" } }),
                crearNodo("span", { clase: "solo-lectores", texto: "(se abre en una pestaña nueva)" }),
            ],
        });
    }

    esDireccionWeb(texto) {
        if (typeof texto !== "string") return false;
        const minusculas = texto.trim().toLowerCase();
        return minusculas.startsWith("https://") || minusculas.startsWith("http://");
    }

    configurarEventos() {
        this.escuchar(this.elemento, "click", (evento) => {
            if (evento.target.closest("[data-accion='comparar']")) {
                this.emitir("receta:comparar", { id: this.propiedades.receta.id });
            }
        });
    }
}
