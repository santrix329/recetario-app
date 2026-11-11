/*
 * ListadoRecetas
 * cuadricula paginada de tarjetas de receta. lo usan explorar, la ficha de
 * categorias y origenes y las recetas relacionadas del detalle.
 *
 * al mostrar una pagina pide en paralelo el detalle de sus recetas con
 * Promise.allSettled: si una falla, solo esa tarjeta queda incompleta y
 * ofrece reintentar; el resto de la pagina se muestra normal.
 *
 * propiedades: { recetas (ya ordenadas), porPagina = 12, pagina = 1,
 *                conPaginador = true, mostrarTotal = true }
 * emite:       "listado:pagina" { pagina } para que la vista recuerde la pagina
 * escucha:     "paginador:cambiar" y "tarjeta:reintentar" de sus hijos
 */
class ListadoRecetas extends Componente {
    constructor(contenedor, propiedades) {
        super(contenedor, propiedades);
        this.recetas = propiedades.recetas;
        this.porPagina = propiedades.porPagina ?? 12;
        this.estado = { pagina: this.ajustarPagina(propiedades.pagina ?? 1) };
        this.cuadricula = null;
        this.zonaPaginador = null;
        this.paginador = null;
        this.tarjetasPorId = new Map();
    }

    get totalPaginas() {
        return Math.max(1, Math.ceil(this.recetas.length / this.porPagina));
    }

    ajustarPagina(pagina) {
        return Math.min(Math.max(1, pagina), this.totalPaginas);
    }

    montar() {
        super.montar();
        if (this.propiedades.conPaginador !== false) {
            this.paginador = this.montarHijo(new Paginador(this.zonaPaginador, {
                pagina: this.estado.pagina,
                totalPaginas: this.totalPaginas,
            }));
        }
        this.mostrarPagina(this.estado.pagina);
        return this;
    }

    crearElemento() {
        const listado = crearNodo("div", { clase: "listado" });
        if (this.propiedades.mostrarTotal !== false) {
            const total = this.recetas.length;
            listado.append(crearNodo("p", {
                clase: "listado__total",
                texto: `${total} ${total === 1 ? "receta" : "recetas"}`,
            }));
        }
        this.cuadricula = crearNodo("div", { clase: "cuadricula" });
        this.zonaPaginador = crearNodo("div", { clase: "listado__paginador" });
        listado.append(this.cuadricula, this.zonaPaginador);
        return listado;
    }

    configurarEventos() {
        this.escuchar(this.elemento, "paginador:cambiar", (evento) => {
            this.mostrarPagina(evento.detail.pagina, { desplazar: true });
        });
        this.escuchar(this.elemento, "tarjeta:reintentar", (evento) => {
            this.reintentarTarjeta(evento.detail.id);
        });
    }

    async mostrarPagina(paginaPedida, { desplazar = false } = {}) {
        const pagina = this.ajustarPagina(paginaPedida);
        const turno = this.iniciarOperacion("pagina");

        this.actualizarEstado({ pagina });
        this.paginador?.mostrarPagina(pagina, this.totalPaginas);
        this.emitir("listado:pagina", { pagina });

        // primero se pintan las tarjetas con los datos resumidos
        this.vaciarRanura("tarjetas");
        this.tarjetasPorId.clear();
        const inicio = (pagina - 1) * this.porPagina;
        const visibles = this.recetas.slice(inicio, inicio + this.porPagina);
        const tarjetas = visibles.map((receta) => {
            const tarjeta = this.montarEnRanura("tarjetas", new TarjetaReceta(this.cuadricula, { receta }));
            this.tarjetasPorId.set(receta.id, tarjeta);
            return tarjeta;
        });
        if (desplazar) this.elemento.scrollIntoView({ block: "start" });

        try {
            // solo las de la pagina visible y todas a la vez; las que ya estan
            // completas o en la cache no generan peticion
            const resultados = await Promise.allSettled(
                visibles.map((receta) => (receta.completa ? Promise.resolve(receta) : obtenerRecetaPorId(receta.id)))
            );
            if (!this.sigueVigente("pagina", turno)) return;

            resultados.forEach((resultado, indice) => {
                if (resultado.status === "fulfilled" && resultado.value) tarjetas[indice].completar(resultado.value);
                else tarjetas[indice].marcarIncompleta();
            });
        } catch (error) {
            if (this.sigueVigente("pagina", turno)) tarjetas.forEach((tarjeta) => tarjeta.marcarIncompleta());
        }
    }

    async reintentarTarjeta(id) {
        const tarjeta = this.tarjetasPorId.get(id);
        if (!tarjeta) return;
        tarjeta.marcarCargando();
        try {
            const receta = await obtenerRecetaPorId(id);
            if (tarjeta.destruido) return;
            if (receta) tarjeta.completar(receta);
            else tarjeta.marcarIncompleta();
        } catch (error) {
            if (!tarjeta.destruido) tarjeta.marcarIncompleta();
        }
    }
}
