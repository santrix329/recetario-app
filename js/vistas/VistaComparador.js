/*
 * VistaComparador
 * Vista principal para comparar recetas con enfoque dinamico basado en nodos.
 */
class VistaComparador extends Componente {
    constructor(propiedades) {
        super(propiedades);
        this.actualizarVista = this.actualizarVista.bind(this);
    }

    montar(contenedor) {
        super.montar(contenedor);
        avisosComparador.addEventListener("cambio", this.actualizarVista);
    }

    desmontar() {
        avisosComparador.removeEventListener("cambio", this.actualizarVista);
        super.desmontar();
    }

    actualizarVista() {
        const contenedorInterno = this.elemento.querySelector(".comparador__contenido");
        if (contenedorInterno) {
            contenedorInterno.replaceWith(this.crearContenidoComparador());
        }
    }

    crearElemento() {
        const seccion = crearNodo("section", { clase: "vista vista-comparador" });
        
        const titulo = crearNodo("h1", {
            clase: "vista__titulo",
            texto: "Comparador de recetas",
            atributos: { tabindex: "-1" }
        });

        const subtitulo = crearNodo("p", {
            clase: "vista__subtitulo",
            texto: "Analiza similitudes y diferencias entre platos de forma dinámica."
        });

        seccion.append(titulo, subtitulo, this.crearContenidoComparador());
        return seccion;
    }

    crearContenidoComparador() {
        const contenedor = crearNodo("div", { clase: "comparador__contenido" });
        const cantidad = cantidadEnComparador();

        // Estado inicial: Vacío
        if (cantidad === 0) {
            const mensajeVacio = crearNodo("div", { clase: "comparador__vacio" });
            
            const icono = crearNodo("div", { clase: "comparador__vacio-icono", texto: "⚖️" });
            const h3 = crearNodo("h3", { texto: "El comparador está vacío" });
            const p = crearNodo("p", { texto: 'Explora el catálogo y selecciona recetas usando el botón "Comparar".' });
            const enlace = crearNodo("a", { 
                clase: "btn btn-primario", 
                texto: "Ir a explorar",
                atributos: { href: "#/explorar" }
            });

            mensajeVacio.append(icono, h3, p, enlace);
            contenedor.append(mensajeVacio);
            return contenedor;
        }

        // Estado con recetas: Paneles A y B
        const panelesGrid = crearNodo("div", { clase: "comparador__paneles" });
        const recetas = recetasEnComparador();

        recetas.forEach((receta, index) => {
            const letraPanel = index === 0 ? "A" : "B";
            const panelClase = receta ? `comparador__panel comparador__panel--${letraPanel.toLowerCase()}` : `comparador__panel comparador__panel--vacio`;
            const panel = crearNodo("div", { clase: panelClase });

            const cabecera = crearNodo("div", { clase: "panel__cabecera" });
            const badge = crearNodo("span", { clase: "panel__badge", texto: `Panel ${letraPanel}` });
            cabecera.append(badge);

            if (receta) {
                const btnQuitar = crearNodo("button", { 
                    clase: "btn-icon btn-quitar", 
                    texto: "✕",
                    atributos: { title: "Quitar receta", "data-index": index }
                });
                btnQuitar.addEventListener("click", () => vaciarPanel(index));
                cabecera.append(btnQuitar);

                const infoReceta = crearNodo("div", { clase: "panel__info-receta" });
                const img = crearNodo("img", { 
                    clase: "panel__imagen", 
                    atributos: { src: receta.strMealThumb, alt: receta.strMeal } 
                });
                const nombre = crearNodo("h3", { clase: "panel__nombre", texto: receta.strMeal });
                
                const meta = crearNodo("div", { clase: "panel__meta" });
                const tagCat = crearNodo("span", { clase: "tag", texto: `Cat: ${receta.strCategory || "N/A"}` });
                const tagArea = crearNodo("span", { clase: "tag", texto: `Origen: ${receta.strArea || "N/A"}` });
                meta.append(tagCat, tagArea);

                const enlaceDetalle = crearNodo("a", { 
                    clase: "btn btn-secundario", 
                    texto: "Ver receta completa",
                    atributos: { href: `#/detalle?id=${receta.idMeal}` }
                });

                infoReceta.append(img, nombre, meta, enlaceDetalle);
                panel.append(cabecera, infoReceta);
            } else {
                const vacioInfo = crearNodo("div", { clase: "panel__vacio" });
                const p1 = crearNodo("p", { texto: "Espacio disponible" });
                const p2 = crearNodo("span", { clase: "panel__vacio-sub", texto: "Selecciona otra receta para comparar lado a lado" });
                vacioInfo.append(p1, p2);
                panel.append(cabecera, vacioInfo);
            }

            panelesGrid.append(panel);
        });

        contenedor.append(panelesGrid);

        // Controles globales (intercambiar paneles o vaciar todo)
        const controlesGlobales = crearNodo("div", { clase: "comparador__controles-globales" });

        if (cantidad === 2) {
            const btnIntercambiar = crearNodo("button", { 
                clase: "btn btn-secundario", 
                texto: "⇄ Intercambiar posiciones" 
            });
            btnIntercambiar.addEventListener("click", () => intercambiarPaneles());
            controlesGlobales.append(btnIntercambiar);
        }

        const btnVaciarTodo = crearNodo("button", { 
            clase: "btn btn-peligro", 
            texto: "Vaciar comparador" 
        });
        btnVaciarTodo.addEventListener("click", () => {
            vaciarPanel(0);
            vaciarPanel(1);
        });
        controlesGlobales.append(btnVaciarTodo);

        contenedor.append(controlesGlobales);

        return contenedor;
    }
}