import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, iniciarSesion } from "../services/api";
import {
    soloLetras,
    formatoCorreo,
    validarRegistro,
    registrarUsuario,
    confirmarContrasenia,
    editarMiPerfil,
} from "./usuarios";

// La conexión con el backend se reemplaza por funciones simuladas
vi.mock("../services/api", () => ({ api: vi.fn(), iniciarSesion: vi.fn() }));

const datosValidos = {
    nombre: "María José",
    apellido: "Pérez",
    correo: "maria@email.com",
    contrasenia: "ClaveSegura#2026",
};

beforeEach(() => {
    api.mockReset();
    api.mockResolvedValue({});
    iniciarSesion.mockReset();
    iniciarSesion.mockResolvedValue({});
});

describe("expresiones de validación", () => {
    it("soloLetras acepta tildes, ñ y espacios, pero no números", () => {
        expect(soloLetras.test("María Peña")).toBe(true);
        expect(soloLetras.test("Ana1")).toBe(false);
    });

    it("formatoCorreo exige usuario, @ y dominio", () => {
        expect(formatoCorreo.test("ana@email.com")).toBe(true);
        expect(formatoCorreo.test("ana@email")).toBe(false);
        expect(formatoCorreo.test("ana email.com")).toBe(false);
    });
});

describe("validarRegistro", () => {
    it("acepta datos correctos, con tildes y espacios", () => {
        expect(validarRegistro(datosValidos)).toEqual({});
    });

    it("informa los cuatro campos vacíos a la vez", () => {
        const errores = validarRegistro({ nombre: "", apellido: "", correo: "", contrasenia: "" });
        expect(Object.keys(errores)).toEqual(["nombre", "apellido", "correo", "contrasenia"]);
    });

    it("rechaza números en nombre y apellido, y un correo sin formato", () => {
        const errores = validarRegistro({ ...datosValidos, nombre: "Ana1", apellido: "Pérez2", correo: "malo" });

        expect(errores.nombre).toBe("El nombre solo debe contener letras");
        expect(errores.apellido).toBe("El apellido solo debe contener letras");
        expect(errores.correo).toBe("Ingrese un correo válido");
    });

    it.each([
        ["Corta#1", "La contraseña debe tener al menos 12 caracteres"],
        ["sinmayuscula#123", "La contraseña debe tener al menos una mayúscula"],
        ["SinEspecial12345", "La contraseña debe tener al menos un carácter especial (# $ % & *)"],
    ])("rechaza la contraseña %s", (contrasenia, mensaje) => {
        expect(validarRegistro({ ...datosValidos, contrasenia }).contrasenia).toBe(mensaje);
    });
});

describe("registro y perfil con el backend", () => {
    it("registrarUsuario envía los datos a /auth/registro", async () => {
        api.mockResolvedValue({ id: 3, ...datosValidos, rol: "USUARIO" });

        const creado = await registrarUsuario(datosValidos);

        expect(api).toHaveBeenCalledWith("/auth/registro", { metodo: "POST", cuerpo: datosValidos });
        expect(creado.rol).toBe("USUARIO");
    });

    it("si el correo ya existe, el error del backend llega al formulario", async () => {
        api.mockRejectedValue(Object.assign(new Error("Ese correo ya está registrado"), { status: 409 }));

        await expect(registrarUsuario(datosValidos)).rejects.toMatchObject({ status: 409 });
    });

    it("confirmarContrasenia comprueba la contraseña con el mismo login del backend", async () => {
        await confirmarContrasenia("ana@email.com", "AdminAnimate#1");

        expect(iniciarSesion).toHaveBeenCalledWith("ana@email.com", "AdminAnimate#1");
    });

    it("confirmarContrasenia falla si la contraseña es incorrecta", async () => {
        iniciarSesion.mockRejectedValue(Object.assign(new Error("Correo o contraseña incorrectos."), { status: 401 }));

        await expect(confirmarContrasenia("ana@email.com", "incorrecta")).rejects.toMatchObject({ status: 401 });
    });

    it("editarMiPerfil envía los cambios a /usuarios/me", async () => {
        const cambios = {
            nombre: "Carlitos",
            apellido: "Calderon",
            correo: "carlitos@email.com",
            contraseniaActual: "Carlos#Laraña1",
            contraseniaNueva: null,
        };

        await editarMiPerfil(cambios);

        expect(api).toHaveBeenCalledWith("/usuarios/me", { metodo: "PUT", cuerpo: cambios });
    });
});