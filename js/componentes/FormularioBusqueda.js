/*
 * FormularioBusqueda
 * criterios de busqueda de la vista explorar: nombre, categoria, origen e
 * ingrediente. valida antes de avisar: si algo no es valido muestra el
 * mensaje junto al campo y no emite nada, asi no se hace ninguna peticion.
 *
 * propiedades: { categorias (normalizadas, se usa .nombre), origenes (textos),
 *                ingredientes (textos), valores: { nombre, categoria, origen,
 *                ingrediente }, prefijo = "busqueda" (para los id del dom) }
 * hijo:        CampoSugerencias para el ingrediente
 * emite:       "busqueda:enviar" { criterios }, "busqueda:limpiar" {}
 * escucha:     "sugerencias:cambiar" y "sugerencias:elegir" de su campo de ingrediente
 * metodos publicos: limpiar(), enfocar()
 */

const MINIMO_CARACTERES_BUSQUEDA = 2;

const MENSAJES_BUSQUEDA = Object.freeze({
    TEXTO_CORTO: `Escribe al menos ${MINIMO_CARACTERES_BUSQUEDA} caracteres.`,
    SIN_CRITERIOS: "Elige al menos un criterio para buscar.",
});

// campos de texto libre: son los unicos que pueden quedar demasiado cortos
const CAMPOS_TEXTO_BUSQUEDA = ["nombre", "ingrediente"];

