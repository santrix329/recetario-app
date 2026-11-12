/*
 * CampoSugerencias
 * campo de texto con una lista de sugerencias que se filtra mientras se
 * escribe. sigue el patron combobox de aria: el foco nunca sale del campo y
 * la opcion activa se anuncia con aria-activedescendant.
 *
 * no usa <datalist>: su aspecto depende del navegador, no se puede estilizar
 * y no permite controlar el orden de las sugerencias.
 *
 * propiedades: { id, nombre, idEtiqueta, opciones (textos), valor = "", marcador }
 * emite:       "sugerencias:cambiar" { valor } cada vez que se escribe
 *              "sugerencias:elegir" { valor } al elegir una sugerencia
 * metodos publicos: obtenerValor(), establecerValor(texto), limpiar(),
 *                   enfocar(), marcarInvalido(idMensaje), quitarInvalido()
 *
 * teclado: flecha abajo / arriba recorren la lista, enter elige la opcion
 * activa (sin enviar el formulario mientras la lista esta abierta), escape
 * la cierra. con el mouse se elige en pointerdown para que el blur del campo
 * no cierre la lista antes de tiempo.
 */

const MAXIMO_SUGERENCIAS_CAMPO = 8;
const MINIMO_CARACTERES_SUGERENCIAS = 1;

