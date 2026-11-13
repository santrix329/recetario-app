/*
 * VistaComparador
 * dos paneles (a y b) y, cuando los dos tienen receta, la tabla de comparacion.
 *
 * las recetas viven en sesionComparador.js, asi se conservan al navegar.
 * la vista escucha el evento "cambio" de esa sesion y sincroniza paneles y tabla.
 *
 * escucha: "panel:elegir", "panel:vaciar" (de sus paneles), "cambio" (sesion)
 * deja subir: "receta:abrir" (lo resuelve app.js)
 */
class VistaComparador extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.paneles = [];
        this.zonaPaneles = null;
        this.zonaComparacion = null;
        this.botonIntercambiar = null;
        this.botonVaciar = null;
        this.tabla = null;
    }

    montar() {
        super.montar();
        // el panel es el pseudocomponente reutilizado: una instancia por letra
        const recetas = recetasEnComparador();
        this.paneles = LETRAS_PANELES.map((letra, indice) =>
            this.montarHijo(new PanelComparador(this.zonaPaneles, { indice, letra, receta: recetas[indice] }))
        );
        this.sincronizar();
        return this;
    }

    crearElemento() {
        this.zonaPaneles = crearNodo("div", { clase: "comparador__paneles" });
        this.zonaComparacion = crearNodo("div", { clase: "comparador__comparacion" });
        this.botonIntercambiar = crearNodo("button", {
            clase: "boton",
            texto: "⇄ Intercambiar paneles",
            atributos: { type: "button", "data-accion": "intercambiar" },
        });
        this.botonVaciar = crearNodo("button", {
            clase: "boton",
            texto: "Vaciar comparador",
            atributos: { type: "button", "data-accion": "vaciar" },
        });

        return crearNodo("div", {
            clase: "vista vista-comparador",
            hijos: [
                crearNodo("header", {
                    clase: "comparador__encabezado",
                    hijos: [
                        crearNodo("h1", { clase: "vista__titulo", texto: "Comparador de recetas", atributos: { tabindex: "-1" } }),
                        crearNodo("p", {
                            clase: "comparador__bajada",
                            texto: "Pon dos recetas lado a lado y descubre cuál es más sencilla y cuánto se parecen.",
                        }),
                    ],
                }),
                this.zonaPaneles,
                crearNodo("div", { clase: "comparador__controles", hijos: [this.botonIntercambiar, this.botonVaciar] }),
                this.zonaComparacion,
            ],
        });
    }

    configurarEventos() {
        this.escuchar(avisosComparador, "cambio", () => this.sincronizar());

        this.escuchar(this.elemento, "panel:elegir", (evento) => {
            const { indice, receta } = evento.detail;
            const panel = this.paneles[indice];
            if (colocarEnPanel(indice, receta) === "repetida") {
                panel.mostrarAviso("Esa receta ya está en el comparador: no se puede comparar consigo misma.");
                return;
            }
            panel.limpiarBusqueda();
        });

        this.escuchar(this.elemento, "panel:vaciar", (evento) => vaciarPanel(evento.detail.indice));

        this.escuchar(this.elemento, "click", (evento) => {
            const boton = evento.target.closest("[data-accion]");
            if (!boton || !this.elemento.contains(boton) || boton.closest(".panel-comparador")) return;
            if (boton.dataset.accion === "intercambiar") intercambiarPaneles();
            if (boton.dataset.accion === "vaciar") {
                vaciarPanel(0);
                vaciarPanel(1);
            }
        });
    }

    // pone la sesion en pantalla: recetas de cada panel, botones y tabla
    sincronizar() {
        if (this.destruido) return;
        const recetas = recetasEnComparador();
        this.paneles.forEach((panel, indice) => panel.mostrarReceta(recetas[indice]));

        const cantidad = cantidadEnComparador();
        this.botonIntercambiar.disabled = cantidad === 0;
        this.botonVaciar.disabled = cantidad === 0;

        this.destruirHijo(this.tabla);
        this.tabla = null;
        this.vaciarRanura("comparacion");

        if (cantidad === 2) {
            this.tabla = this.montarHijo(new TablaComparacion(this.zonaComparacion, { recetas }));
            return;
        }
        this.montarEnRanura("comparacion", new EstadoCarga(this.zonaComparacion, {
            tipo: "vacio",
            titulo: cantidad === 0 ? "El comparador está vacío" : "Falta una receta",
            mensaje: cantidad === 0
                ? "Busca una receta en cada panel o usa el botón «Comparar» de cualquier tarjeta."
                : "Elige una receta para el otro panel y aquí aparecerá la comparación.",
        }));
    }
}
