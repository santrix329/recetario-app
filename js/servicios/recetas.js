/*
 * recetas.js
 * normaliza las recetas crudas de themealdb a un formato propio.
 * el resto de la aplicacion solo trabaja con este formato, nunca con los
 * campos strIngredient1..20 ni strMeasure1..20 de la api.
 *
 * receta resumida: { id, nombre, imagen, completa: false }
 * receta completa: { id, nombre, imagen, completa: true, categoria, origen,
 *                    instrucciones, etiquetas, video, ingredientes, pasos, palabras }
 */

const MAXIMO_INGREDIENTES_API = 20;
const URL_IMAGENES_INGREDIENTES = "https://www.themealdb.com/images/ingredients/";

// una linea que solo trae la numeracion del paso: "STEP 1", "step 2:", "1.", "3)"
const PATRON_ENCABEZADO_PASO = /^(step|paso)?\s*\d+\s*[.:)\-]?$/i;

// convierte cualquier valor de la api en texto sin espacios en los extremos
function limpiarTexto(valor) {
    return typeof valor === "string" ? valor.trim() : "";
}

// clave para comparar ingredientes y etiquetas sin distinguir mayusculas
function normalizarClave(texto) {
    return limpiarTexto(texto).toLowerCase();
}

// recorta un texto largo y agrega puntos suspensivos solo si hizo falta cortar
function resumirTexto(texto, maximo) {
    const limpio = limpiarTexto(texto);
    return limpio.length > maximo ? limpio.slice(0, maximo) + "…" : limpio;
}

function urlImagenIngrediente(nombre) {
    return URL_IMAGENES_INGREDIENTES + encodeURIComponent(nombre) + ".png";
}

// "Meat, Casserole,," -> ["Meat", "Casserole"]
function extraerEtiquetas(textoEtiquetas) {
    return limpiarTexto(textoEtiquetas)
        .split(",")
        .map(limpiarTexto)
        .filter((etiqueta) => etiqueta !== "");
}

// un paso es cada linea no vacia que no sea solo un encabezado de numeracion
function extraerPasos(instrucciones) {
    return limpiarTexto(instrucciones)
        .split(/\r?\n/)
        .map(limpiarTexto)
        .filter((linea) => linea !== "" && !PATRON_ENCABEZADO_PASO.test(linea));
}

function contarPalabras(texto) {
    const limpio = limpiarTexto(texto);
    return limpio === "" ? 0 : limpio.split(/\s+/).length;
}

// recorre los 20 pares nombre/medida y se queda con los que tienen nombre
function extraerIngredientes(recetaCruda) {
    const ingredientes = [];
    for (let numero = 1; numero <= MAXIMO_INGREDIENTES_API; numero++) {
        const nombre = limpiarTexto(recetaCruda["strIngredient" + numero]);
        if (nombre === "") continue;
        ingredientes.push({
            nombre,
            medida: limpiarTexto(recetaCruda["strMeasure" + numero]),
            imagen: urlImagenIngrediente(nombre),
        });
    }
    return ingredientes;
}

// receta resumida: lo unico que devuelven los endpoints filter.php
function normalizarResumen(recetaCruda) {
    return {
        id: limpiarTexto(recetaCruda.idMeal),
        nombre: limpiarTexto(recetaCruda.strMeal),
        imagen: limpiarTexto(recetaCruda.strMealThumb),
        completa: false,
    };
}

// receta completa: search.php, lookup.php y random.php
function normalizarReceta(recetaCruda) {
    const instrucciones = limpiarTexto(recetaCruda.strInstructions);
    return {
        ...normalizarResumen(recetaCruda),
        completa: true,
        categoria: limpiarTexto(recetaCruda.strCategory),
        origen: limpiarTexto(recetaCruda.strArea),
        instrucciones,
        etiquetas: extraerEtiquetas(recetaCruda.strTags),
        video: limpiarTexto(recetaCruda.strYoutube),
        ingredientes: extraerIngredientes(recetaCruda),
        pasos: extraerPasos(instrucciones),
        palabras: contarPalabras(instrucciones),
    };
}
