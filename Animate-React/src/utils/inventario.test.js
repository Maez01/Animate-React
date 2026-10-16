import { describe, it, expect, vi, beforeEach } from "vitest";
import { obtenerStock, descontarStock } from "./inventario";
import { obtenerVolumen, descontarStockTomo } from "./catalogoMangas";
import { obtenerFigura, descontarStockFigura } from "./catalogoFiguras";

vi.mock("./catalogoMangas", () => ({
    obtenerVolumen: vi.fn(),
    descontarStockTomo: vi.fn(),
}));

vi.mock("./catalogoFiguras", () => ({
    obtenerFigura: vi.fn(),
    descontarStockFigura: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("obtenerStock", () => {
    it("pregunta al catálogo de mangas por el tomo", () => {
        obtenerVolumen.mockReturnValue({ tomo: 1, stock: 4 });

        expect(obtenerStock({ tipo: "manga", productoId: 2, tomo: 1 })).toBe(4);
        expect(obtenerVolumen).toHaveBeenCalledWith(2, 1);
    });

    it("pregunta al catálogo de figuras por la figura", () => {
        obtenerFigura.mockReturnValue({ id: 1, stock: 7 });

        expect(obtenerStock({ tipo: "figura", productoId: 1 })).toBe(7);
        expect(obtenerFigura).toHaveBeenCalledWith(1);
    });

    it("devuelve 0 si el producto ya no existe", () => {
        obtenerVolumen.mockReturnValue(null);
        obtenerFigura.mockReturnValue(null);

        expect(obtenerStock({ tipo: "manga", productoId: 99, tomo: 1 })).toBe(0);
        expect(obtenerStock({ tipo: "figura", productoId: 99 })).toBe(0);
    });

    it("devuelve 0 para un tipo de producto desconocido", () => {
        expect(obtenerStock({ tipo: "poster", productoId: 1 })).toBe(0);
    });
});

describe("descontarStock", () => {
    it("descuenta cada producto en su propio catálogo", () => {
        descontarStock([
            { tipo: "manga", productoId: 2, tomo: 1, cantidad: 3 },
            { tipo: "figura", productoId: 1, cantidad: 2 },
            { tipo: "poster", productoId: 9, cantidad: 1 },
        ]);

        expect(descontarStockTomo).toHaveBeenCalledTimes(1);
        expect(descontarStockTomo).toHaveBeenCalledWith(2, 1, 3);
        expect(descontarStockFigura).toHaveBeenCalledTimes(1);
        expect(descontarStockFigura).toHaveBeenCalledWith(1, 2);
    });
});