import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../services/api";
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
} from "./direcciones";

// La conexión con el backend se reemplaza por una función simulada
vi.mock("../services/api", () => ({ api: vi.fn() }));

beforeEach(() => {
    api.mockReset();
    api.mockResolvedValue({});
});
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

describe("direcciones del usuario con sesión (backend)", () => {
    it("obtenerDirecciones pide la lista al backend", async () => {
        api.mockResolvedValue([direccion(1), direccion(2)]);

        expect(await obtenerDirecciones()).toHaveLength(2);
        expect(api).toHaveBeenCalledWith("/direcciones");
    });

    it("obtenerDireccionSeleccionada devuelve la dirección marcada por el backend", async () => {
        api.mockResolvedValue([direccion(1), { ...direccion(2), seleccionada: true }]);

        expect((await obtenerDireccionSeleccionada()).id).toBe(2);
    });

    it("obtenerDireccionSeleccionada devuelve null si ninguna está seleccionada", async () => {
        api.mockResolvedValue([direccion(1)]);

        expect(await obtenerDireccionSeleccionada()).toBeNull();
    });

    it("agregarDireccion envía los datos sin espacios sobrantes", async () => {
        await agregarDireccion({ calle: " Av. Libertad 1234 ", referencia: " Depto 502 ", comuna: " Viña del Mar ", region: "Valparaíso" });

        expect(api).toHaveBeenCalledWith("/direcciones", {
            metodo: "POST",
            cuerpo: { calle: "Av. Libertad 1234", referencia: "Depto 502", comuna: "Viña del Mar", region: "Valparaíso" },
        });
    });

    it("eliminarDireccion y seleccionarDireccion usan el id en la ruta", async () => {
        await eliminarDireccion(5);
        await seleccionarDireccion(7);

        expect(api).toHaveBeenNthCalledWith(1, "/direcciones/5", { metodo: "DELETE" });
        expect(api).toHaveBeenNthCalledWith(2, "/direcciones/7/seleccionar", { metodo: "PUT" });
    });
});