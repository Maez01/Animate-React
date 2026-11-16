import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    api,
    iniciarSesion,
    renovarSesion,
    cerrarSesionApi,
    obtenerUsuarioActual,
    suscribirSesion,
} from "./api";

// En las pruebas no existe .env.production, así que api.js usa su dirección por defecto
const URL = "http://localhost:8080/api";

const usuarioAna = { id: 1, nombre: "Ana", apellido: "Gonzales", correo: "ana@email.com", rol: "ADMIN" };
const sesion = (token) => ({ accessToken: token, expiresIn: 900, usuario: usuarioAna });

// Arma una respuesta falsa del servidor, con la misma forma que la de fetch
function respuesta(status, cuerpo) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (cuerpo === undefined ? "" : typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo)),
    };
}

let fetchFalso;

beforeEach(async () => {
    // Se reemplaza fetch del navegador: ninguna prueba sale a internet
    fetchFalso = vi.fn().mockResolvedValue(respuesta(204));
    vi.stubGlobal("fetch", fetchFalso);

    // api.js recuerda la sesión entre pruebas: se cierra para partir siempre sin sesión
    await cerrarSesionApi();
    fetchFalso.mockReset();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("sesión", () => {
    it("iniciarSesion envía las credenciales con la cookie y guarda al usuario", async () => {
        fetchFalso.mockResolvedValueOnce(respuesta(200, sesion("token-1")));

        const usuario = await iniciarSesion("ana@email.com", "AdminAnimate#1");

        expect(usuario).toEqual(usuarioAna);
        expect(obtenerUsuarioActual()).toEqual(usuarioAna);
        expect(fetchFalso).toHaveBeenCalledWith(`${URL}/auth/login`, expect.objectContaining({
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ correo: "ana@email.com", contrasenia: "AdminAnimate#1" }),
        }));
        expect(fetchFalso.mock.calls[0][1].headers["X-Requested-With"]).toBe("Animate");
    });

    it("con credenciales incorrectas muestra el mensaje del backend y no guarda sesión", async () => {
        fetchFalso.mockResolvedValueOnce(respuesta(401, { status: 401, mensaje: "Correo o contraseña incorrectos." }));

        await expect(iniciarSesion("ana@email.com", "mala")).rejects.toMatchObject({
            status: 401,
            message: "Correo o contraseña incorrectos.",
        });
        expect(obtenerUsuarioActual()).toBeNull();
    });

    it("si el servidor está apagado, el login avisa que no hay conexión", async () => {
        fetchFalso.mockRejectedValueOnce(new TypeError("Failed to fetch"));

        await expect(iniciarSesion("ana@email.com", "AdminAnimate#1")).rejects.toMatchObject({
            status: 0,
            message: "No se pudo conectar con el servidor",
        });
    });

    it("dos renovaciones al mismo tiempo usan una sola llamada al backend", async () => {
        fetchFalso.mockResolvedValue(respuesta(200, sesion("token-2")));

        const [a, b] = await Promise.all([renovarSesion(), renovarSesion()]);

        expect(a).toEqual(usuarioAna);
        expect(b).toEqual(usuarioAna);
        expect(fetchFalso).toHaveBeenCalledTimes(1);
    });

    it("cerrarSesionApi borra la sesión aunque el backend no responda", async () => {
        fetchFalso
            .mockResolvedValueOnce(respuesta(200, sesion("token-1")))
            .mockRejectedValueOnce(new TypeError("Failed to fetch"));
        await iniciarSesion("ana@email.com", "AdminAnimate#1");

        await cerrarSesionApi();

        expect(obtenerUsuarioActual()).toBeNull();
    });

    it("avisa a quien escucha los cambios de sesión hasta que deja de escuchar", async () => {
        fetchFalso.mockResolvedValue(respuesta(200, sesion("token-1")));
        const oyente = vi.fn();
        const dejarDeEscuchar = suscribirSesion(oyente);

        await iniciarSesion("ana@email.com", "AdminAnimate#1");
        expect(oyente).toHaveBeenCalledWith(usuarioAna);

        dejarDeEscuchar();
        await cerrarSesionApi();
        expect(oyente).toHaveBeenCalledTimes(1);
    });
});

