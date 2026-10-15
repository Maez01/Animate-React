import { describe, it, expect } from "vitest";
import {
    obtenerCatalogoFiguras,
    obtenerPapeleraFiguras,
    obtenerFigura,
    agregarFigura,
    eliminarFigura,
    restaurarFigura,
    cambiarPrecioYStockFigura,
    descontarStockFigura,
    obtenerImagenesGaleria,
    agregarImagenGaleria,
    eliminarImagenGaleria,
} from "./catalogoFiguras";
import { baseDatosFiguras } from "../data/figuras";

const primera = baseDatosFiguras[0];

describe("catálogo de figuras", () => {
    it("la primera vez copia todas las figuras de figuras.js", () => {
        expect(obtenerCatalogoFiguras()).toHaveLength(baseDatosFiguras.length);
    });

    it("agrega una figura nueva con un id que no se repite", () => {
        const nueva = agregarFigura({
            nombre: "Figura de prueba",
            proveniencia: "Pruebas",
            tipoFigura: "Nendoroid",
            precio: 50000,
            stock: 2,
            imgPortada: "/Imagenes/Figuras/prueba.webp",
        });

        const ids = obtenerCatalogoFiguras().map(f => f.id);
        expect(ids).toContain(nueva.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(nueva.vistas).toBe(0);
    });

    it("eliminar manda la figura a la papelera y restaurar la devuelve", () => {
        eliminarFigura(primera.id);
        expect(obtenerFigura(primera.id)).toBeNull();
        expect(obtenerPapeleraFiguras().map(f => f.id)).toContain(primera.id);

        restaurarFigura(primera.id);
        expect(obtenerFigura(primera.id)).not.toBeNull();
        expect(obtenerPapeleraFiguras()).toHaveLength(0);
    });

    it("cambia el precio y el stock de una figura", () => {
        cambiarPrecioYStockFigura(primera.id, 99990, 7);

        const figura = obtenerFigura(primera.id);
        expect(figura.precio).toBe(99990);
        expect(figura.stock).toBe(7);
    });

    it("descontar stock nunca deja un número negativo", () => {
        descontarStockFigura(primera.id, 9999);
        expect(obtenerFigura(primera.id).stock).toBe(0);
    });
});

describe("galería de figuras", () => {
    it("pone la portada primero y no la repite", () => {
        const figura = { imgPortada: "a.webp", galeria: ["a.webp", "b.webp"] };
        expect(obtenerImagenesGaleria(figura)).toEqual(["a.webp", "b.webp"]);
    });

    it("una figura sin galería muestra solo su portada", () => {
        expect(obtenerImagenesGaleria({ imgPortada: "a.webp" })).toEqual(["a.webp"]);
    });

    it("agrega y quita imágenes extra, pero nunca la portada", () => {
        agregarImagenGaleria(primera.id, "/Imagenes/Figuras/nueva.webp");
        expect(obtenerImagenesGaleria(obtenerFigura(primera.id))).toContain("/Imagenes/Figuras/nueva.webp");

        eliminarImagenGaleria(primera.id, primera.imgPortada);
        expect(obtenerImagenesGaleria(obtenerFigura(primera.id))[0]).toBe(primera.imgPortada);

        eliminarImagenGaleria(primera.id, "/Imagenes/Figuras/nueva.webp");
        expect(obtenerImagenesGaleria(obtenerFigura(primera.id))).not.toContain("/Imagenes/Figuras/nueva.webp");
    });
});