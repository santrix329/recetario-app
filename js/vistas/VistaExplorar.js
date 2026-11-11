/*
 * VistaExplorar
 * busqueda de recetas combinando nombre, categoria, origen e ingrediente.
 * los criterios se combinan por interseccion: una receta aparece solo si
 * cumple todos los criterios aplicados.
 *
 * promesas:
 *   - el formulario necesita las tres listas (categorias, origenes e
 *     ingredientes) para ofrecer todos los criterios, asi que se piden en
 *     paralelo con Promise.all: sin una de ellas el formulario no sirve.
 *   - la busqueda pide en paralelo un listado por cada criterio aplicado,
 *     tambien con Promise.all: la interseccion necesita todas las listas; si
 *     faltara una, el resultado mostraria recetas que no cumplen ese criterio.
 *
 * escucha:      "busqueda:enviar", "busqueda:limpiar", "estado:reintentar",
 *               "listado:pagina"
 * deja subir:   "receta:abrir" y "receta:comparar" de las tarjetas (los resuelve app.js)
 * estado que exporta: { criterios, resultados, pagina } para volver sin repetir
 *                     la busqueda
 */

const CANTIDAD_FANTASMAS_EXPLORAR = 6;

// cada criterio con su texto visible y el endpoint que lo resuelve
const CRITERIOS_EXPLORAR = [
    { clave: "nombre", etiqueta: "Nombre", pedir: (valor) => buscarRecetasPorNombre(valor) },
    { clave: "categoria", etiqueta: "Categoría", pedir: (valor) => filtrarPorCategoria(valor) },
    { clave: "origen", etiqueta: "Origen", pedir: (valor) => filtrarPorOrigen(valor) },
    { clave: "ingrediente", etiqueta: "Ingrediente", pedir: (valor) => filtrarPorIngrediente(valor) },
];

