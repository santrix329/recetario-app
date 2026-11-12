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
        }

        return contenedor;
    }
}