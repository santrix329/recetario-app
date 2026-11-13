/*
 * BarraNavegacion
 * barra permanente con acceso a las vistas principales.
 *
 * propiedades: { nombreApp, rutas: [{ id, texto }], vistaActiva, cantidadComparador }
 * emite:       "navegacion:ir" con detail { vista }
 *
 * la estructura se crea una sola vez y renderizar solo actualiza la vista
 * activa y el contador; asi el boton enfocado no se pierde al navegar con teclado.
 */
class BarraNavegacion extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.estado = {
            vistaActiva: propiedades.vistaActiva ?? null,
            cantidadComparador: propiedades.cantidadComparador ?? 0,
        };
        this.botones = new Map();
        this.contador = null;
    }

    crearElemento() {
        const barra = crearNodo("nav", { clase: "barra", atributos: { "aria-label": "Navegación principal" } });
        const marca = crearNodo("button", {
            clase: "barra__marca",
            atributos: { type: "button", "data-vista": "inicio" },
            hijos: [
                crearNodo("img", { clase: "barra__icono", atributos: { src: "assets/icono.svg", alt: "", width: 30, height: 30 } }),
                crearNodo("span", { texto: this.propiedades.nombreApp }),
            ],
        });
        const lista = crearNodo("ul", { clase: "barra__enlaces" });

        for (const ruta of this.propiedades.rutas) {
            const boton = crearNodo("button", {
                clase: "barra__enlace",
                texto: ruta.texto,
                atributos: { type: "button", "data-vista": ruta.id },
            });
            if (ruta.id === "comparador") {
                this.contador = crearNodo("span", { clase: "barra__contador" });
                boton.append(this.contador);
            }
            this.botones.set(ruta.id, boton);
            lista.append(crearNodo("li", { hijos: [boton] }));
        }

        barra.append(marca, lista);
        return barra;
    }

    renderizar() {
        for (const [idVista, boton] of this.botones) {
            const activa = idVista === this.estado.vistaActiva;
            boton.classList.toggle("barra__enlace--activo", activa);
            if (activa) {
                boton.setAttribute("aria-current", "page");
            } else {
                boton.removeAttribute("aria-current");
            }
        }

        if (this.contador) {
            const cantidad = this.estado.cantidadComparador;
            this.contador.textContent = `${cantidad}/2`;
            this.contador.setAttribute("aria-label", `${cantidad} de 2 recetas cargadas`);
            this.contador.classList.toggle("barra__contador--con-recetas", cantidad > 0);
        }
    }

    configurarEventos() {
        this.escuchar(this.elemento, "click", (evento) => {
            const boton = evento.target.closest("[data-vista]");
            if (boton) this.emitir("navegacion:ir", { vista: boton.dataset.vista });
        });
    }

    marcarActiva(idVista) {
        this.actualizarEstado({ vistaActiva: idVista });
    }

    mostrarCantidadComparador(cantidad) {
        this.actualizarEstado({ cantidadComparador: cantidad });
    }
}
