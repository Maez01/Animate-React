import { baseDatosMangas } from "../data/mangas";

const CATALOGO_KEY = "catalogoManga";

// Lee el catálogo de localStorage. La primera vez copia los datos base.
export function obtenerCatalogoCompleto() {
    const data = localStorage.getItem(CATALOGO_KEY);
    if (data) return JSON.parse(data);

    const copiaInicial = structuredClone(baseDatosMangas);
    guardarCatalogo(copiaInicial);
    return copiaInicial;
}

// Guarda el catálogo completo en localStorage.
export function guardarCatalogo(catalogo) {
    localStorage.setItem(CATALOGO_KEY, JSON.stringify(catalogo));
}

// Busca un tomo específico (lo usará el carrito para revisar el stock).
export function obtenerVolumen(mangaId, tomo) {
    const manga = obtenerCatalogoCompleto().find(m => m.id === mangaId);
    if (!manga) return null;
    return manga.volumenes.find(v => v.tomo === tomo) ?? null;
}

// Resta del stock de un tomo la cantidad comprada.
export function descontarStockTomo(mangaId, tomo, cantidad) {
    const catalogo = obtenerCatalogoCompleto();
    const manga = catalogo.find(m => m.id === mangaId);
    const volumen = manga?.volumenes.find(v => v.tomo === tomo);
    if (!volumen) return;

    volumen.stock = Math.max(0, volumen.stock - cantidad);
    guardarCatalogo(catalogo);
}