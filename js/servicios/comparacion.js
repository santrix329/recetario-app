/*
 * comparacion.js
 * calcula las metricas del comparador entre dos recetas completas
 * normalizadas (seccion 4.6 del enunciado). no toca el dom: la tabla que
 * las muestra es el pseudocomponente TablaComparacion.
 *
 * ingredientes y etiquetas se comparan sin distinguir mayusculas y sin los
 * espacios de los extremos (normalizarClave de recetas.js).
 */

// metricas numericas en el orden en que se muestran
const METRICAS_NUMERICAS = [
    { clave: "ingredientes", etiqueta: "Cantidad de ingredientes", valor: (receta) => receta.ingredientes.length },
    { clave: "pasos", etiqueta: "Cantidad de pasos", valor: (receta) => receta.pasos.length },
    { clave: "palabras", etiqueta: "Extensión de las instrucciones (palabras)", valor: (receta) => receta.palabras },
];

// orden de desempate para declarar la receta mas sencilla
const CRITERIOS_SENCILLEZ = ["ingredientes", "pasos", "palabras"];

// indice (0 o 1) del valor menor, o null si son iguales
function indiceMenor([valorA, valorB]) {
    if (valorA === valorB) return null;
    return valorA < valorB ? 0 : 1;
}

// mapa clave normalizada -> texto original; un repetido cuenta una sola vez
function mapaPorClave(textos) {
    const mapa = new Map();
    for (const texto of textos) {
        const clave = normalizarClave(texto);
        if (clave !== "" && !mapa.has(clave)) mapa.set(clave, texto.trim());
    }
    return mapa;
}

// textos de a cuya clave tambien esta en b (se muestra la escritura de a)
function enComun(mapaA, mapaB) {
    return [...mapaA].filter(([clave]) => mapaB.has(clave)).map(([, texto]) => texto);
}

function soloEn(mapa, otro) {
    return [...mapa].filter(([clave]) => !otro.has(clave)).map(([, texto]) => texto);
}

function compararDato(valorA, valorB) {
    return {
        valores: [valorA, valorB],
        coinciden: normalizarClave(valorA) !== "" && normalizarClave(valorA) === normalizarClave(valorB),
    };
}

// menos ingredientes; si empatan, menos pasos; si siguen, menos palabras
function declararMasSencilla(numericas) {
    for (const criterio of CRITERIOS_SENCILLEZ) {
        const { menor } = numericas.find((metrica) => metrica.clave === criterio);
        if (menor !== null) return { indice: menor, criterio };
    }
    return { indice: null, criterio: "empate" };
}

function compararRecetas(recetaA, recetaB) {
    const numericas = METRICAS_NUMERICAS.map(({ clave, etiqueta, valor }) => {
        const valores = [valor(recetaA), valor(recetaB)];
        return { clave, etiqueta, valores, menor: indiceMenor(valores) };
    });

    const ingredientesA = mapaPorClave(recetaA.ingredientes.map((ingrediente) => ingrediente.nombre));
    const ingredientesB = mapaPorClave(recetaB.ingredientes.map((ingrediente) => ingrediente.nombre));
    const comunes = enComun(ingredientesA, ingredientesB);

    // union de ingredientes distintos = a + los de b que no estan en a
    const distintos = ingredientesA.size + soloEn(ingredientesB, ingredientesA).length;

    return {
        numericas,
        categoria: compararDato(recetaA.categoria, recetaB.categoria),
        origen: compararDato(recetaA.origen, recetaB.origen),
        etiquetasEnComun: enComun(mapaPorClave(recetaA.etiquetas), mapaPorClave(recetaB.etiquetas)),
        video: [Boolean(recetaA.video), Boolean(recetaB.video)],
        ingredientesEnComun: comunes,
        exclusivos: [soloEn(ingredientesA, ingredientesB), soloEn(ingredientesB, ingredientesA)],
        similitud: distintos === 0 ? 0 : Math.round((comunes.length / distintos) * 100),
        masSencilla: declararMasSencilla(numericas),
    };
}
