/*
 * Aviso
 * mensaje breve que aparece abajo de la pantalla y se va solo.
 * reemplaza a alert(), que el enunciado prohibe.
 *
 * propiedades: { mensaje, tipo: "exito" | "info" | "error", duracion = 4500 }
 * emite:       "aviso:cerrar" {} al vencer el tiempo o al pulsar cerrar
 */
class Aviso extends Componente {
    crearElemento() {
        const tipo = this.propiedades.tipo ?? "info";
        return crearNodo("div", {
            clase: `aviso aviso--${tipo}`,
            atributos: { role: tipo === "error" ? "alert" : "status" },
            hijos: [
                crearNodo("p", { clase: "aviso__mensaje", texto: this.propiedades.mensaje }),
                crearNodo("button", {
                    clase: "aviso__cerrar",
                    texto: "×",
                    atributos: { type: "button", "aria-label": "Cerrar aviso" },
                }),
            ],
        });
    }

    configurarEventos() {
        this.escuchar(this.elemento, "click", (evento) => {
            if (evento.target.closest(".aviso__cerrar")) this.emitir("aviso:cerrar");
        });

        // el temporizador es un recurso del componente: se cancela al destruirlo
        const temporizador = setTimeout(() => this.emitir("aviso:cerrar"), this.propiedades.duracion ?? 4500);
        this.alDestruir(() => clearTimeout(temporizador));
    }
}
