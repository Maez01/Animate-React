import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import AuthProvider from "./context/AuthProvider";
import CarritoProvider from "./context/CarritoProvider";
import { cerrarSesionApi } from "./services/api";
import { categoriasInicio, preventas } from "./data/inicio";

const URL_API = "http://localhost:8080/api";
const ana = { id: 1, nombre: "Ana", apellido: "Gonzales", correo: "ana@email.com", rol: "ADMIN" };
const carlos = { id: 2, nombre: "Carlos", apellido: "Calderon", correo: "carlos@email.com", rol: "USUARIO" };

// ---------- "Backend" falso que responde a fetch según la ruta ----------
let cuentas;            // usuarios registrados: correo -> { clave, usuario }
let sesionEnCookie;     // simula la cookie HttpOnly de renovación (null = sin sesión)
let servidorApagado;

function respuesta(status, cuerpo) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (cuerpo === undefined ? "" : JSON.stringify(cuerpo)),
    };
}

const sesion = usuario => ({ accessToken: `token-${usuario.id}`, expiresIn: 900, usuario });

async function backendFalso(url, opciones = {}) {
    if (servidorApagado) throw new TypeError("Failed to fetch");
    const ruta = url.replace(URL_API, "");
    const cuerpo = opciones.body ? JSON.parse(opciones.body) : null;

    if (ruta === "/auth/refresh") {
        return sesionEnCookie ? respuesta(200, sesion(sesionEnCookie)) : respuesta(401, { mensaje: "No existe una sesión activa." });
    }
    if (ruta === "/auth/login") {
        const cuenta = cuentas[cuerpo.correo.toLowerCase()];
        if (!cuenta || cuenta.clave !== cuerpo.contrasenia) {
            return respuesta(401, { mensaje: "Correo o contraseña incorrectos." });
        }
        sesionEnCookie = cuenta.usuario;
        return respuesta(200, sesion(cuenta.usuario));
    }
    if (ruta === "/auth/logout") {
        sesionEnCookie = null;
        return respuesta(204);
    }
    if (ruta === "/auth/registro") {
        const correo = cuerpo.correo.toLowerCase();
        if (cuentas[correo]) return respuesta(409, { mensaje: "Ese correo ya está registrado" });
        const usuario = { id: 3, nombre: cuerpo.nombre, apellido: cuerpo.apellido, correo, rol: "USUARIO" };
        cuentas[correo] = { clave: cuerpo.contrasenia, usuario };
        return respuesta(201, usuario);
    }
    // Catálogos, papeleras, tarjetas, etc.: listas vacías
    return respuesta(200, []);
}

beforeEach(async () => {
    cuentas = {
        "ana@email.com": { clave: "AdminAnimate#1", usuario: ana },
        "carlos@email.com": { clave: "Carlos#Laraña1", usuario: carlos },
    };
    sesionEnCookie = null;
    servidorApagado = false;
    vi.stubGlobal("fetch", vi.fn(backendFalso));
    await cerrarSesionApi(); // api.js recuerda la sesión entre pruebas: se parte siempre sin sesión
});

afterEach(() => {
    vi.unstubAllGlobals();
});

// Igual que main.jsx: AuthProvider > CarritoProvider > App
function renderApp(ruta = "/") {
    window.history.pushState({}, "", ruta);
    render(
        <AuthProvider>
            <CarritoProvider>
                <App />
            </CarritoProvider>
        </AuthProvider>
    );
    return userEvent.setup();
}

async function ingresar(user, correo, contrasenia) {
    await user.type(await screen.findByPlaceholderText("ingrese su correo"), correo);
    await user.type(screen.getByPlaceholderText("ingrese su contraseña"), contrasenia);
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
}

