import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import CarritoProvider from "./context/CarritoProvider";
import { guardarSesion, obtenerSesion, obtenerTodosUsuarios } from "./utils/usuarios";
import { categoriasInicio, preventas } from "./data/inicio";

function renderApp(ruta = "/") {
    window.history.pushState({}, "", ruta);
    return render(
        <CarritoProvider>
            <App />
        </CarritoProvider>
    );
}

function iniciarSesionComo(correo) {
    guardarSesion(obtenerTodosUsuarios().find(u => u.correo === correo));
}

async function ingresar(user, correo, contrasenia) {
    await user.type(screen.getByPlaceholderText("ingrese su correo"), correo);
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
        const user = userEvent.setup();
        renderApp("/");

        const verMas = screen.getAllByRole("link", { name: "Ver mas" });
        await user.click(verMas.find(enlace => enlace.getAttribute("href") === "/figuras"));

        expect(await screen.findByRole("heading", { level: 1, name: "Figuras" })).toBeInTheDocument();
        expect(window.location.pathname).toBe("/figuras");
    });

    it("los enlaces del footer cambian de página", async () => {
        const user = userEvent.setup();
        renderApp("/");

        await user.click(within(screen.getByRole("contentinfo")).getByRole("link", { name: "Tecnologia" }));

        expect(window.location.pathname).toBe("/tecnologia");
    });

    it.each(["/merchandaising", "/tecnologia", "/preventas"])("la página %s muestra la navbar y el footer", (ruta) => {
        renderApp(ruta);

        expect(screen.getByRole("link", { name: "Inicio sesion" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Animate Ltda" })).toBeInTheDocument();
    });

    it("el buscador del inicio envía el texto escrito en la dirección", async () => {
        const user = userEvent.setup();
        renderApp("/");

        await user.type(screen.getByRole("searchbox", { name: "Buscar" }), "lucia{Enter}");

        expect(window.location.pathname).toBe("/buscar");
        expect(window.location.search).toBe("?q=lucia");
    });

    it("con sesión de administrador la navbar muestra su perfil y el panel", () => {
        iniciarSesionComo("ana@email.com");
        renderApp("/");

        expect(screen.getByRole("link", { name: "Perfil del usuario" })).toHaveAttribute("href", "/perfil-admin");
        expect(screen.getByRole("link", { name: "Panel Admin" })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Inicio sesion" })).not.toBeInTheDocument();
    });
});

describe("inicio de sesión", () => {
    it("pide completar los campos vacíos", async () => {
        const user = userEvent.setup();
        renderApp("/login");

        await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

        expect(screen.getByText("Complete correo y contraseña")).toBeInTheDocument();
    });

    it("rechaza una contraseña incorrecta y no guarda la sesión", async () => {
        const user = userEvent.setup();
        renderApp("/login");

        await ingresar(user, "ana@email.com", "incorrecta");

        expect(screen.getByText("Correo o contraseña incorrectos")).toBeInTheDocument();
        expect(obtenerSesion()).toBeNull();
    });

    it("un cliente entra y vuelve al inicio con su sesión iniciada", async () => {
        const user = userEvent.setup();
        renderApp("/login");

        await ingresar(user, "carlos@email.com", "Carlos#Laraña1");

        expect(await screen.findByRole("heading", { name: "Productos disponibles en la tienda" })).toBeInTheDocument();
        expect(obtenerSesion().rol).toBe("Usuario");
        expect(screen.getByRole("link", { name: "Perfil del usuario" })).toHaveAttribute("href", "/perfil");
    });

    it("un administrador entra directo al panel", async () => {
        const user = userEvent.setup();
        renderApp("/login");

        await ingresar(user, "ana@email.com", "AdminAnimate#1");

        expect(await screen.findByRole("heading", { name: "Panel de Administracion" })).toBeInTheDocument();
        expect(window.location.pathname).toBe("/admin");
    });

    it("el enlace No tengo cuenta lleva al registro", async () => {
        const user = userEvent.setup();
        renderApp("/login");

        await user.click(screen.getByRole("link", { name: "No tengo cuenta" }));

        expect(await screen.findByRole("heading", { name: "Registro" })).toBeInTheDocument();
    });
});

describe("registro", () => {
    it("muestra los errores de todos los campos vacíos", async () => {
        const user = userEvent.setup();
        renderApp("/registro");

        await user.click(screen.getByRole("button", { name: "Registrarse" }));

        expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
        expect(screen.getByText("El apellido es obligatorio")).toBeInTheDocument();
        expect(screen.getByText("El correo es obligatorio")).toBeInTheDocument();
        expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
    });

    it("registra un usuario nuevo, avisa y luego permite iniciar sesión", async () => {
        const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
        const user = userEvent.setup();
        renderApp("/registro");

        await user.type(screen.getByPlaceholderText("ingrese su nombre"), "María");
        await user.type(screen.getByPlaceholderText("ingrese su apellido"), "Pérez");
        await user.type(screen.getByPlaceholderText("ingrese su correo"), "maria@email.com");
        await user.type(screen.getByPlaceholderText("ingrese su contraseña"), "ClaveSegura#2026");
        await user.click(screen.getByRole("button", { name: "Registrarse" }));

        expect(alerta).toHaveBeenCalledWith("Usuario registrado con éxito");
        expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();

        await ingresar(user, "maria@email.com", "ClaveSegura#2026");
        expect(await screen.findByRole("heading", { name: "Productos disponibles en la tienda" })).toBeInTheDocument();
    });

    it("el enlace Ya tengo cuenta vuelve al inicio de sesión", async () => {
        const user = userEvent.setup();
        renderApp("/registro");

        await user.click(screen.getByRole("link", { name: "Ya tengo cuenta" }));

        expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    });
});