class VistaExplorar extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        const guardado = propiedades.estadoGuardado ?? {};
        this.estado = {
            criterios: guardado.criterios ?? null,
            resultados: Array.isArray(guardado.resultados) ? guardado.resultados : null,
            pagina: guardado.pagina ?? 1,
        };
        this.zonaFormulario = null;
        this.zonaResultados = null;
        this.tituloResultados = null;
        this.listaCriterios = null;
        this.anuncio = null;
        this.formulario = null;
        this.criteriosPintados = undefined;
    }

    montar() {
        super.montar();
        this.cargarFormulario();
        this.restaurarResultados();
        return this;
    }

    crearElemento() {
        const vista = crearNodo("div", { clase: "vista vista-explorar" });

        const encabezado = crearNodo("header", {
            clase: "explorar__encabezado",
            hijos: [
                crearNodo("h1", { clase: "vista__titulo", texto: "Explorar recetas", atributos: { tabindex: "-1" } }),
                crearNodo("p", {
                    clase: "explorar__bajada",
                    texto: "Busca por nombre, categoría, origen o ingrediente. Puedes combinar varios criterios a la vez.",
                }),
            ],
        });

        this.zonaFormulario = crearNodo("div", { clase: "explorar__zona" });
        const seccionBusqueda = crearNodo("section", {
            clase: "seccion",
            atributos: { "aria-labelledby": "explorar-titulo-busqueda" },
            hijos: [
                crearNodo("h2", { clase: "solo-lectores", texto: "Criterios de búsqueda", atributos: { id: "explorar-titulo-busqueda" } }),
                this.zonaFormulario,
            ],
        });

        this.tituloResultados = crearNodo("h2", {
            clase: "seccion__titulo explorar__titulo-resultados",
            texto: "Resultados",
            atributos: { id: "explorar-titulo-resultados", tabindex: "-1" },
        });
        this.listaCriterios = crearNodo("ul", {
            clase: "explorar__criterios",
            atributos: { "aria-label": "Criterios aplicados", hidden: true },
        });
        // anuncia la cantidad encontrada a los lectores de pantalla
        this.anuncio = crearNodo("p", { clase: "solo-lectores", atributos: { role: "status" } });
        this.zonaResultados = crearNodo("div", { clase: "explorar__zona explorar__resultados" });

        const seccionResultados = crearNodo("section", {
            clase: "seccion",
            atributos: { "aria-labelledby": "explorar-titulo-resultados" },
            hijos: [
                crearNodo("div", { clase: "explorar__cabecera-resultados", hijos: [this.tituloResultados, this.listaCriterios] }),
                this.anuncio,
                this.zonaResultados,
            ],
        });

        vista.append(encabezado, seccionBusqueda, seccionResultados);
        return vista;
    }

    // pinta los criterios de la busqueda en curso como etiquetas
    renderizar() {
        const { criterios } = this.estado;
        if (criterios === this.criteriosPintados) return;
        this.criteriosPintados = criterios;

        const aplicados = this.criteriosAplicados(criterios);
        this.listaCriterios.hidden = aplicados.length === 0;
        this.listaCriterios.replaceChildren(...aplicados.map(({ clave, etiqueta }) => crearNodo("li", {
            clase: "dato",
            hijos: [
                crearNodo("span", { clase: "dato__etiqueta", texto: etiqueta }),
                crearNodo("span", { clase: "dato__valor", texto: criterios[clave] }),
            ],
        })));
    }

    configurarEventos() {
        this.escuchar(this.elemento, "busqueda:enviar", (evento) => {
            this.buscar(evento.detail.criterios);
        });

        this.escuchar(this.elemento, "busqueda:limpiar", () => {
            this.limpiar();
        });

        this.escuchar(this.elemento, "listado:pagina", (evento) => {
            this.actualizarEstado({ pagina: evento.detail.pagina });
        });

        this.escuchar(this.elemento, "estado:reintentar", (evento) => {
            if (evento.detail.seccion === "formulario") this.cargarFormulario({ enfocar: true });
            if (evento.detail.seccion === "resultados") this.reintentarBusqueda();
        });
    }

    exportarEstado() {
        const { criterios, resultados, pagina } = this.estado;
        return { criterios, resultados, pagina };
    }

    // -------------------------------------------------------------------
    // cargas

    async cargarFormulario({ enfocar = false } = {}) {
        const turno = this.iniciarOperacion("formulario");
        this.mostrarCarga("formulario");
        try {
            const [categorias, origenes, ingredientes] = await Promise.all([
                obtenerCategorias(),
                obtenerOrigenes(),
                obtenerIngredientes(),
            ]);
            if (this.sigueVigente("formulario", turno)) this.mostrarFormulario({ categorias, origenes, ingredientes }, { enfocar });
        } catch (error) {
            if (this.sigueVigente("formulario", turno)) this.mostrarError("formulario", error, { enfocar });
        }
    }

    async buscar(criterios, { enfocar = false } = {}) {
        const aplicados = this.criteriosAplicados(criterios);
        if (aplicados.length === 0) {
            this.limpiar();
            return;
        }

        const turno = this.iniciarOperacion("busqueda");
        this.actualizarEstado({ criterios: { ...criterios }, resultados: null, pagina: 1 });
        this.anuncio.textContent = "";
        this.mostrarCarga("resultados");

        try {
            const listas = await Promise.all(aplicados.map(({ clave, pedir }) => pedir(criterios[clave])));
            if (!this.sigueVigente("busqueda", turno)) return;

            const recetas = ordenarPorNombre(intersecarRecetas(listas));
            this.actualizarEstado({ resultados: recetas, pagina: 1 });
            this.mostrarResultados(recetas, 1);
            if (recetas.length > 0) {
                this.anuncio.textContent = `${recetas.length} ${recetas.length === 1 ? "receta encontrada" : "recetas encontradas"}.`;
            }
            if (enfocar) this.tituloResultados.focus();
        } catch (error) {
            if (this.sigueVigente("busqueda", turno)) this.mostrarError("resultados", error, { enfocar });
        }
    }

    reintentarBusqueda() {
        if (this.estado.criterios) this.buscar(this.estado.criterios, { enfocar: true });
        else this.mostrarInicio();
    }

    // al volver a la vista: si habia resultados se muestran tal cual, sin
    // pedir nada; si la busqueda no llego a terminar se repite
    restaurarResultados() {
        const { criterios, resultados, pagina } = this.estado;
        if (resultados) this.mostrarResultados(resultados, pagina);
        else if (criterios) this.buscar(criterios);
        else this.mostrarInicio();
    }

    limpiar() {
        // un turno nuevo descarta la busqueda que siga en camino
        this.iniciarOperacion("busqueda");
        this.actualizarEstado({ criterios: null, resultados: null, pagina: 1 });
        this.formulario?.limpiar();
        this.anuncio.textContent = "";
        this.mostrarInicio();
    }

    criteriosAplicados(criterios) {
        if (!criterios) return [];
        return CRITERIOS_EXPLORAR.filter(({ clave }) => Boolean(criterios[clave]));
    }

    // -------------------------------------------------------------------
    // pintado de cada seccion

    zonaDe(seccion) {
        return seccion === "formulario" ? this.zonaFormulario : this.zonaResultados;
    }

    vaciarSeccion(seccion) {
        if (seccion === "formulario") this.formulario = null;
        this.vaciarRanura(seccion);
    }

    mostrarCarga(seccion) {
        this.vaciarSeccion(seccion);
        const propiedades = seccion === "formulario"
            ? { tipo: "carga", forma: "formulario" }
            : { tipo: "carga", forma: "tarjetas", cantidad: CANTIDAD_FANTASMAS_EXPLORAR };
        this.montarEnRanura(seccion, new EstadoCarga(this.zonaDe(seccion), propiedades));
    }

    mostrarError(seccion, error, { enfocar = false } = {}) {
        this.vaciarSeccion(seccion);
        const estado = this.montarEnRanura(seccion, new EstadoCarga(this.zonaDe(seccion), { tipo: "error", error, seccion }));
        if (enfocar) estado.enfocar();
    }

    mostrarFormulario({ categorias, origenes, ingredientes }, { enfocar = false } = {}) {
        this.vaciarSeccion("formulario");
        this.formulario = this.montarEnRanura("formulario", new FormularioBusqueda(this.zonaFormulario, {
            prefijo: "explorar",
            categorias,
            origenes,
            ingredientes,
            valores: this.estado.criterios ?? {},
        }));
        if (enfocar) this.formulario.enfocar();
    }

    mostrarResultados(recetas, pagina) {
        this.vaciarSeccion("resultados");
        if (recetas.length === 0) {
            this.montarEnRanura("resultados", new EstadoCarga(this.zonaResultados, {
                tipo: "vacio",
                titulo: "Sin resultados",
                mensaje: "Ninguna receta cumple todos los criterios. Prueba quitando alguno.",
            }));
            return;
        }
        this.montarEnRanura("resultados", new ListadoRecetas(this.zonaResultados, { recetas, pagina }));
    }

    mostrarInicio() {
        this.vaciarSeccion("resultados");
        this.montarEnRanura("resultados", new EstadoCarga(this.zonaResultados, {
            tipo: "vacio",
            titulo: "Empieza a explorar",
            mensaje: "Combina nombre, categoría, origen o ingrediente: solo verás las recetas que cumplan todos.",
        }));
    }
}