describe("inicio y navegación", () => {
    it("muestra una fila por categoría y la fila de preventas", () => {
        renderApp("/");

        const titulos = screen.getAllByRole("heading", { level: 2 }).map(h => h.textContent);
        expect(titulos).toEqual([...categoriasInicio.map(c => c.titulo), preventas.titulo]);
    });

    it("el botón Ver mas lleva a la página de la categoría", async () => {
        const user = renderApp("/");

        const verMas = screen.getAllByRole("link", { name: "Ver mas" });
        await user.click(verMas.find(enlace => enlace.getAttribute("href") === "/figuras"));

        expect(await screen.findByRole("heading", { level: 1, name: "Figuras" })).toBeInTheDocument();
        expect(window.location.pathname).toBe("/figuras");
    });

    it("los enlaces del footer cambian de página", async () => {
        const user = renderApp("/");

        await user.click(within(screen.getByRole("contentinfo")).getByRole("link", { name: "Tecnologia" }));

        expect(window.location.pathname).toBe("/tecnologia");
    });

    it.each(["/merchandaising", "/tecnologia", "/preventas"])("la página %s muestra la navbar y el footer", async (ruta) => {
        renderApp(ruta);

        expect(await screen.findByRole("link", { name: "Inicio sesion" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Animate Ltda" })).toBeInTheDocument();
    });

    it("el buscador del inicio lleva a Mangas con el texto ya escrito", async () => {
        const user = renderApp("/");

        await user.type(screen.getByRole("searchbox", { name: "Buscar" }), "lucia{Enter}");

        expect(window.location.pathname).toBe("/mangas");
        expect(window.location.search).toBe("?buscar=lucia");
        expect(await screen.findByPlaceholderText("Buscar por título...")).toHaveValue("lucia");
    });

    it("con la cookie de sesión, al recargar (F5) la administradora sigue con su sesión", async () => {
        sesionEnCookie = ana;

        renderApp("/");

        expect(await screen.findByRole("link", { name: "Panel Admin" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Perfil del usuario" })).toHaveAttribute("href", "/perfil-admin");
        expect(screen.queryByRole("link", { name: "Inicio sesion" })).not.toBeInTheDocument();
    });
});

describe("inicio de sesión", () => {
    it("pide completar los campos vacíos", async () => {
        const user = renderApp("/login");

        await user.click(await screen.findByRole("button", { name: "Iniciar sesión" }));

        expect(screen.getByText("Complete correo y contraseña")).toBeInTheDocument();
    });

    it("rechaza una contraseña incorrecta con el mensaje del backend", async () => {
        const user = renderApp("/login");

        await ingresar(user, "ana@email.com", "incorrecta");

        expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument();
        expect(sesionEnCookie).toBeNull();
    });

    it("si el servidor está apagado, avisa que no hay conexión", async () => {
        servidorApagado = true;
        const user = renderApp("/login");

        await ingresar(user, "ana@email.com", "AdminAnimate#1");

        expect(await screen.findByText("No se pudo conectar con el servidor")).toBeInTheDocument();
    });

    it("un cliente entra y vuelve al inicio con su sesión iniciada", async () => {
        const user = renderApp("/login");

        await ingresar(user, "carlos@email.com", "Carlos#Laraña1");

        expect(await screen.findByRole("heading", { name: "Productos disponibles en la tienda" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Perfil del usuario" })).toHaveAttribute("href", "/perfil");
        expect(screen.queryByRole("link", { name: "Panel Admin" })).not.toBeInTheDocument();
    });

    it("un administrador entra directo al panel", async () => {
        const user = renderApp("/login");

        await ingresar(user, "ana@email.com", "AdminAnimate#1");

        expect(await screen.findByRole("heading", { name: "Panel de Administracion" })).toBeInTheDocument();
        expect(window.location.pathname).toBe("/admin");
    });

    it("el enlace No tengo cuenta lleva al registro", async () => {
        const user = renderApp("/login");

        await user.click(await screen.findByRole("link", { name: "No tengo cuenta" }));

        expect(await screen.findByRole("heading", { name: "Registro" })).toBeInTheDocument();
    });
});

describe("registro", () => {
    it("muestra los errores de todos los campos vacíos", async () => {
        const user = renderApp("/registro");

        await user.click(await screen.findByRole("button", { name: "Registrarse" }));

        expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
        expect(screen.getByText("El apellido es obligatorio")).toBeInTheDocument();
        expect(screen.getByText("El correo es obligatorio")).toBeInTheDocument();
        expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
    });

    it("registra un usuario nuevo, avisa y luego permite iniciar sesión", async () => {
        const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
        const user = renderApp("/registro");

        await user.type(await screen.findByPlaceholderText("ingrese su nombre"), "María");
        await user.type(screen.getByPlaceholderText("ingrese su apellido"), "Pérez");
        await user.type(screen.getByPlaceholderText("ingrese su correo"), "maria@email.com");
        await user.type(screen.getByPlaceholderText("ingrese su contraseña"), "ClaveSegura#2026");
        await user.click(screen.getByRole("button", { name: "Registrarse" }));

        expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
        expect(alerta).toHaveBeenCalledWith("Usuario registrado con éxito");

        await ingresar(user, "maria@email.com", "ClaveSegura#2026");
        expect(await screen.findByRole("heading", { name: "Productos disponibles en la tienda" })).toBeInTheDocument();
    });

    it("si el correo ya existe, muestra el error del backend bajo el correo", async () => {
        const user = renderApp("/registro");

        await user.type(await screen.findByPlaceholderText("ingrese su nombre"), "Carlos");
        await user.type(screen.getByPlaceholderText("ingrese su apellido"), "Otro");
        await user.type(screen.getByPlaceholderText("ingrese su correo"), "carlos@email.com");
        await user.type(screen.getByPlaceholderText("ingrese su contraseña"), "ClaveSegura#2026");
        await user.click(screen.getByRole("button", { name: "Registrarse" }));

        expect(await screen.findByText("Ese correo ya está registrado")).toBeInTheDocument();
    });

    it("el enlace Ya tengo cuenta vuelve al inicio de sesión", async () => {
        const user = renderApp("/registro");

        await user.click(await screen.findByRole("link", { name: "Ya tengo cuenta" }));

        expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    });
});

describe("rutas protegidas", () => {
    it("sin sesión, entrar a /perfil manda al login", async () => {
        renderApp("/perfil");

        expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
        expect(window.location.pathname).toBe("/login");
    });

    it("un cliente no puede entrar a /admin y vuelve al inicio", async () => {
        sesionEnCookie = carlos;

        renderApp("/admin");

        expect(await screen.findByRole("heading", { name: "Productos disponibles en la tienda" })).toBeInTheDocument();
        expect(window.location.pathname).toBe("/");
    });
});