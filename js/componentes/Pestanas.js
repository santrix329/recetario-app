/*
 * Pestanas
 * fila de pestanas con el patron aria de pestanas: role="tablist" y un
 * boton role="tab" por pestana. el panel lo dibuja quien usa el componente.
 *
 * teclado (tabindex movil): solo la pestana activa entra en el orden de
 * tabulacion; flecha izquierda/derecha, inicio y fin mueven el foco y activan.
 *
 * propiedades: { pestanas: [{ id, texto }], activa, idPanel, etiqueta }
 * emite:       "pestanas:cambiar" { id }
 * metodos:     activar(id) para sincronizar sin emitir,
 *              idDePestana(id) para que el panel se rotule con aria-labelledby
 */

const TECLAS_PESTANAS = Object.freeze({
    ArrowRight: 1,
    ArrowLeft: -1,
});

class Pestanas extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.estado = { activa: propiedades.activa ?? propiedades.pestanas[0]?.id ?? null };
        this.botones = new Map();
    }

    crearElemento() {
        const { pestanas, idPanel, etiqueta } = this.propiedades;
        const lista = crearNodo("div", {
            clase: "pestanas",
            atributos: { role: "tablist", "aria-label": etiqueta },
        });

        for (const pestana of pestanas) {
            const boton = crearNodo("button", {
                clase: "pestanas__pestana",
                texto: pestana.texto,
                atributos: {
                    type: "button",
                    role: "tab",
                    id: this.idDePestana(pestana.id),
                    "aria-controls": idPanel,
                    "data-pestana": pestana.id,
                },
            });
            this.botones.set(pestana.id, boton);
            lista.append(boton);
        }
        return lista;
    }

    renderizar() {
        for (const [id, boton] of this.botones) {
            const activa = id === this.estado.activa;
            boton.setAttribute("aria-selected", String(activa));
            boton.tabIndex = activa ? 0 : -1;
            boton.classList.toggle("pestanas__pestana--activa", activa);
        }
    }

    configurarEventos() {
        this.escuchar(this.elemento, "click", (evento) => {
            const boton = evento.target.closest("[data-pestana]");
            if (boton) this.elegir(boton.dataset.pestana);
        });

        this.escuchar(this.elemento, "keydown", (evento) => {
            const destino = this.pestanaPorTecla(evento.key);
            if (destino === null) return;
            // evita que las flechas desplacen la pagina mientras se cambia de pestana
            evento.preventDefault();
            this.elegir(destino, { enfocar: true });
        });
    }

    // calcula a que pestana lleva la tecla; null si la tecla no es de navegacion
    pestanaPorTecla(tecla) {
        const ids = [...this.botones.keys()];
        if (ids.length === 0) return null;
        if (tecla === "Home") return ids[0];
        if (tecla === "End") return ids[ids.length - 1];

        const paso = TECLAS_PESTANAS[tecla];
        if (!paso) return null;
        const actual = ids.indexOf(this.estado.activa);
        // el modulo da la vuelta: desde la ultima, la flecha derecha vuelve a la primera
        return ids[(actual + paso + ids.length) % ids.length];
    }

    // activa la pestana y avisa solo si de verdad cambio
    elegir(id, { enfocar = false } = {}) {
        if (!this.botones.has(id)) return;
        if (enfocar) this.botones.get(id).focus();
        if (id === this.estado.activa) return;
        this.activar(id);
        this.emitir("pestanas:cambiar", { id });
    }

    // metodo publico: cambia la pestana marcada sin emitir el evento
    activar(id) {
        if (!this.botones.has(id)) return;
        this.actualizarEstado({ activa: id });
    }

    idDePestana(id) {
        return `${this.propiedades.idPanel}-pestana-${id}`;
    }
}
