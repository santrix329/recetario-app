/*
 * TablaComparacion
 * muestra las metricas de comparacion entre dos recetas: declara la mas
 * sencilla, resalta el menor valor de cada metrica numerica y lista
 * etiquetas e ingredientes en comun y exclusivos.
 *
 * propiedades: { recetas: [recetaA, recetaB] }  (recetas completas normalizadas)
 * emite:       nada; si cambian las recetas, la vista la destruye y monta otra
 *
 * los calculos viven en js/servicios/comparacion.js (compararRecetas).
 */

const LETRAS_COMPARACION = ["A", "B"];

const RAZONES_SENCILLEZ = {
    ingredientes: "Tiene menos ingredientes",
    pasos: "Empatan en ingredientes, pero tiene menos pasos",
    palabras: "Empatan en ingredientes y pasos, pero sus instrucciones son más cortas",
};

class TablaComparacion extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.recetas = propiedades.recetas;
        this.resultado = compararRecetas(this.recetas[0], this.recetas[1]);
    }

    crearElemento() {
        return crearNodo("section", {
            clase: "comparacion",
            atributos: { "aria-labelledby": "comparacion-titulo" },
            hijos: [
                crearNodo("h2", { clase: "seccion__titulo", texto: "Comparación", atributos: { id: "comparacion-titulo" } }),
                this.crearVeredicto(),
                this.crearTabla(),
            ],
        });
    }

    // -------------------------------------------------------------------
    // veredicto: receta mas sencilla y similitud

    crearVeredicto() {
        const { masSencilla, similitud } = this.resultado;
        const empate = masSencilla.indice === null;
        const titulo = empate
            ? "Empate: las dos recetas son igual de sencillas"
            : `Más sencilla: «${this.recetas[masSencilla.indice].nombre}» (panel ${LETRAS_COMPARACION[masSencilla.indice]})`;
        const razon = empate
            ? "Tienen los mismos ingredientes, pasos y palabras en sus instrucciones."
            : `${RAZONES_SENCILLEZ[masSencilla.criterio]}.`;

        return crearNodo("div", {
            clase: "comparacion__veredicto",
            hijos: [
                crearNodo("div", {
                    clase: "comparacion__sencilla",
                    hijos: [
                        crearNodo("p", { clase: "comparacion__sencilla-titulo", texto: titulo }),
                        crearNodo("p", { clase: "comparacion__sencilla-razon", texto: razon }),
                    ],
                }),
                crearNodo("div", {
                    clase: "comparacion__similitud",
                    hijos: [
                        crearNodo("span", { clase: "comparacion__similitud-valor", texto: `${similitud} %` }),
                        crearNodo("span", { clase: "comparacion__similitud-etiqueta", texto: "de similitud en ingredientes" }),
                        crearNodo("span", {
                            clase: "comparacion__barra",
                            atributos: { role: "img", "aria-label": `${similitud} por ciento de similitud` },
                            hijos: [crearNodo("span", { clase: "comparacion__barra-relleno", atributos: { style: `width: ${similitud}%` } })],
                        }),
                    ],
                }),
            ],
        });
    }

    // -------------------------------------------------------------------
    // tabla

    crearTabla() {
        const r = this.resultado;
        const cabecera = crearNodo("thead", {
            hijos: [crearNodo("tr", {
                hijos: [
                    crearNodo("th", { texto: "Métrica", atributos: { scope: "col" } }),
                    ...this.recetas.map((receta, indice) => crearNodo("th", {
                        atributos: { scope: "col" },
                        hijos: [
                            crearNodo("span", { clase: "comparacion__letra", texto: LETRAS_COMPARACION[indice] }),
                            crearNodo("span", { texto: receta.nombre }),
                        ],
                    })),
                ],
            })],
        });

        const filas = [
            ...r.numericas.map((metrica) => this.filaNumerica(metrica)),
            this.filaDato("Categoría", r.categoria),
            this.filaDato("Origen", r.origen),
            this.filaUnica("Etiquetas en común", this.lista(r.etiquetasEnComun, "Ninguna en común")),
            this.filaDoble("Video", r.video.map((tiene) => crearNodo("span", { texto: tiene ? "Sí" : "No" }))),
            this.filaUnica("Ingredientes en común", this.lista(r.ingredientesEnComun, "Ninguno en común")),
            this.filaDoble("Ingredientes exclusivos", r.exclusivos.map((lista) => this.lista(lista, "Ninguno"))),
            this.filaUnica("Similitud", crearNodo("strong", { texto: `${r.similitud} %` })),
        ];

        return crearNodo("div", {
            clase: "comparacion__marco",
            hijos: [crearNodo("table", {
                clase: "comparacion__tabla",
                hijos: [
                    crearNodo("caption", {
                        clase: "solo-lectores",
                        texto: `Comparación entre ${this.recetas[0].nombre} y ${this.recetas[1].nombre}`,
                    }),
                    cabecera,
                    crearNodo("tbody", { hijos: filas }),
                ],
            })],
        });
    }

    encabezadoFila(texto, extra) {
        return crearNodo("th", { atributos: { scope: "row" }, hijos: [crearNodo("span", { texto }), extra] });
    }

    // el menor valor se resalta con color y con texto para lectores de pantalla
    filaNumerica({ etiqueta, valores, menor }) {
        return crearNodo("tr", {
            hijos: [
                this.encabezadoFila(etiqueta),
                ...valores.map((valor, indice) => {
                    const esMenor = indice === menor;
                    return crearNodo("td", {
                        clase: esMenor ? "comparacion__valor comparacion__valor--menor" : "comparacion__valor",
                        hijos: [
                            crearNodo("span", { texto: valor }),
                            esMenor ? crearNodo("span", { clase: "comparacion__menor", texto: "menor" }) : null,
                        ],
                    });
                }),
            ],
        });
    }

    filaDato(etiqueta, { valores, coinciden }) {
        const marca = crearNodo("span", {
            clase: coinciden ? "comparacion__coincide" : "comparacion__difiere",
            texto: coinciden ? "Coinciden" : "Distintas",
        });
        return this.filaDoble(etiqueta, valores.map((valor) => crearNodo("span", { texto: valor || "Sin dato" })), marca);
    }

    filaDoble(etiqueta, celdas, extra) {
        return crearNodo("tr", {
            hijos: [this.encabezadoFila(etiqueta, extra), ...celdas.map((contenido) => crearNodo("td", { hijos: [contenido] }))],
        });
    }

    filaUnica(etiqueta, contenido) {
        return crearNodo("tr", {
            hijos: [this.encabezadoFila(etiqueta), crearNodo("td", { atributos: { colspan: 2 }, hijos: [contenido] })],
        });
    }

    lista(textos, vacio) {
        if (textos.length === 0) return crearNodo("span", { clase: "comparacion__ninguno", texto: vacio });
        return crearNodo("ul", {
            clase: "comparacion__lista",
            hijos: textos.map((texto) => crearNodo("li", { clase: "dato", texto })),
        });
    }
}
