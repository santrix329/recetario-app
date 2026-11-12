/*
 * DialogoReemplazo
 * pregunta en pantalla que panel del comparador reemplazar cuando los dos
 * estan ocupados (reemplaza a confirm(), que el enunciado prohibe).
 * usa <dialog> con showModal: el navegador atrapa el foco dentro del dialogo
 * y lo cierra con escape.
 *
 * propiedades: { receta, paneles: [recetaA, recetaB] }
 * emite:       "reemplazo:elegir" { indice }, "reemplazo:cancelar" {}
 */
class DialogoReemplazo extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        // al cerrar, el foco vuelve al boton que abrio el dialogo
        this.enfocadoAntes = document.activeElement;
    }

    montar() {
        super.montar();
        this.elemento.showModal();
        return this;
    }

    crearElemento() {
        const { receta, paneles } = this.propiedades;

        const opciones = paneles.map((recetaPanel, indice) =>
            crearNodo("button", {
                clase: "dialogo__opcion",
                atributos: { type: "button", "data-indice": indice },
                hijos: [
                    crearNodo("img", {
                        clase: "dialogo__miniatura",
                        atributos: { src: miniaturaReceta(recetaPanel.imagen), alt: "" },
                    }),
                    crearNodo("span", {
                        clase: "dialogo__texto",
                        hijos: [
                            crearNodo("span", { clase: "dialogo__panel", texto: `Reemplazar panel ${LETRAS_PANELES[indice]}` }),
                            crearNodo("span", { clase: "dialogo__receta", texto: recetaPanel.nombre }),
                        ],
                    }),
                ],
            })
        );

        return crearNodo("dialog", {
            clase: "dialogo",
            atributos: { "aria-labelledby": "dialogo-titulo", "aria-describedby": "dialogo-descripcion" },
            hijos: [
                crearNodo("h2", { clase: "dialogo__titulo", texto: "El comparador está lleno", atributos: { id: "dialogo-titulo" } }),
                crearNodo("p", {
                    clase: "dialogo__descripcion",
                    texto: `¿Qué receta quieres reemplazar por «${receta.nombre}»?`,
                    atributos: { id: "dialogo-descripcion" },
                }),
                crearNodo("div", { clase: "dialogo__opciones", hijos: opciones }),
                crearNodo("button", {
                    clase: "boton boton--chico dialogo__cancelar",
                    texto: "Cancelar",
                    atributos: { type: "button", "data-accion": "cancelar" },
                }),
            ],
        });
    }

    configurarEventos() {
        this.escuchar(this.elemento, "click", (evento) => {
            const opcion = evento.target.closest("[data-indice]");
            if (opcion) {
                this.emitir("reemplazo:elegir", { indice: Number(opcion.dataset.indice) });
                return;
            }
            // un clic en el fondo oscuro llega con el propio dialog como destino
            if (evento.target.closest("[data-accion=cancelar]") || evento.target === this.elemento) {
                this.emitir("reemplazo:cancelar");
            }
        });

        // escape dispara "cancel": se evita el cierre nativo para cerrar siempre por destruir()
        this.escuchar(this.elemento, "cancel", (evento) => {
            evento.preventDefault();
            this.emitir("reemplazo:cancelar");
        });
    }

    destruir() {
        if (this.elemento?.open) this.elemento.close();
        const anterior = this.enfocadoAntes;
        super.destruir();
        if (anterior?.isConnected) anterior.focus();
    }
}
