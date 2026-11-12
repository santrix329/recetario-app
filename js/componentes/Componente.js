/*
 * Componente.js
 * clase base de todos los pseudocomponentes.
 *
 * ciclo de vida:
 *   new Clase(contenedor, propiedades)  -> guarda datos, no toca el dom
 *   montar()                            -> crearElemento, renderizar, configurarEventos
 *   actualizarEstado(cambios)           -> cambia el estado y vuelve a renderizar
 *   destruir()                          -> destruye hijos, quita eventos y elimina el elemento
 *
 * reglas que sostiene esta clase:
 *   - el estado solo cambia por metodos propios (actualizarEstado)
 *   - los avisos hacia afuera son CustomEvent con los datos en detail
 *   - nadie toca el dom interno de otro componente
 */
class Componente {
    constructor(contenedor, propiedades = {}) {
        this.contenedor = contenedor;
        this.propiedades = propiedades;
        this.estado = {};
        this.elemento = null;
        this.hijos = [];
        this.ranuras = new Map();
        this.limpiezas = [];
        this.operaciones = new Map();
        this.destruido = false;
    }

    montar() {
        this.elemento = this.crearElemento();
        this.renderizar();
        this.configurarEventos();
        this.contenedor.append(this.elemento);
        return this;
    }

    // crea el elemento raiz y la estructura fija; cada subclase lo redefine
    crearElemento() {
        return crearNodo("div");
    }

    // vuelca el estado actual en el dom ya creado
    renderizar() {}

    // registra los eventos con this.escuchar para poder quitarlos al destruir
    configurarEventos() {}

    actualizarEstado(cambios) {
        this.estado = { ...this.estado, ...cambios };
        if (this.elemento) this.renderizar();
    }

    // estado que la vista quiere recuperar al volver a ella (por defecto nada)
    exportarEstado() {
        return null;
    }

    // ---------------------------------------------------------------------
    // hijos: componentes montados dentro de este y destruidos con el

    montarHijo(componente) {
        this.hijos.push(componente);
        return componente.montar();
    }

    destruirHijo(componente) {
        if (!componente) return;
        this.hijos = this.hijos.filter((hijo) => hijo !== componente);
        componente.destruir();
    }

    // ---------------------------------------------------------------------
    // ranuras: zonas cuyo contenido se reemplaza entero (carga -> resultado ->
    // error). vaciar una ranura destruye solo los hijos montados en ella.

    montarEnRanura(nombre, componente) {
        const montado = this.montarHijo(componente);
        this.ranuras.set(nombre, [...(this.ranuras.get(nombre) ?? []), montado]);
        return montado;
    }

    vaciarRanura(nombre) {
        (this.ranuras.get(nombre) ?? []).forEach((hijo) => this.destruirHijo(hijo));
        this.ranuras.set(nombre, []);
    }

    // ---------------------------------------------------------------------
    // eventos

    escuchar(objetivo, tipo, manejador) {
        objetivo.addEventListener(tipo, manejador);
        this.alDestruir(() => objetivo.removeEventListener(tipo, manejador));
    }

    emitir(tipo, detalle = {}) {
        // bubbles permite que la vista escuche en su propio elemento sin
        // conocer el dom interno del componente que emitio
        this.elemento.dispatchEvent(new CustomEvent(tipo, { detail: detalle, bubbles: true }));
    }

    // registra cualquier recurso a liberar: eventos, temporizadores, peticiones
    alDestruir(limpieza) {
        this.limpiezas.push(limpieza);
    }

    // ---------------------------------------------------------------------
    // respuestas obsoletas: cada carga recibe un numero de turno y solo la
    // ultima carga de ese nombre puede pintar su resultado

    iniciarOperacion(nombre) {
        const turno = (this.operaciones.get(nombre) ?? 0) + 1;
        this.operaciones.set(nombre, turno);
        return turno;
    }

    sigueVigente(nombre, turno) {
        return !this.destruido && this.operaciones.get(nombre) === turno;
    }

    // ---------------------------------------------------------------------

    destruir() {
        if (this.destruido) return;
        this.destruido = true;
        this.hijos.forEach((hijo) => hijo.destruir());
        this.hijos = [];
        this.ranuras.clear();
        this.limpiezas.forEach((limpieza) => limpieza());
        this.limpiezas = [];
        this.elemento?.remove();
        this.elemento = null;
    }
}
