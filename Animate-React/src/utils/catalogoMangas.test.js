import { describe, it, expect } from "vitest";
import {
    obtenerCatalogoCompleto,
    guardarCatalogo,
    obtenerVolumen,
    descontarStockTomo,
    obtenerPapelera,
    agregarManga,
    eliminarManga,
    restaurarManga,
    agregarTomo,
    eliminarTomo,
    cambiarPrecioYStockTomo,
} from "./catalogoMangas";
import { baseDatosMangas } from "../data/mangas";

const primero = baseDatosMangas[0];
const tituloOriginal = primero.titulo;
const buscarManga = id => obtenerCatalogoCompleto().find(m => m.id === id);

const mangaNuevo = {
    titulo: "Manga de prueba",
    genero: "shonen",
    sinopsis: "Una sinopsis de prueba.",
    imgPortada: "/Imagenes/Mangas/prueba.jpg",
    precio: 9990,
    stock: 4,
};

describe("catálogo de mangas", () => {
    it("la primera vez copia los mangas sin tocar los datos originales", () => {
        const catalogo = obtenerCatalogoCompleto();
        expect(catalogo).toHaveLength(baseDatosMangas.length);

        catalogo[0].titulo = "TÍTULO CAMBIADO";
        expect(baseDatosMangas[0].titulo).toBe(tituloOriginal);
    });

    it("guardarCatalogo deja los cambios guardados en localStorage", () => {
        const catalogo = obtenerCatalogoCompleto();
        catalogo[0].vistas = 1;
        guardarCatalogo(catalogo);

        expect(obtenerCatalogoCompleto()[0].vistas).toBe(1);
    });

    it("obtenerVolumen encuentra un tomo y devuelve null si no existe", () => {
        expect(obtenerVolumen(primero.id, 1)).toEqual(primero.volumenes[0]);
        expect(obtenerVolumen(primero.id, 999)).toBeNull();
        expect(obtenerVolumen(999, 1)).toBeNull();
    });

    it("descontarStockTomo resta lo comprado y nunca baja de cero", () => {
        const stockInicial = primero.volumenes[0].stock;

        descontarStockTomo(primero.id, 1, 1);
        expect(obtenerVolumen(primero.id, 1).stock).toBe(stockInicial - 1);

        descontarStockTomo(primero.id, 1, 9999);
        expect(obtenerVolumen(primero.id, 1).stock).toBe(0);
    });
});

describe("administración de mangas", () => {
    it("agrega un manga nuevo con su tomo 1", () => {
        const creado = agregarManga(mangaNuevo);

        expect(buscarManga(creado.id).titulo).toBe("Manga de prueba");
        expect(creado.vistas).toBe(0);
        expect(creado.volumenes).toEqual([
            { tomo: 1, precio: 9990, stock: 4, img: mangaNuevo.imgPortada },
        ]);
    });

    it("el id nuevo no choca con un manga que está en la papelera", () => {
        const ultimoId = Math.max(...baseDatosMangas.map(m => m.id));
        eliminarManga(ultimoId);

        const creado = agregarManga(mangaNuevo);
        expect(creado.id).toBe(ultimoId + 1);
    });

    it("eliminar manda el manga a la papelera y restaurar lo devuelve", () => {
        eliminarManga(primero.id);
        expect(buscarManga(primero.id)).toBeUndefined();
        expect(obtenerPapelera().map(m => m.id)).toContain(primero.id);

        restaurarManga(primero.id);
        expect(buscarManga(primero.id)).toBeDefined();
        expect(obtenerPapelera()).toHaveLength(0);
    });

    it("eliminar o restaurar un id que no existe no cambia nada", () => {
        eliminarManga(999);
        restaurarManga(999);

        expect(obtenerCatalogoCompleto()).toHaveLength(baseDatosMangas.length);
        expect(obtenerPapelera()).toHaveLength(0);
    });
});

describe("administración de tomos", () => {
    it("agrega un tomo con el número siguiente al último", () => {
        const ultimoTomo = Math.max(...primero.volumenes.map(v => v.tomo));
        agregarTomo(primero.id, { precio: 15990, stock: 6, img: "/Imagenes/Mangas/nuevo.jpg" });

        expect(buscarManga(primero.id).volumenes.at(-1)).toEqual({
            tomo: ultimoTomo + 1,
            precio: 15990,
            stock: 6,
            img: "/Imagenes/Mangas/nuevo.jpg",
        });
    });

    it("elimina solo el tomo indicado", () => {
        eliminarTomo(primero.id, 1);

        const numeros = buscarManga(primero.id).volumenes.map(v => v.tomo);
        expect(numeros).not.toContain(1);
        expect(numeros).toHaveLength(primero.volumenes.length - 1);
    });

    it("cambia el precio y el stock de un tomo", () => {
        cambiarPrecioYStockTomo(primero.id, 2, 12990, 10);

        expect(obtenerVolumen(primero.id, 2)).toMatchObject({ precio: 12990, stock: 10 });
    });

    it("ignora mangas o tomos que no existen sin modificar el catálogo", () => {
        agregarTomo(999, { precio: 1, stock: 1, img: "/x.jpg" });
        eliminarTomo(999, 1);
        cambiarPrecioYStockTomo(999, 1, 1, 1);
        cambiarPrecioYStockTomo(primero.id, 999, 1, 1);
        descontarStockTomo(999, 1, 1);

        expect(obtenerCatalogoCompleto()).toEqual(baseDatosMangas);
    });
});