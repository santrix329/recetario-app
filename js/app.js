/*
 * iniciarApp
 * Inicializa el punto de entrada principal de la SPA y verifica el arranque.
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("Estructura base del Recetario inicializada correctamente.");
    
    const contenedorApp = document.querySelector("#app");
    contenedorApp.innerHTML = `
        <h1>Recetario SPA</h1>
        <p>Estructura inicial .</p>
    `;
});