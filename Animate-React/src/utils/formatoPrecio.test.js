import { describe, it, expect } from "vitest";
import { formatearPrecio } from "./formatoPrecio";

describe("formatearPrecio", () => {
    it("agrega el signo peso y los puntos de miles", () => {
        expect(formatearPrecio(127000)).toBe("$127.000");
    });

    it("no agrega puntos a números menores que mil", () => {
        expect(formatearPrecio(990)).toBe("$990");
    });

    it("separa correctamente los millones", () => {
        expect(formatearPrecio(1250000)).toBe("$1.250.000");
    });
});