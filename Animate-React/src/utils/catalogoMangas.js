import { baseDatosMangas } from "../data/mangas";

const CATALOGO_KEY = "catalogoManga";
const PAPELERA_KEY = "papeleraManga";

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

// SE AGREGAN FUNCTIONS PARA EL ADMIN
export function obtenerPapelera() {
    const data = localStorage.getItem(PAPELERA_KEY);
    return data ? JSON.parse(data) : [];
}

function guardarPapelera(lista) {
    localStorage.setItem(PAPELERA_KEY, JSON.stringify(lista));
}

function generarNuevoIdManga() {
    const idsCatalogo = obtenerCatalogoCompleto().map(m => m.id);
    const idsPapelera = obtenerPapelera().map(m => m.id);
    return Math.max(0, ...idsCatalogo, ...idsPapelera) + 1;
}

export function agregarManga(datos) {
    const catalogo = obtenerCatalogoCompleto();

    const nuevoManga = {
        id: generarNuevoIdManga(),
        titulo: datos.titulo,
        genero: datos.genero,
        vistas: 0,
        fechaAgregado: new Date().toISOString().slice(0, 10),
        sinopsis: datos.sinopsis,
        imgPortada: datos.imgPortada,
        volumenes: [
            { tomo: 1, precio: datos.precio, stock: datos.stock, img: datos.imgPortada },
        ],
    };

    catalogo.push(nuevoManga);
    guardarCatalogo(catalogo);
    return nuevoManga;
}

export function eliminarManga(id) {
    const catalogo = obtenerCatalogoCompleto();
    const manga = catalogo.find(m => m.id === id);
    if (!manga) return;

    guardarCatalogo(catalogo.filter(m => m.id !== id));

    const papelera = obtenerPapelera();
    papelera.push(manga);
    guardarPapelera(papelera);
}

export function restaurarManga(id) {
    const papelera = obtenerPapelera();
    const manga = papelera.find(m => m.id === id);
    if (!manga) return;

    guardarPapelera(papelera.filter(m => m.id !== id));

    const catalogo = obtenerCatalogoCompleto();
    catalogo.push(manga);
    guardarCatalogo(catalogo);
}

function generarNuevoTomo(manga) {
    const tomos = manga.volumenes.map(v => v.tomo);
    return Math.max(0, ...tomos) + 1;
}

export function agregarTomo(mangaId, datos) {
    const catalogo = obtenerCatalogoCompleto();
    const manga = catalogo.find(m => m.id === mangaId);
    if (!manga) return;

    manga.volumenes.push({
        tomo: generarNuevoTomo(manga),
        precio: datos.precio,
        stock: datos.stock,
        img: datos.img,
    });

    guardarCatalogo(catalogo);
}

export function eliminarTomo(mangaId, tomo) {
    const catalogo = obtenerCatalogoCompleto();
    const manga = catalogo.find(m => m.id === mangaId);
    if (!manga) return;

    manga.volumenes = manga.volumenes.filter(v => v.tomo !== tomo);
    guardarCatalogo(catalogo);
}

export function cambiarPrecioYStockTomo(mangaId, tomo, nuevoPrecio, nuevoStock) {
    const catalogo = obtenerCatalogoCompleto();
    const manga = catalogo.find(m => m.id === mangaId);
    if (!manga) return;

    const volumen = manga.volumenes.find(v => v.tomo === tomo);
    if (!volumen) return;

    volumen.precio = nuevoPrecio;
    volumen.stock = nuevoStock;
    guardarCatalogo(catalogo);
}