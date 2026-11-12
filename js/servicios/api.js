/*
 * servicioapi
 * clase encargada de realizar las peticiones http a la api de themealdb.
 */
class ServicioAPI {
    constructor() {
        this.urlBase = "https://www.themealdb.com/api/json/v1/1";
    }

    // metodo genérico para realizar peticiones fetch
    async obtenerDatos(endpoint) {
        try {
            const respuesta = await fetch(`${this.urlBase}/${endpoint}`);
            if (!respuesta.ok) {
                throw new Error(`error en la peticion: ${respuesta.status}`);
            }
            return await respuesta.json();
        } catch (error) {
            console.error("error al consumir la api:", error);
            return null;
        }
    }
}