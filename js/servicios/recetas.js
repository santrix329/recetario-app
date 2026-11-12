/*
 * serviciorecetas
 * servicio especializado en gestionar las operaciones y consultas de recetas.
 */
class ServicioRecetas {
    constructor() {
        this.api = new ServicioAPI();
    }

    // busca recetas que coincidan con un nombre o termino
    async buscarLosPorNombre(termino) {
        const respuesta = await this.api.obtenerDatos(`search.php?s=${termino}`);
        return respuesta ? respuesta.meals : [];
    }

    // obtiene los detalles completos de una receta usando su id unico
    async obtenerPorId(id) {
        const respuesta = await this.api.obtenerDatos(`lookup.php?i=${id}`);
        return respuesta && respuesta.meals ? respuesta.meals[0] : null;
    }

    // obtiene una receta aleatoria para la vista de inicio
    async obtenerAleatoria() {
        const respuesta = await this.api.obtenerDatos("random.php");
        return respuesta && respuesta.meals ? respuesta.meals[0] : null;
    }
}