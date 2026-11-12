/*
 * ListaOpciones
 * lista de opciones en forma de chips con un filtro de texto opcional.
 * la vista de categorias y origenes la instancia una vez por pestana con
 * datos distintos: categorias sin filtro y origenes (195) con filtro.
 *
 * el filtro solo oculta (hidden) los chips de su propio dom; no pide nada a
 * la api ni avisa a la vista, porque elegir sigue siendo hacer clic en un chip.
 *
 * propiedades: { opciones: [{ valor, texto }], seleccionada, etiqueta, conFiltro }
 * emite:       "opcion:elegir" { valor }
 * metodos:     marcar(valor) para reflejar la opcion elegida
 */
class ListaOpciones extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.estado = { seleccionada: propiedades.seleccionada ?? null, filtro: "" };
        this.campoFiltro = null;
        this.lista = null;
        this.sinCoincidencias = null;
        this.botones = new Map();
        this.items = [];
    }

    montar() {
        super.montar();
        this.desplazarASeleccionada();
        return this;
    }

    crearElemento() {
        const { opciones, etiqueta, conFiltro } = this.propiedades;
        const contenedor = crearNodo("div", { clase: "lista-opciones" });

        if (conFiltro) {
            this.campoFiltro = crearNodo("input", {
                clase: "lista-opciones__campo",
                atributos: {
                    type: "search",
                    placeholder: `Filtrar ${etiqueta.toLowerCase()}…`,
                    autocomplete: "off",
                    spellcheck: "false",
                },
            });
            contenedor.append(crearNodo("label", {
                clase: "lista-opciones__filtro",
                hijos: [
                    crearNodo("span", { clase: "solo-lectores", texto: `Filtrar ${etiqueta.toLowerCase()}` }),
                    this.campoFiltro,
                ],
            }));
        }

        this.lista = crearNodo("ul", { clase: "lista-opciones__lista", atributos: { "aria-label": etiqueta } });
        for (const opcion of opciones) {
            const boton = crearNodo("button", {
                clase: "lista-opciones__opcion",
                texto: opcion.texto,
                atributos: { type: "button", "data-valor": opcion.valor },
            });
            const item = crearNodo("li", { hijos: [boton] });
            this.botones.set(opcion.valor, boton);
            this.items.push({ item, clave: this.claveBusqueda(opcion.texto) });
            this.lista.append(item);
        }

        this.sinCoincidencias = crearNodo("p", {
            clase: "lista-opciones__vacio",
            texto: "Ningún resultado coincide.",
            atributos: { role: "status", hidden: true },
        });

        contenedor.append(this.lista, this.sinCoincidencias);
        return contenedor;
    }

    renderizar() {
        const { seleccionada, filtro } = this.estado;

        for (const [valor, boton] of this.botones) {
            const elegida = valor === seleccionada;
            boton.setAttribute("aria-pressed", String(elegida));
            boton.classList.toggle("lista-opciones__opcion--elegida", elegida);
        }

        let visibles = 0;
        for (const { item, clave } of this.items) {
            const coincide = clave.includes(filtro);
            item.hidden = !coincide;
            if (coincide) visibles++;
        }
        this.sinCoincidencias.hidden = visibles > 0;
    }

    configurarEventos() {
        this.escuchar(this.lista, "click", (evento) => {
            const boton = evento.target.closest("[data-valor]");
            if (!boton) return;
            const { valor } = boton.dataset;
            if (valor !== this.estado.seleccionada) this.emitir("opcion:elegir", { valor });
        });

        if (!this.campoFiltro) return;
        this.escuchar(this.campoFiltro, "input", () => {
            this.actualizarEstado({ filtro: this.claveBusqueda(this.campoFiltro.value) });
        });
        // escape limpia el filtro sin salir del campo
        this.escuchar(this.campoFiltro, "keydown", (evento) => {
            if (evento.key !== "Escape" || this.campoFiltro.value === "") return;
            evento.preventDefault();
            this.campoFiltro.value = "";
            this.actualizarEstado({ filtro: "" });
        });
    }

    // sin mayusculas ni tildes: "aland" encuentra "Åland" y "peru" encuentra "Perú"
    claveBusqueda(texto) {
        return normalizarClave(texto).normalize("NFD").replace(/[̀-ͯ]/g, "");
    }

    // metodo publico: la vista confirma la opcion elegida
    marcar(valor) {
        this.actualizarEstado({ seleccionada: valor ?? null });
    }

    // al restaurar una seleccion lejana (origenes) la lista se desplaza hasta ella;
    // solo mueve el scroll interno de la lista, no el de la pagina
    desplazarASeleccionada() {
        const boton = this.botones.get(this.estado.seleccionada);
        if (!boton || this.lista.scrollHeight <= this.lista.clientHeight) return;
        const item = boton.parentElement;
        this.lista.scrollTop = item.offsetTop - (this.lista.clientHeight - item.offsetHeight) / 2;
    }
}