describe("llamadas a la API", () => {
    it("con sesión agrega el token JWT; un GET no lleva cuerpo", async () => {
        fetchFalso
            .mockResolvedValueOnce(respuesta(200, sesion("token-1")))
            .mockResolvedValueOnce(respuesta(200, [{ id: 1 }]));
        await iniciarSesion("ana@email.com", "AdminAnimate#1");

        const datos = await api("/mangas");

        expect(datos).toEqual([{ id: 1 }]);
        const [ruta, opciones] = fetchFalso.mock.calls[1];
        expect(ruta).toBe(`${URL}/mangas`);
        expect(opciones.method).toBe("GET");
        expect(opciones.body).toBeUndefined();
        expect(opciones.headers.Authorization).toBe("Bearer token-1");
    });

    it("con cuerpo lo envía como JSON junto a las cabeceras extra", async () => {
        fetchFalso.mockResolvedValueOnce(respuesta(201, { id: "abc" }));

        await api("/pedidos/invitado", { metodo: "POST", cuerpo: { items: [] }, cabeceras: { "Idempotency-Key": "k1" } });

        const opciones = fetchFalso.mock.calls[0][1];
        expect(opciones.method).toBe("POST");
        expect(opciones.body).toBe(JSON.stringify({ items: [] }));
        expect(opciones.headers["Content-Type"]).toBe("application/json");
        expect(opciones.headers["Idempotency-Key"]).toBe("k1");
        expect(opciones.headers.Authorization).toBeUndefined();
    });

    it("una respuesta 204 (sin contenido) devuelve null", async () => {
        fetchFalso.mockResolvedValueOnce(respuesta(204));

        expect(await api("/mangas/4", { metodo: "DELETE" })).toBeNull();
    });

    it("una respuesta exitosa que no es JSON devuelve null", async () => {
        fetchFalso.mockResolvedValueOnce(respuesta(200, "esto no es json"));

        expect(await api("/mangas")).toBeNull();
    });

    it("un error del backend trae su mensaje y los errores de cada campo", async () => {
        fetchFalso.mockResolvedValueOnce(respuesta(400, {
            status: 400,
            mensaje: "Datos inválidos",
            campos: { precio: "El precio debe ser mayor a 0" },
        }));

        await expect(api("/figuras", { metodo: "POST", cuerpo: {} })).rejects.toMatchObject({
            status: 400,
            message: "Datos inválidos",
            campos: { precio: "El precio debe ser mayor a 0" },
        });
    });

    it.each([
        [401, "Debes iniciar sesion"],
        [403, "No tienes permisos para realizar esta accion"],
        [404, "Ocurrio un error inesperado"],
        [500, "El servidor no esta disponible"],
    ])("si el backend responde %i sin mensaje, muestra un texto según el código", async (status, mensaje) => {
        fetchFalso.mockResolvedValueOnce(respuesta(status));

        await expect(api("/pedidos")).rejects.toMatchObject({ status, message: mensaje, campos: {} });
    });

    it("si el servidor está apagado, avisa que no hay conexión", async () => {
        fetchFalso.mockRejectedValueOnce(new TypeError("Failed to fetch"));

        await expect(api("/mangas")).rejects.toMatchObject({ status: 0, message: "No se pudo conectar con el servidor" });
    });
});

describe("token vencido", () => {
    it("lo renueva una vez y repite la llamada con el token nuevo", async () => {
        fetchFalso
            .mockResolvedValueOnce(respuesta(200, sesion("token-1")))   // login
            .mockResolvedValueOnce(respuesta(401))                       // token vencido
            .mockResolvedValueOnce(respuesta(200, sesion("token-2")))   // renovación con la cookie
            .mockResolvedValueOnce(respuesta(200, [{ id: 1 }]));         // se repite la llamada
        await iniciarSesion("ana@email.com", "AdminAnimate#1");

        const datos = await api("/pedidos/mios");

        expect(datos).toEqual([{ id: 1 }]);
        expect(fetchFalso.mock.calls[2][0]).toBe(`${URL}/auth/refresh`);
        expect(fetchFalso.mock.calls[3][1].headers.Authorization).toBe("Bearer token-2");
    });

    it("si la renovación también falla, avisa que la sesión expiró y la cierra", async () => {
        fetchFalso
            .mockResolvedValueOnce(respuesta(200, sesion("token-1")))
            .mockResolvedValueOnce(respuesta(401))
            .mockResolvedValueOnce(respuesta(401, { status: 401, mensaje: "La sesión expiró. Inicia sesión nuevamente." }));
        await iniciarSesion("ana@email.com", "AdminAnimate#1");

        await expect(api("/pedidos/mios")).rejects.toMatchObject({ status: 401, message: "Tu sesion expiro" });
        expect(obtenerUsuarioActual()).toBeNull();
    });
});