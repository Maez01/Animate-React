import { describe, it, expect, vi } from "vitest";
import {
    validarTarjeta,
    resumirTarjeta,
    textoTarjeta,
    obtenerTarjetas,
    obtenerSeleccionada,
    agregarTarjeta,
    eliminarTarjeta,
    seleccionarTarjeta,
    cambiarCorreoTarjetas,
} from "./tarjetas";

const correo = "ana@email.com";
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

describe("tarjetas de un usuario", () => {
    it("sin tarjetas no hay ninguna seleccionada", () => {
        expect(obtenerTarjetas(correo)).toEqual([]);
        expect(obtenerSeleccionada(correo)).toBeNull();
    });

    it("la primera tarjeta agregada queda seleccionada, y el correo no distingue mayúsculas", () => {
        agregarTarjeta(correo, tarjeta(1));
        agregarTarjeta("ANA@email.com", tarjeta(2));

        expect(obtenerTarjetas(correo)).toHaveLength(2);
        expect(obtenerSeleccionada(correo).id).toBe(1);
    });

    it("permite elegir otra tarjeta", () => {
        agregarTarjeta(correo, tarjeta(1));
        agregarTarjeta(correo, tarjeta(2));

        seleccionarTarjeta(correo, 2);
        expect(obtenerSeleccionada(correo).id).toBe(2);
    });

    it("al eliminar la seleccionada pasa a la primera que quede, o a ninguna", () => {
        agregarTarjeta(correo, tarjeta(1));
        agregarTarjeta(correo, tarjeta(2));
        seleccionarTarjeta(correo, 2);

        eliminarTarjeta(correo, 2);
        expect(obtenerSeleccionada(correo).id).toBe(1);

        eliminarTarjeta(correo, 1);
        expect(obtenerSeleccionada(correo)).toBeNull();
    });

    it("eliminar una tarjeta que no está seleccionada mantiene la selección", () => {
        agregarTarjeta(correo, tarjeta(1));
        agregarTarjeta(correo, tarjeta(2));

        eliminarTarjeta(correo, 2);
        expect(obtenerSeleccionada(correo).id).toBe(1);
    });

    it("traspasa las tarjetas al cambiar de correo", () => {
        agregarTarjeta(correo, tarjeta(1));

        cambiarCorreoTarjetas(correo, "ana.nueva@email.com");

        expect(obtenerTarjetas(correo)).toHaveLength(0);
        expect(obtenerTarjetas("ana.nueva@email.com")).toHaveLength(1);
    });

    it("no hace nada si el correo es el mismo o si no tenía tarjetas", () => {
        agregarTarjeta(correo, tarjeta(1));

        cambiarCorreoTarjetas(correo, "ANA@EMAIL.COM");
        cambiarCorreoTarjetas("nadie@email.com", "otro@email.com");

        expect(obtenerTarjetas(correo)).toHaveLength(1);
        expect(obtenerTarjetas("otro@email.com")).toHaveLength(0);
    });
});