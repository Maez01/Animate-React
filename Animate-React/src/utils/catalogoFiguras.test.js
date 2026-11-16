import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../services/api";
import {
    obtenerCatalogoFiguras,
    obtenerPapeleraFiguras,
    agregarFigura,
    editarFigura,
    eliminarFigura,
    restaurarFigura,
    cambiarPrecioYStockFigura,
    obtenerImagenesGaleria,
    agregarImagenGaleria,
    eliminarImagenGaleria,
} from "./catalogoFiguras";

// La conexión con el backend se reemplaza por una función simulada
vi.mock("../services/api", () => ({ api: vi.fn() }));

const datosFigura = {
    nombre: "Lucia Crimson Abyss",
    proveniencia: "Punishing Gray Raven",
    tipoFigura: "Figura a escala",
    precio: 127000,
    stock: 2,
    imgPortada: "/Imagenes/Figuras/lucia.webp",
};

beforeEach(() => {
    api.mockReset();
    api.mockResolvedValue({});
});

describe("lectura del catálogo de figuras", () => {
    it("obtenerCatalogoFiguras pide las figuras activas al backend", async () => {
        api.mockResolvedValue([{ id: 1, ...datosFigura }]);

        expect(await obtenerCatalogoFiguras()).toHaveLength(1);
        expect(api).toHaveBeenCalledWith("/figuras");
    });

    it("obtenerPapeleraFiguras pide las figuras eliminadas", async () => {
        await obtenerPapeleraFiguras();

        expect(api).toHaveBeenCalledWith("/figuras/papelera");
    });
});

describe("administración de figuras", () => {
    it("agregarFigura envía todos los datos", async () => {
        await agregarFigura(datosFigura);

        expect(api).toHaveBeenCalledWith("/figuras", { metodo: "POST", cuerpo: datosFigura });
    });

    it("editarFigura envía la figura completa con PUT", async () => {
        await editarFigura(3, datosFigura);

        expect(api).toHaveBeenCalledWith("/figuras/3", { metodo: "PUT", cuerpo: datosFigura });
    });

    it("cambiarPrecioYStockFigura envía solo precio y stock", async () => {
        await cambiarPrecioYStockFigura(3, 99000, 0);

        expect(api).toHaveBeenCalledWith("/figuras/3/precio-stock", { metodo: "PUT", cuerpo: { precio: 99000, stock: 0 } });
    });

    it("eliminarFigura la manda a la papelera y restaurarFigura la devuelve", async () => {
        await eliminarFigura(3);
        await restaurarFigura(3);

        expect(api).toHaveBeenNthCalledWith(1, "/figuras/3", { metodo: "DELETE" });
        expect(api).toHaveBeenNthCalledWith(2, "/figuras/3/restaurar", { metodo: "PUT" });
    });
});

describe("galería de imágenes", () => {
    it("pone la portada primero y no la repite", () => {
        const figura = { imgPortada: "/a.webp", galeria: ["/b.webp", "/a.webp", "/c.webp"] };

        expect(obtenerImagenesGaleria(figura)).toEqual(["/a.webp", "/b.webp", "/c.webp"]);
    });

    it("sin galería muestra solo la portada", () => {
        expect(obtenerImagenesGaleria({ imgPortada: "/a.webp" })).toEqual(["/a.webp"]);
    });

    it("agregarImagenGaleria envía la ruta de la imagen", async () => {
        await agregarImagenGaleria(3, "/b.webp");

        expect(api).toHaveBeenCalledWith("/figuras/3/galeria", { metodo: "POST", cuerpo: { ruta: "/b.webp" } });
    });

    it("eliminarImagenGaleria codifica la ruta para que no rompa la URL", async () => {
        await eliminarImagenGaleria(3, "/Imagenes/Figuras/foto 1.webp");

        expect(api).toHaveBeenCalledWith(
            "/figuras/3/galeria?ruta=%2FImagenes%2FFiguras%2Ffoto%201.webp",
            { metodo: "DELETE" }
        );
    });
});