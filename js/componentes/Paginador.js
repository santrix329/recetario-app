/*
 * Paginador
 * botones anterior y siguiente con la indicacion "pagina x de y".
 *
 * propiedades: { pagina, totalPaginas }
 * emite:       "paginador:cambiar" { pagina }
 */
class Paginador extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.estado = { pagina: propiedades.pagina, totalPaginas: propiedades.totalPaginas };
        this.botonAnterior = null;
        this.botonSiguiente = null;
        this.indicador = null;
    }

    crearElemento() {
        this.botonAnterior = crearNodo("button", {
            clase: "boton boton--chico",
            texto: "← Anterior",
            atributos: { type: "button", "data-paso": "-1" },
        });
        this.botonSiguiente = crearNodo("button", {
            clase: "boton boton--chico",
            texto: "Siguiente →",
            atributos: { type: "button", "data-paso": "1" },
        });
        this.indicador = crearNodo("p", { clase: "paginador__indicador", atributos: { "aria-live": "polite" } });

        return crearNodo("nav", {
            clase: "paginador",
            atributos: { "aria-label": "Paginación de resultados" },
            hijos: [this.botonAnterior, this.indicador, this.botonSiguiente],
        });
    }

    renderizar() {
        const { pagina, totalPaginas } = this.estado;
        this.indicador.textContent = `Página ${pagina} de ${totalPaginas}`;
        this.botonAnterior.disabled = pagina <= 1;
        this.botonSiguiente.disabled = pagina >= totalPaginas;
    }

    configurarEventos() {
        this.escuchar(this.elemento, "click", (evento) => {
            const boton = evento.target.closest("[data-paso]");
            if (!boton || boton.disabled) return;
            this.emitir("paginador:cambiar", { pagina: this.estado.pagina + Number(boton.dataset.paso) });
        });
    }

    mostrarPagina(pagina, totalPaginas) {
        this.actualizarEstado({ pagina, totalPaginas });
    }
}
