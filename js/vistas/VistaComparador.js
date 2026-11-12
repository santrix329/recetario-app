/*
 * VistaComparador
 * Vista principal para comparar recetas con enfoque dinamico basado en nodos.
 */
class VistaComparador extends Componente {
    constructor(propiedades) {
        super(propiedades);
    }

    montar() {
        // Nos suscribimos al evento de cambio usando el helper de la clase base
        this.escuchar(avisosComparador, "cambio", () => {
            if (!this.destruido) {
                this.renderizar();
            }
        });
        return super.montar();
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

        const contenido = crearNodo("div", { clase: "comparador__contenido" });
        
        seccion.append(titulo, subtitulo, contenido);
        return seccion;
    }

    renderizar() {
        const contenedorContenido = this.elemento.querySelector(".comparador__contenido");
        if (!contenedorContenido) return;

        // Limpiamos el contenido anterior interno antes de pintar el nuevo estado
        contenedorContenido.innerHTML = "";
        contenedorContenido.append(this.generarContenidoComparador());
    }

    generarContenidoComparador() {
        const contenedor = document.createDocumentFragment();
        const recetas = recetasEnComparador();
        const cantidad = cantidadEnComparador();

        // Estado 1: Vacío
        if (cantidad === 0) {
            const mensajeVacio = crearNodo("div", { clase: "comparador__vacio" });
            
            const icono = crearNodo("div", { clase: "comparador__vacio-icono", texto: "⚖️" });
            const h3 = crearNodo("h3", { texto: "El comparador está vacío" });
            const p = crearNodo("p", { texto: 'Explora el catálogo y selecciona recetas usando el botón "Comparar".' });
            
            const enlace = crearNodo("a", { 
                clase: "btn btn-primario", 
                texto: "Ir a explorar",
                atributos: { href: "#" }
            });
            
            this.escuchar(enlace, "click", (e) => {
                e.preventDefault();
                navegarA("explorar");
            });

            mensajeVacio.append(icono, h3, p, enlace);
            contenedor.append(mensajeVacio);
            return contenedor;
        }

        // Estado 2: Con recetas (Paneles A y B)
        const panelesGrid = crearNodo("div", { clase: "comparador__paneles" });

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
                
                this.escuchar(btnQuitar, "click", () => vaciarPanel(index));
                cabecera.append(btnQuitar);

                const nombreReceta = receta.strMeal || receta.nombre || receta.titulo || "Receta sin nombre";
                const imagenReceta = receta.strMealThumb || receta.imagen || receta.foto || "";
                const categoriaReceta = receta.strCategory || receta.categoria || "N/A";
                const origenReceta = receta.strArea || receta.origen || "N/A";
                const idReceta = receta.idMeal || receta.id || "";

                const infoReceta = crearNodo("div", { clase: "panel__info-receta" });
                
                const imgAtribs = { alt: nombreReceta };
                if (imagenReceta) imgAtribs.src = imagenReceta;
                const img = crearNodo("img", { clase: "panel__imagen", atributos: imgAtribs });
                
                const nombre = crearNodo("h3", { clase: "panel__nombre", texto: nombreReceta });
                
                const meta = crearNodo("div", { clase: "panel__meta" });
                const tagCat = crearNodo("span", { clase: "tag", texto: `Cat: ${categoriaReceta}` });
                const tagArea = crearNodo("span", { clase: "tag", texto: `Origen: ${origenReceta}` });
                meta.append(tagCat, tagArea);

                const enlaceDetalle = crearNodo("a", { 
                    clase: "btn btn-secundario", 
                    texto: "Ver receta completa",
                    atributos: { href: "#" }
                });

                this.escuchar(enlaceDetalle, "click", (e) => {
                    e.preventDefault();
                    if (idReceta) abrirReceta(idReceta);
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
            this.escuchar(btnIntercambiar, "click", () => intercambiarPaneles());
            controlesGlobales.append(btnIntercambiar);
        }

        const btnVaciarTodo = crearNodo("button", { 
            clase: "btn btn-peligro", 
            texto: "Vaciar comparador" 
        });
        this.escuchar(btnVaciarTodo, "click", () => {
            vaciarPanel(0);
            vaciarPanel(1);
        });
        controlesGlobales.append(btnVaciarTodo);

        contenedor.append(controlesGlobales);

        return contenedor;
    }
}