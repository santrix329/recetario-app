/*
 * EstadoCarga
 * muestra en una seccion su estado de carga, vacio o error.
 * cada estado es una instancia nueva: para pasar de carga a error la vista
 * destruye esta y monta otra.
 *
 * propiedades:
 *   tipo:     "carga" | "vacio" | "error"
 *   forma:    en "carga", forma del contenido que reemplaza:
 *             "destacada" | "tarjetas" | "detalle" | "formulario" | "opciones"
 *   cantidad: en forma "tarjetas", cuantas tarjetas fantasma dibujar
 *   titulo, mensaje: textos del estado "vacio"
 *   error:    ErrorApi del estado "error"
 *   seccion:  nombre de la seccion afectada; viaja en el evento de reintento
 *
 * emite: "estado:reintentar" con detail { seccion }
 */

const TITULOS_ERROR = {
    [TIPOS_ERROR_API.SIN_CONEXION]: "Sin conexión",
    [TIPOS_ERROR_API.SERVICIO_NO_DISPONIBLE]: "Servicio no disponible",
    [TIPOS_ERROR_API.RESPUESTA_INVALIDA]: "Respuesta inesperada",
};

class EstadoCarga extends Componente {
    crearElemento() {
        if (this.propiedades.tipo === "error") return this.crearError();
        if (this.propiedades.tipo === "vacio") return this.crearVacio();
        return this.crearCarga();
    }

    crearCarga() {
        const forma = this.propiedades.forma ?? "tarjetas";
        const contenedor = crearNodo("div", {
            clase: `estado-carga estado-carga--${forma}`,
            atributos: { role: "status", "aria-busy": "true" },
        });
        contenedor.append(crearNodo("span", { clase: "solo-lectores", texto: "Cargando…" }));

        const cantidad = this.propiedades.cantidad ?? 6;
        const fantasmas = {
            destacada: () => [this.crearFantasmaDestacada()],
            detalle: () => [this.crearFantasmaDetalle()],
            formulario: () => [this.crearFantasmaFormulario()],
            opciones: () => [this.crearFantasmaOpciones(cantidad)],
            tarjetas: () => Array.from({ length: cantidad }, () => this.crearFantasmaTarjeta()),
        };
        contenedor.append(...(fantasmas[forma] ?? fantasmas.tarjetas)());
        return contenedor;
    }

    // lineas fantasma con anchos variados para que parezcan texto
    crearLineasFantasma(cantidad) {
        const anchos = ["esqueleto--larga", "", "esqueleto--corta"];
        return Array.from({ length: cantidad }, (_, indice) =>
            crearNodo("div", { clase: `esqueleto esqueleto--linea ${anchos[indice % anchos.length]}` })
        );
    }

    crearFantasmaDetalle() {
        return crearNodo("div", {
            clase: "fantasma-detalle",
            atributos: { "aria-hidden": "true" },
            hijos: [
                this.crearFantasmaDestacada(),
                crearNodo("div", {
                    clase: "fantasma-detalle__columnas",
                    hijos: [
                        crearNodo("div", { clase: "fantasma-detalle__bloque", hijos: this.crearLineasFantasma(6) }),
                        crearNodo("div", { clase: "fantasma-detalle__bloque", hijos: this.crearLineasFantasma(8) }),
                    ],
                }),
            ],
        });
    }

    crearFantasmaFormulario() {
        return crearNodo("div", {
            clase: "fantasma-formulario",
            atributos: { "aria-hidden": "true" },
            hijos: [
                ...Array.from({ length: 4 }, () => crearNodo("div", {
                    clase: "fantasma-formulario__campo",
                    hijos: [
                        crearNodo("div", { clase: "esqueleto esqueleto--linea esqueleto--corta" }),
                        crearNodo("div", { clase: "esqueleto esqueleto--campo" }),
                    ],
                })),
                crearNodo("div", { clase: "esqueleto esqueleto--boton" }),
            ],
        });
    }

    crearFantasmaOpciones(cantidad) {
        return crearNodo("div", {
            clase: "fantasma-opciones",
            atributos: { "aria-hidden": "true" },
            hijos: Array.from({ length: cantidad }, () => crearNodo("div", { clase: "esqueleto esqueleto--opcion" })),
        });
    }

    crearFantasmaDestacada() {
        return crearNodo("div", {
            clase: "fantasma-destacada",
            atributos: { "aria-hidden": "true" },
            hijos: [
                crearNodo("div", { clase: "esqueleto fantasma-destacada__imagen" }),
                crearNodo("div", {
                    clase: "fantasma-destacada__texto",
                    hijos: [
                        crearNodo("div", { clase: "esqueleto esqueleto--linea esqueleto--corta" }),
                        crearNodo("div", { clase: "esqueleto esqueleto--titulo" }),
                        crearNodo("div", { clase: "esqueleto esqueleto--linea" }),
                        crearNodo("div", { clase: "esqueleto esqueleto--boton" }),
                    ],
                }),
            ],
        });
    }

    crearFantasmaTarjeta() {
        return crearNodo("div", {
            clase: "fantasma-tarjeta",
            atributos: { "aria-hidden": "true" },
            hijos: [
                crearNodo("div", { clase: "esqueleto fantasma-tarjeta__imagen" }),
                crearNodo("div", { clase: "esqueleto esqueleto--linea" }),
                crearNodo("div", { clase: "esqueleto esqueleto--linea esqueleto--corta" }),
            ],
        });
    }

    crearVacio() {
        return crearNodo("div", {
            clase: "estado estado--vacio",
            atributos: { role: "status" },
            hijos: [
                crearNodo("p", { clase: "estado__titulo", texto: this.propiedades.titulo ?? "Sin resultados" }),
                crearNodo("p", { clase: "estado__mensaje", texto: this.propiedades.mensaje ?? "" }),
            ],
        });
    }

    crearError() {
        const { error } = this.propiedades;
        const esErrorConocido = error instanceof ErrorApi;
        const titulo = (esErrorConocido && TITULOS_ERROR[error.tipo]) || "Algo salió mal";
        const mensaje = esErrorConocido
            ? error.message
            : "Ocurrió un problema inesperado al mostrar esta sección.";

        return crearNodo("div", {
            clase: "estado estado--error",
            atributos: { role: "alert" },
            hijos: [
                crearNodo("p", { clase: "estado__titulo", texto: titulo }),
                crearNodo("p", { clase: "estado__mensaje", texto: mensaje }),
                crearNodo("button", {
                    clase: "boton estado__reintentar",
                    texto: "Reintentar",
                    atributos: { type: "button" },
                }),
            ],
        });
    }

    // tras un reintento fallido el foco vuelve al boton de reintentar
    enfocar() {
        this.elemento?.querySelector(".estado__reintentar")?.focus();
    }

    configurarEventos() {
        if (this.propiedades.tipo !== "error") return;
        this.escuchar(this.elemento, "click", (evento) => {
            if (evento.target.closest(".estado__reintentar")) {
                this.emitir("estado:reintentar", { seccion: this.propiedades.seccion });
            }
        });
    }
}