class FormularioBusqueda extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.prefijo = propiedades.prefijo ?? "busqueda";
        this.estado = {
            valores: FormularioBusqueda.completarCriterios(propiedades.valores),
            errores: FormularioBusqueda.sinErrores(),
        };
        this.entradaNombre = null;
        this.selectorCategoria = null;
        this.selectorOrigen = null;
        this.zonaIngrediente = null;
        this.campoIngrediente = null;
        this.mensajes = {};
    }

    // -------------------------------------------------------------------
    // reglas: funciones puras, no dependen del dom

    // asegura los cuatro criterios como texto sin espacios en los extremos
    static completarCriterios(valores) {
        return {
            nombre: limpiarTexto(valores?.nombre),
            categoria: limpiarTexto(valores?.categoria),
            origen: limpiarTexto(valores?.origen),
            ingrediente: limpiarTexto(valores?.ingrediente),
        };
    }

    static sinErrores() {
        return { nombre: null, ingrediente: null, general: null };
    }

    // devuelve el mensaje de cada campo; todos en null significa valido
    static validar(criterios) {
        const errores = FormularioBusqueda.sinErrores();
        for (const campo of CAMPOS_TEXTO_BUSQUEDA) {
            const texto = criterios[campo];
            if (texto !== "" && texto.length < MINIMO_CARACTERES_BUSQUEDA) errores[campo] = MENSAJES_BUSQUEDA.TEXTO_CORTO;
        }
        const hayCriterio = Object.values(criterios).some((valor) => valor !== "");
        if (!hayCriterio) errores.general = MENSAJES_BUSQUEDA.SIN_CRITERIOS;
        return errores;
    }

    static esValido(errores) {
        return Object.values(errores).every((mensaje) => mensaje === null);
    }

    // -------------------------------------------------------------------
    // ciclo de vida

    montar() {
        super.montar();
        this.campoIngrediente = this.montarHijo(new CampoSugerencias(this.zonaIngrediente, {
            id: this.idCampo("ingrediente"),
            nombre: "ingrediente",
            idEtiqueta: this.idEtiqueta("ingrediente"),
            opciones: this.propiedades.ingredientes ?? [],
            valor: this.estado.valores.ingrediente,
            marcador: "Ej.: Garlic",
        }));
        this.aplicarValores(this.estado.valores);
        return this;
    }

    crearElemento() {
        const { categorias = [], origenes = [] } = this.propiedades;

        this.entradaNombre = crearNodo("input", {
            clase: "campo__control",
            atributos: {
                id: this.idCampo("nombre"),
                name: "nombre",
                type: "text",
                autocomplete: "off",
                enterkeyhint: "search",
                placeholder: "Ej.: Arrabiata",
            },
        });
        this.selectorCategoria = this.crearSelector("categoria", "Todas las categorías", categorias.map((categoria) => categoria.nombre));
        this.selectorOrigen = this.crearSelector("origen", "Todos los orígenes", origenes);
        this.zonaIngrediente = crearNodo("div", { clase: "campo__zona" });

        const campos = crearNodo("div", {
            clase: "formulario-busqueda__campos",
            hijos: [
                this.crearCampo("nombre", "Nombre", this.entradaNombre),
                this.crearCampo("categoria", "Categoría", this.envolverSelector(this.selectorCategoria)),
                this.crearCampo("origen", "Origen", this.envolverSelector(this.selectorOrigen)),
                this.crearCampo("ingrediente", "Ingrediente", this.zonaIngrediente),
            ],
        });

        // el aviso general vive siempre en el dom: una region role="alert"
        // que aparece de golpe no siempre se anuncia
        this.mensajes.general = crearNodo("p", {
            clase: "formulario-busqueda__mensaje",
            atributos: { id: this.idMensaje("criterios"), role: "alert" },
        });

        const acciones = crearNodo("div", {
            clase: "formulario-busqueda__acciones",
            hijos: [
                crearNodo("button", { clase: "boton boton--primario", texto: "Buscar", atributos: { type: "submit" } }),
                crearNodo("button", { clase: "boton", texto: "Limpiar", atributos: { type: "button", "data-accion": "limpiar" } }),
                this.mensajes.general,
            ],
        });

        return crearNodo("form", {
            clase: "formulario-busqueda",
            atributos: { role: "search", "aria-label": "Buscar recetas", novalidate: true },
            hijos: [campos, acciones],
        });
    }

    crearCampo(nombre, textoEtiqueta, control) {
        const hijos = [
            crearNodo("label", {
                clase: "campo__etiqueta",
                texto: textoEtiqueta,
                atributos: { for: this.idCampo(nombre), id: this.idEtiqueta(nombre) },
            }),
            control,
        ];
        if (CAMPOS_TEXTO_BUSQUEDA.includes(nombre)) {
            this.mensajes[nombre] = crearNodo("p", {
                clase: "campo__mensaje",
                atributos: { id: this.idMensaje(nombre), hidden: true },
            });
            hijos.push(this.mensajes[nombre]);
        }
        return crearNodo("div", { clase: "campo", hijos });
    }

    // la primera opcion vacia significa "sin filtrar por este criterio"
    crearSelector(nombre, textoTodas, valores) {
        const unicos = [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
        return crearNodo("select", {
            clase: "campo__control campo__control--selector",
            atributos: { id: this.idCampo(nombre), name: nombre },
            hijos: [
                crearNodo("option", { texto: textoTodas, atributos: { value: "" } }),
                ...unicos.map((valor) => crearNodo("option", { texto: valor, atributos: { value: valor } })),
            ],
        });
    }

    // el envoltorio dibuja la flecha propia del selector
    envolverSelector(selector) {
        return crearNodo("div", { clase: "campo__selector", hijos: [selector] });
    }

    // solo pinta los mensajes: los valores viven en los controles mientras se escribe
    renderizar() {
        const { errores } = this.estado;

        this.pintarMensaje(this.mensajes.nombre, errores.nombre);
        if (errores.nombre) {
            this.entradaNombre.setAttribute("aria-invalid", "true");
            this.entradaNombre.setAttribute("aria-describedby", this.idMensaje("nombre"));
        } else {
            this.entradaNombre.removeAttribute("aria-invalid");
            this.entradaNombre.removeAttribute("aria-describedby");
        }

        this.pintarMensaje(this.mensajes.ingrediente, errores.ingrediente);
        if (errores.ingrediente) this.campoIngrediente?.marcarInvalido(this.idMensaje("ingrediente"));
        else this.campoIngrediente?.quitarInvalido();

        this.mensajes.general.textContent = errores.general ?? "";
    }

    pintarMensaje(nodo, mensaje) {
        nodo.textContent = mensaje ?? "";
        nodo.hidden = !mensaje;
    }

    configurarEventos() {
        this.escuchar(this.elemento, "submit", (evento) => {
            evento.preventDefault();
            this.enviar();
        });

        this.escuchar(this.elemento, "click", (evento) => {
            if (!evento.target.closest('[data-accion="limpiar"]')) return;
            this.limpiar();
            this.enfocar();
            this.emitir("busqueda:limpiar", {});
        });

        // al corregir un campo se retira su mensaje y el aviso general
        this.escuchar(this.entradaNombre, "input", () => this.quitarError("nombre"));
        this.escuchar(this.selectorCategoria, "change", () => this.quitarError(null));
        this.escuchar(this.selectorOrigen, "change", () => this.quitarError(null));
        this.escuchar(this.elemento, "sugerencias:cambiar", () => this.quitarError("ingrediente"));
        this.escuchar(this.elemento, "sugerencias:elegir", () => this.quitarError("ingrediente"));
    }

    // -------------------------------------------------------------------
    // envio

    enviar() {
        const criterios = this.leerCriterios();
        const errores = FormularioBusqueda.validar(criterios);

        // los campos quedan con el texto ya recortado que se va a buscar
        this.aplicarValores(criterios);
        this.actualizarEstado({ valores: criterios, errores });

        if (!FormularioBusqueda.esValido(errores)) {
            this.enfocarPrimerError(errores);
            return;
        }
        this.emitir("busqueda:enviar", { criterios: { ...criterios } });
    }

    leerCriterios() {
        return FormularioBusqueda.completarCriterios({
            nombre: this.entradaNombre.value,
            categoria: this.selectorCategoria.value,
            origen: this.selectorOrigen.value,
            ingrediente: this.campoIngrediente?.obtenerValor() ?? "",
        });
    }

    aplicarValores(valores) {
        this.entradaNombre.value = valores.nombre;
        this.selectorCategoria.value = valores.categoria;
        this.selectorOrigen.value = valores.origen;
        this.campoIngrediente?.establecerValor(valores.ingrediente);
    }

    // con un campo invalido el foco va a el y el lector lee su mensaje
    // (aria-describedby); el aviso general se anuncia solo por role="alert"
    enfocarPrimerError(errores) {
        if (errores.nombre) this.entradaNombre.focus();
        else if (errores.ingrediente) this.campoIngrediente?.enfocar();
    }

    quitarError(campo) {
        const { errores } = this.estado;
        const hayQueQuitar = errores.general !== null || (campo !== null && errores[campo] !== null);
        if (!hayQueQuitar) return;
        const cambios = { general: null };
        if (campo !== null) cambios[campo] = null;
        this.actualizarEstado({ errores: { ...errores, ...cambios } });
    }

    // -------------------------------------------------------------------
    // identificadores del dom

    idCampo(nombre) {
        return `${this.prefijo}-${nombre}`;
    }

    idEtiqueta(nombre) {
        return `${this.prefijo}-${nombre}-etiqueta`;
    }

    idMensaje(nombre) {
        return `${this.prefijo}-${nombre}-error`;
    }

    // -------------------------------------------------------------------
    // metodos publicos

    limpiar() {
        if (this.destruido) return;
        const vacios = FormularioBusqueda.completarCriterios({});
        this.entradaNombre.value = "";
        this.selectorCategoria.value = "";
        this.selectorOrigen.value = "";
        this.campoIngrediente?.limpiar();
        this.actualizarEstado({ valores: vacios, errores: FormularioBusqueda.sinErrores() });
    }

    enfocar() {
        this.entradaNombre?.focus();
    }
}
