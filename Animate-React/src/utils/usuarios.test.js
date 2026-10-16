import { describe, it, expect } from "vitest";
import {
    obtenerTodosUsuarios,
    guardarSesion,
    obtenerSesion,
    obtenerUsuario,
    cerrarSesion,
    validarRegistro,
    registrarUsuario,
    actualizarUsuario,
    buscarUsuario,
} from "./usuarios";

const datosValidos = {
    nombre: "María José",
    apellido: "Pérez",
    correo: "maria@email.com",
    contrasenia: "ClaveSegura#2026",
};

describe("lista de usuarios y sesión", () => {
    it("parte con los dos usuarios de ejemplo y entrega una copia", () => {
        const usuarios = obtenerTodosUsuarios();
        expect(usuarios.map(u => u.correo)).toEqual(["ana@email.com", "carlos@email.com"]);

        usuarios.push({ nombre: "Intruso" });
        expect(obtenerTodosUsuarios()).toHaveLength(2);
    });

    it("guarda la sesión sin la contraseña, la lee y la cierra", () => {
        const ana = obtenerTodosUsuarios()[0];
        guardarSesion(ana);

        expect(obtenerSesion()).toEqual({ nombre: "Ana", apellido: "Gonzales", correo: "ana@email.com", rol: "Admin" });
        expect(obtenerSesion()).not.toHaveProperty("contrasenia");
        expect(obtenerUsuario()).toEqual(obtenerSesion());

        cerrarSesion();
        expect(obtenerSesion()).toBeNull();
        expect(obtenerUsuario()).toBeNull();
    });
});

describe("validarRegistro", () => {
    it("acepta datos correctos, con tildes y espacios", () => {
        expect(validarRegistro(datosValidos, obtenerTodosUsuarios())).toEqual({});
    });

    it("informa los cuatro campos vacíos a la vez", () => {
        const errores = validarRegistro({ nombre: "", apellido: "", correo: "", contrasenia: "" }, []);
        expect(Object.keys(errores)).toEqual(["nombre", "apellido", "correo", "contrasenia"]);
    });

    it("rechaza números en nombre y apellido, y un correo sin formato", () => {
        const errores = validarRegistro({ ...datosValidos, nombre: "Ana1", apellido: "Pérez2", correo: "malo" }, []);

        expect(errores.nombre).toBe("El nombre solo debe contener letras");
        expect(errores.apellido).toBe("El apellido solo debe contener letras");
        expect(errores.correo).toBe("Ingrese un correo válido");
    });

    it.each([
        ["Corta#1", "La contraseña debe tener al menos 12 caracteres"],
        ["sinmayuscula#123", "La contraseña debe tener al menos una mayúscula"],
        ["SinEspecial12345", "La contraseña debe tener al menos un carácter especial (# $ % & *)"],
    ])("rechaza la contraseña %s", (contrasenia, mensaje) => {
        expect(validarRegistro({ ...datosValidos, contrasenia }, []).contrasenia).toBe(mensaje);
    });

    it("detecta datos ya registrados sin importar las mayúsculas", () => {
        const errores = validarRegistro(
            { ...datosValidos, nombre: "ANA", apellido: "gonzales", correo: "Carlos@Email.com" },
            obtenerTodosUsuarios()
        );

        expect(errores).toEqual({
            nombre: "Ese nombre ya está registrado",
            apellido: "Ese apellido ya está registrado",
            correo: "Ese correo ya está registrado",
        });
    });
});

describe("registro, login y edición de perfil", () => {
    it("registra un usuario nuevo con rol Usuario y permite encontrarlo", () => {
        registrarUsuario(datosValidos);

        expect(obtenerTodosUsuarios().at(-1).rol).toBe("Usuario");
        expect(buscarUsuario("MARIA@email.com", "ClaveSegura#2026").nombre).toBe("María José");
    });

    it("no encuentra al usuario con una contraseña incorrecta", () => {
        expect(buscarUsuario("ana@email.com", "incorrecta")).toBeNull();
    });

    it("actualiza los datos del usuario y su sesión", () => {
        actualizarUsuario("carlos@email.com", {
            nombre: "Carlitos",
            apellido: "Calderon",
            correo: "carlitos@email.com",
            contrasenia: "Carlos#Laraña1",
        });

        expect(obtenerSesion()).toMatchObject({ nombre: "Carlitos", correo: "carlitos@email.com" });
        expect(buscarUsuario("carlitos@email.com", "Carlos#Laraña1")).not.toBeNull();
        expect(obtenerTodosUsuarios()).toHaveLength(2);
    });
});