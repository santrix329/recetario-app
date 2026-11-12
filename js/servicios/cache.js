/*
 * serviciocache
 * servicio para gestionar la cache en memoria de recetas y datos de la sesion.
 */
class ServicioCache {
    constructor() {
        this.almacen = {};
    }

    // guarda datos en la memoria temporal
    guardar(clave, datos) {
        this.almacen[clave] = datos;
    }

    // obtiene datos de la memoria temporal
    obtener(clave) {
        return this.almacen[clave] || null;
    }

    // verifica si una clave ya existe en la cache
    tiene(clave) {
        return Object.prototype.hasOwnProperty.call(this.almacen, clave);
    }

    // limpia toda la cache
    limpiar() {
        this.almacen = {};
    }
}