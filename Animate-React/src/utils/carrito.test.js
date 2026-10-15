import { describe, it, expect } from "vitest";
import {
    crearClave,
    agregarItem,
    eliminarItem,
    cambiarCantidadItem,
    calcularTotal,
    contarItems,
} from "./carrito";

const figura = { clave: "figura-1", tipo: "figura", productoId: 1, nombre: "Lucia", precio: 10000, img: "/a.webp" };
const tomo = { clave: "manga-2-1", tipo: "manga", productoId: 2, tomo: 1, nombre: "AYANASHI - Tomo 1", precio: 5000, img: "/b.webp" };

describe("crearClave", () => {
    it.each([
        ["figura", 3, undefined, "figura-3"],
        ["manga", 1, 2, "manga-1-2"],
    ])("crearClave(%s, %s, %s) devuelve %s", (tipo, id, variante, esperado) => {
        expect(crearClave(tipo, id, variante)).toBe(esperado);
    });
});

describe("agregarItem", () => {
    it("agrega un producto nuevo con cantidad 1", () => {
        const { carrito, error } = agregarItem([], figura, 5);

        expect(error).toBeNull();
        expect(carrito).toEqual([{ ...figura, cantidad: 1 }]);
    });

    it("suma una unidad si ya estaba, sin modificar el carrito anterior", () => {
        const inicial = [{ ...figura, cantidad: 1 }];
        const { carrito } = agregarItem(inicial, figura, 5);

        expect(carrito[0].cantidad).toBe(2);
        expect(inicial[0].cantidad).toBe(1);
    });

    it("rechaza un producto sin stock", () => {
        const { carrito, error } = agregarItem([], figura, 0);

        expect(carrito).toEqual([]);
        expect(error).toBe("Este producto no tiene stock disponible.");
    });

    it("rechaza superar el stock disponible", () => {
        const inicial = [{ ...figura, cantidad: 2 }];
        const { carrito, error } = agregarItem(inicial, figura, 2);

        expect(carrito).toBe(inicial);
        expect(error).toBe("No quedan más unidades de este producto.");
    });
});

describe("cambiar cantidades y eliminar", () => {
    const carrito = [{ ...figura, cantidad: 2 }, { ...tomo, cantidad: 1 }];

    it("elimina solo el producto indicado", () => {
        expect(eliminarItem(carrito, "figura-1")).toEqual([{ ...tomo, cantidad: 1 }]);
    });

    it("aumenta y disminuye la cantidad", () => {
        expect(cambiarCantidadItem(carrito, "figura-1", 1, 5).carrito[0].cantidad).toBe(3);
        expect(cambiarCantidadItem(carrito, "figura-1", -1, 5).carrito[0].cantidad).toBe(1);
    });

    it("quita el producto cuando la cantidad llega a cero", () => {
        const resultado = cambiarCantidadItem(carrito, "manga-2-1", -1, 5);
        expect(resultado.carrito).toEqual([{ ...figura, cantidad: 2 }]);
    });

    it("no permite pasar el stock", () => {
        const resultado = cambiarCantidadItem(carrito, "figura-1", 1, 2);
        expect(resultado.carrito).toBe(carrito);
        expect(resultado.error).toBe("No quedan más unidades de este producto.");
    });

    it("no hace nada si la clave no existe", () => {
        const resultado = cambiarCantidadItem(carrito, "no-existe", 1, 5);
        expect(resultado.carrito).toBe(carrito);
        expect(resultado.error).toBeNull();
    });
});

describe("totales", () => {
    it("calcula el total en pesos y cuenta las unidades", () => {
        const carrito = [{ ...figura, cantidad: 2 }, { ...tomo, cantidad: 3 }];

        expect(calcularTotal(carrito)).toBe(35000);
        expect(contarItems(carrito)).toBe(5);
    });

    it("un carrito vacío suma cero", () => {
        expect(calcularTotal([])).toBe(0);
        expect(contarItems([])).toBe(0);
    });
});