class CampoSugerencias extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.opciones = CampoSugerencias.prepararOpciones(propiedades.opciones ?? []);
        this.idLista = `${propiedades.id}-lista`;
        this.estado = {
            valor: propiedades.valor ?? "",
            sugerencias: [],
            abierta: false,
            activa: -1,
            idMensajeError: null,
        };
        this.entrada = null;
        this.lista = null;
        this.anuncio = null;
        this.sugerenciasPintadas = null;
    }

    // -------------------------------------------------------------------
    // filtrado: funciones puras, no dependen del dom

    // quita los repetidos (sin distinguir mayusculas) y ordena alfabeticamente
    static prepararOpciones(opciones) {
        const vistas = new Set();
        const unicas = [];
        for (const opcion of opciones) {
            const texto = typeof opcion === "string" ? opcion.trim() : "";
            const clave = normalizarClave(texto);
            if (clave === "" || vistas.has(clave)) continue;
            vistas.add(clave);
            unicas.push(texto);
        }
        return unicas.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    }

    // primero las opciones que empiezan con el texto y despues las que lo
    // contienen en otra posicion; nunca mas de "maximo"
    static filtrar(opciones, texto, maximo = MAXIMO_SUGERENCIAS_CAMPO) {
        const clave = normalizarClave(texto);
        if (clave.length < MINIMO_CARACTERES_SUGERENCIAS) return [];

        const alInicio = [];
        const enMedio = [];
        for (const opcion of opciones) {
            const posicion = normalizarClave(opcion).indexOf(clave);
            if (posicion === 0) alInicio.push(opcion);
            else if (posicion > 0) enMedio.push(opcion);
        }
        return [...alInicio, ...enMedio].slice(0, maximo);
    }

    // -------------------------------------------------------------------
    // ciclo de vida

    crearElemento() {
        const { id, nombre, idEtiqueta, marcador } = this.propiedades;

        this.entrada = crearNodo("input", {
            clase: "campo__control sugerencias__entrada",
            atributos: {
                id,
                name: nombre,
                type: "text",
                role: "combobox",
                "aria-autocomplete": "list",
                "aria-expanded": "false",
                "aria-controls": this.idLista,
                autocomplete: "off",
                autocapitalize: "off",
                spellcheck: "false",
                placeholder: marcador,
            },
        });

        this.lista = crearNodo("ul", {
            clase: "sugerencias__lista",
            atributos: {
                id: this.idLista,
                role: "listbox",
                "aria-labelledby": idEtiqueta,
                "aria-label": idEtiqueta ? null : "Sugerencias",
                hidden: true,
            },
        });

        // cuenta las sugerencias para los lectores de pantalla
        this.anuncio = crearNodo("span", { clase: "solo-lectores", atributos: { role: "status" } });

        return crearNodo("div", { clase: "sugerencias", hijos: [this.entrada, this.lista, this.anuncio] });
    }

    renderizar() {
        const { valor, sugerencias, activa, idMensajeError } = this.estado;
        const visible = this.listaVisible();

        // solo se escribe si cambio: reescribir el mismo valor moveria el cursor
        if (this.entrada.value !== valor) this.entrada.value = valor;

        this.entrada.setAttribute("aria-expanded", String(visible));
        this.cambiarAtributo(this.entrada, "aria-activedescendant", visible && activa >= 0 ? this.idOpcion(activa) : null);
        this.cambiarAtributo(this.entrada, "aria-invalid", idMensajeError ? "true" : null);
        this.cambiarAtributo(this.entrada, "aria-describedby", idMensajeError);

        this.lista.hidden = !visible;
        if (!visible) {
            this.lista.replaceChildren();
            this.sugerenciasPintadas = null;
        } else if (this.sugerenciasPintadas !== sugerencias) {
            // lista nueva: se reconstruyen las opciones
            this.lista.replaceChildren(...sugerencias.map((texto, indice) => this.crearOpcion(texto, indice)));
            this.sugerenciasPintadas = sugerencias;
        } else {
            // misma lista: solo cambia cual opcion esta activa
            for (const opcion of this.lista.children) this.pintarSeleccion(opcion, Number(opcion.dataset.indice) === activa);
        }

        this.anuncio.textContent = visible
            ? `${sugerencias.length} ${sugerencias.length === 1 ? "sugerencia" : "sugerencias"}. Usa las flechas para recorrerlas.`
            : "";
    }

    configurarEventos() {
        this.escuchar(this.entrada, "input", () => this.alEscribir());
        this.escuchar(this.entrada, "keydown", (evento) => this.alPresionarTecla(evento));
        this.escuchar(this.entrada, "blur", () => this.cerrar());

        this.escuchar(this.lista, "pointerdown", (evento) => {
            const opcion = evento.target.closest("[data-indice]");
            if (!opcion) return;
            // sin esto el campo pierde el foco y el blur cierra la lista
            // antes de que la eleccion llegue a registrarse
            evento.preventDefault();
            this.elegir(Number(opcion.dataset.indice));
        });

        this.escuchar(this.lista, "pointermove", (evento) => {
            const opcion = evento.target.closest("[data-indice]");
            if (opcion) this.activar(Number(opcion.dataset.indice));
        });
    }

    // -------------------------------------------------------------------
    // pintado de opciones

    crearOpcion(texto, indice) {
        const opcion = crearNodo("li", {
            clase: "sugerencias__opcion",
            atributos: { id: this.idOpcion(indice), role: "option", "data-indice": indice },
            hijos: this.resaltarCoincidencia(texto),
        });
        this.pintarSeleccion(opcion, indice === this.estado.activa);
        return opcion;
    }

    pintarSeleccion(opcion, activa) {
        opcion.classList.toggle("sugerencias__opcion--activa", activa);
        opcion.setAttribute("aria-selected", String(activa));
    }

    // divide el texto en antes, coincidencia y despues para resaltar lo escrito
    resaltarCoincidencia(texto) {
        const clave = normalizarClave(this.estado.valor);
        const posicion = clave ? texto.toLowerCase().indexOf(clave) : -1;
        if (posicion < 0) return [crearNodo("span", { texto })];
        return [
            crearNodo("span", { texto: texto.slice(0, posicion) }),
            crearNodo("mark", { clase: "sugerencias__coincidencia", texto: texto.slice(posicion, posicion + clave.length) }),
            crearNodo("span", { texto: texto.slice(posicion + clave.length) }),
        ];
    }

    idOpcion(indice) {
        return `${this.idLista}-opcion-${indice}`;
    }

    cambiarAtributo(nodo, nombre, valor) {
        if (valor === null || valor === undefined) nodo.removeAttribute(nombre);
        else nodo.setAttribute(nombre, valor);
    }

    listaVisible() {
        return this.estado.abierta && this.estado.sugerencias.length > 0;
    }

    // -------------------------------------------------------------------
    // interaccion

    alEscribir() {
        const valor = this.entrada.value;
        const sugerencias = CampoSugerencias.filtrar(this.opciones, valor);
        this.actualizarEstado({ valor, sugerencias, abierta: sugerencias.length > 0, activa: -1 });
        this.emitir("sugerencias:cambiar", { valor });
    }

    alPresionarTecla(evento) {
        // durante la composicion de un caracter (acentos, ime) las teclas son del sistema
        if (evento.isComposing) return;
        const visible = this.listaVisible();

        if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
            evento.preventDefault();
            const paso = evento.key === "ArrowDown" ? 1 : -1;
            if (visible) this.moverActiva(paso);
            else this.abrir(paso);
            return;
        }

        if (evento.key === "Enter" && visible) {
            // con la lista abierta enter elige; no debe enviar el formulario
            evento.preventDefault();
            if (this.estado.activa >= 0) this.elegir(this.estado.activa);
            else this.cerrar();
            return;
        }

        if (evento.key === "Escape" && visible) {
            evento.preventDefault();
            this.cerrar();
        }
    }

    // abre la lista con lo escrito y deja activa la primera o la ultima opcion
    abrir(paso) {
        const sugerencias = CampoSugerencias.filtrar(this.opciones, this.estado.valor);
        if (sugerencias.length === 0) return;
        this.actualizarEstado({ sugerencias, abierta: true, activa: paso > 0 ? 0 : sugerencias.length - 1 });
    }

    // recorre la lista de forma circular
    moverActiva(paso) {
        const total = this.estado.sugerencias.length;
        const actual = this.estado.activa;
        const siguiente = actual < 0 ? (paso > 0 ? 0 : total - 1) : (actual + paso + total) % total;
        this.activar(siguiente);
    }

    activar(indice) {
        if (indice === this.estado.activa) return;
        this.actualizarEstado({ activa: indice });
    }

    elegir(indice) {
        const valor = this.estado.sugerencias[indice];
        if (valor === undefined) return;
        this.actualizarEstado({ valor, sugerencias: [], abierta: false, activa: -1 });
        this.emitir("sugerencias:elegir", { valor });
    }

    cerrar() {
        if (!this.estado.abierta) return;
        this.actualizarEstado({ abierta: false, activa: -1 });
    }

    // -------------------------------------------------------------------
    // metodos publicos

    obtenerValor() {
        return this.estado.valor;
    }

    establecerValor(texto) {
        this.actualizarEstado({ valor: typeof texto === "string" ? texto : "", sugerencias: [], abierta: false, activa: -1 });
    }

    limpiar() {
        this.actualizarEstado({ valor: "", sugerencias: [], abierta: false, activa: -1, idMensajeError: null });
    }

    enfocar() {
        this.entrada?.focus();
    }

    // el mensaje lo pinta quien valida; este campo solo se marca y lo referencia
    marcarInvalido(idMensaje) {
        this.actualizarEstado({ idMensajeError: idMensaje });
    }

    quitarInvalido() {
        if (this.estado.idMensajeError) this.actualizarEstado({ idMensajeError: null });
    }
}
