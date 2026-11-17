import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../services/api";
import {
    validarTarjeta,
    resumirTarjeta,
    textoTarjeta,
    obtenerTarjetas,
    obtenerSeleccionada,
    agregarTarjeta,
    eliminarTarjeta,
    seleccionarTarjeta,
} from "./tarjetas";

// La conexión con el backend se reemplaza por una función simulada
vi.mock("../services/api", () => ({ api: vi.fn() }));

beforeEach(() => {
    api.mockReset();
    api.mockResolvedValue({});
});
const tarjeta = (id) => ({ id, ultimos4: String(id).padStart(4, "0"), propietario: "Ana" });

describe("validar y resumir tarjetas", () => {
    it("acepta una tarjeta válida aunque el número tenga espacios", () => {
        expect(validarTarjeta({ numero: "1234 5678 9012 3456", clave: "123", propietario: "Ana Gonzales" })).toEqual({});
    });

    it("informa número, clave y propietario incorrectos", () => {
        const errores = validarTarjeta({ numero: "1234", clave: "12a", propietario: "   " });

        expect(errores).toEqual({
            numero: "El número debe tener 16 dígitos",
            clave: "La clave debe tener 3 dígitos",
            propietario: "El propietario es obligatorio",
        });
    });

    it("rechaza un propietario con números", () => {
        const errores = validarTarjeta({ numero: "1234567890123456", clave: "123", propietario: "Ana123" });
        expect(errores.propietario).toBe("El propietario solo debe contener letras");
    });

    it("guarda solo los últimos 4 dígitos, nunca el número completo ni la clave", () => {
        vi.spyOn(Date, "now").mockReturnValue(42);

        const resumen = resumirTarjeta({ numero: "1234 5678 9012 3456", clave: "123", propietario: "  Ana  " });

        expect(resumen).toEqual({ id: 42, ultimos4: "3456", propietario: "Ana" });
        expect(resumen).not.toHaveProperty("numero");
        expect(resumen).not.toHaveProperty("clave");
    });

    it("muestra la tarjeta oculta con su propietario", () => {
        expect(textoTarjeta({ ultimos4: "3456", propietario: "Ana" })).toBe("**** **** **** 3456 (Ana)");
    });
});

describe("tarjetas del usuario con sesión (backend)", () => {
    it("obtenerTarjetas pide la lista al backend", async () => {
        api.mockResolvedValue([tarjeta(1), tarjeta(2)]);

        expect(await obtenerTarjetas()).toHaveLength(2);
        expect(api).toHaveBeenCalledWith("/tarjetas");
    });

    it("obtenerSeleccionada devuelve la tarjeta marcada por el backend", async () => {
        api.mockResolvedValue([tarjeta(1), { ...tarjeta(2), seleccionada: true }]);

        expect((await obtenerSeleccionada()).id).toBe(2);
    });

    it("obtenerSeleccionada devuelve null si ninguna está seleccionada", async () => {
        api.mockResolvedValue([tarjeta(1)]);

        expect(await obtenerSeleccionada()).toBeNull();
    });

    it("agregarTarjeta envía los datos sin espacios sobrantes", async () => {
        await agregarTarjeta({ numero: " 1234 5678 9012 3456 ", clave: "123", propietario: "  Ana  " });

        expect(api).toHaveBeenCalledWith("/tarjetas", {
            metodo: "POST",
            cuerpo: { numero: "1234 5678 9012 3456", clave: "123", propietario: "Ana" },
        });
    });

    it("eliminarTarjeta y seleccionarTarjeta usan el id en la ruta", async () => {
        await eliminarTarjeta(5);
        await seleccionarTarjeta(7);

        expect(api).toHaveBeenNthCalledWith(1, "/tarjetas/5", { metodo: "DELETE" });
        expect(api).toHaveBeenNthCalledWith(2, "/tarjetas/7/seleccionar", { metodo: "PUT" });
    });
});