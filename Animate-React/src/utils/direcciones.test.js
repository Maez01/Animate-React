import { describe, it, expect, vi } from "vitest";
import {
    regiones,
    validarDireccion,
    crearDireccion,
    textoDireccion,
    obtenerDirecciones,
    obtenerDireccionSeleccionada,
    agregarDireccion,
    eliminarDireccion,
    seleccionarDireccion,
    cambiarCorreoDirecciones,
} from "./direcciones";

const correo = "ana@email.com";
const direccion = (id) => ({ id, calle: `Calle ${id}`, referencia: "", comuna: "Viña del Mar", region: "Valparaíso" });
const datosValidos = { calle: "Av. Libertad 1234", referencia: "", comuna: "Viña del Mar", region: "Valparaíso" };

describe("validar y crear direcciones", () => {
    it("ofrece las 16 regiones de Chile", () => {
        expect(regiones).toHaveLength(16);
        expect(regiones).toContain("Valparaíso");
    });

    it("acepta una dirección válida, con tildes en la comuna", () => {
        expect(validarDireccion(datosValidos)).toEqual({});
    });

    it("informa los tres campos obligatorios vacíos a la vez", () => {
        expect(validarDireccion({ calle: "  ", referencia: "", comuna: " ", region: "" })).toEqual({
            calle: "La calle es obligatoria",
            comuna: "La comuna es obligatoria",
            region: "Seleccione una región",
        });
    });

    it("exige el número en la calle y solo letras en la comuna", () => {
        const errores = validarDireccion({ ...datosValidos, calle: "Av. Libertad", comuna: "Viña 2" });

        expect(errores.calle).toBe("Incluya el número de la dirección");
        expect(errores.comuna).toBe("La comuna solo debe contener letras");
    });

    it("crea la dirección con un id y sin espacios sobrantes", () => {
        vi.spyOn(Date, "now").mockReturnValue(7);

        const creada = crearDireccion({ calle: "  Av. Libertad 1234 ", referencia: " Depto 502 ", comuna: " Viña del Mar ", region: "Valparaíso" });

        expect(creada).toEqual({ id: 7, calle: "Av. Libertad 1234", referencia: "Depto 502", comuna: "Viña del Mar", region: "Valparaíso" });
    });

    it.each([
        ["con referencia", { calle: "Av. Libertad 1234", referencia: "Depto 502", comuna: "Viña del Mar", region: "Valparaíso" }, "Av. Libertad 1234, Depto 502, Viña del Mar, Valparaíso"],
        ["sin referencia", datosValidos, "Av. Libertad 1234, Viña del Mar, Valparaíso"],
    ])("arma el texto de una dirección %s", (_caso, datos, esperado) => {
        expect(textoDireccion(datos)).toBe(esperado);
    });
});

describe("direcciones de un usuario", () => {
    it("sin direcciones no hay ninguna seleccionada", () => {
        expect(obtenerDirecciones(correo)).toEqual([]);
        expect(obtenerDireccionSeleccionada(correo)).toBeNull();
    });

    it("la primera dirección queda seleccionada, y el correo no distingue mayúsculas", () => {
        agregarDireccion(correo, direccion(1));
        agregarDireccion("ANA@email.com", direccion(2));

        expect(obtenerDirecciones(correo)).toHaveLength(2);
        expect(obtenerDireccionSeleccionada(correo).id).toBe(1);
    });

    it("permite elegir otra dirección", () => {
        agregarDireccion(correo, direccion(1));
        agregarDireccion(correo, direccion(2));

        seleccionarDireccion(correo, 2);
        expect(obtenerDireccionSeleccionada(correo).id).toBe(2);
    });

    it("al eliminar la seleccionada pasa a la primera que quede, o a ninguna", () => {
        agregarDireccion(correo, direccion(1));
        agregarDireccion(correo, direccion(2));
        seleccionarDireccion(correo, 2);

        eliminarDireccion(correo, 2);
        expect(obtenerDireccionSeleccionada(correo).id).toBe(1);

        eliminarDireccion(correo, 1);
        expect(obtenerDireccionSeleccionada(correo)).toBeNull();
    });

    it("eliminar una dirección que no está seleccionada mantiene la selección", () => {
        agregarDireccion(correo, direccion(1));
        agregarDireccion(correo, direccion(2));

        eliminarDireccion(correo, 2);
        expect(obtenerDireccionSeleccionada(correo).id).toBe(1);
    });

    it("traspasa las direcciones al cambiar de correo", () => {
        agregarDireccion(correo, direccion(1));

        cambiarCorreoDirecciones(correo, "ana.nueva@email.com");

        expect(obtenerDirecciones(correo)).toHaveLength(0);
        expect(obtenerDirecciones("ana.nueva@email.com")).toHaveLength(1);
    });

    it("no hace nada si el correo es el mismo o si no tenía direcciones", () => {
        agregarDireccion(correo, direccion(1));

        cambiarCorreoDirecciones(correo, "ANA@EMAIL.COM");
        cambiarCorreoDirecciones("nadie@email.com", "otro@email.com");

        expect(obtenerDirecciones(correo)).toHaveLength(1);
        expect(obtenerDirecciones("otro@email.com")).toHaveLength(0);
    });
});