import { describe, it, expect } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PerfilAdmin from "./PerfilAdmin";
import { guardarSesion, obtenerSesion, obtenerTodosUsuarios } from "../utils/usuarios";
import { registrarVenta } from "../utils/ventas";
import { formatearPrecio } from "../utils/formatoPrecio";

const [ana, carlos] = obtenerTodosUsuarios();

function renderPerfilAdmin() {
    return render(
        <MemoryRouter initialEntries={["/perfil-admin"]}>
            <Routes>
                <Route path="/perfil-admin" element={<PerfilAdmin />} />
                <Route path="/perfil" element={<h1>Perfil de cliente</h1>} />
                <Route path="/login" element={<h1>Página de login</h1>} />
            </Routes>
        </MemoryRouter>
    );
}

async function abrirSeccion(user, boton) {
    await user.click(screen.getByRole("button", { name: boton }));
    return screen.findByRole("dialog");
}

describe("acceso al perfil de administrador", () => {
    it("sin sesión manda al login", () => {
        renderPerfilAdmin();
        expect(screen.getByRole("heading", { name: "Página de login" })).toBeInTheDocument();
    });

    it("un cliente es enviado a su perfil normal", () => {
        guardarSesion(carlos);
        renderPerfilAdmin();
        expect(screen.getByRole("heading", { name: "Perfil de cliente" })).toBeInTheDocument();
    });

    it("la administradora ve sus datos y su rol", () => {
        guardarSesion(ana);
        renderPerfilAdmin();

        expect(screen.getByRole("heading", { name: "Perfil de administrador" })).toBeInTheDocument();
        expect(screen.getByText("Nombre: Ana")).toBeInTheDocument();
        expect(screen.getByText("Rol: Admin")).toBeInTheDocument();
    });
});

describe("ventas realizadas", () => {
    it("avisa cuando todavía no hay ventas", async () => {
        guardarSesion(ana);
        const user = userEvent.setup();
        renderPerfilAdmin();

        const ventana = await abrirSeccion(user, "Ver ventas realizadas");

        expect(within(ventana).getByText("Todavía no hay ventas registradas.")).toBeInTheDocument();
    });

    it("muestra todas las ventas de la tienda con su comprador y el total vendido", async () => {
        guardarSesion(ana);
        const producto = { nombre: "Lucia Crimson Abyss", cantidad: 1, precio: 1000 };
        const direccion = { calle: "Av. Libertad 1234", referencia: "", comuna: "Viña del Mar", region: "Valparaíso" };
        registrarVenta([producto], 1000, carlos, { ultimos4: "4242" }, direccion);
        registrarVenta([producto], 2500, null, { ultimos4: "1111" }, direccion);
        const user = userEvent.setup();
        renderPerfilAdmin();

        const ventana = await abrirSeccion(user, "Ver ventas realizadas");

        expect(within(ventana).getByText(`Ventas realizadas: 2 | Total vendido: ${formatearPrecio(3500)}`)).toBeInTheDocument();
        expect(within(ventana).getByText(carlos.correo)).toBeInTheDocument();
        expect(within(ventana).getByText("Invitado")).toBeInTheDocument();
        expect(within(ventana).getAllByText("Lucia Crimson Abyss x1")).toHaveLength(2);
    });
});

describe("editar perfil y cerrar sesión", () => {
    it("rechaza una contraseña incorrecta", async () => {
        guardarSesion(ana);
        const user = userEvent.setup();
        renderPerfilAdmin();
        const ventana = await abrirSeccion(user, "Editar perfil");

        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        expect(within(ventana).getByText("campo vacio, ingresar contraseña")).toBeInTheDocument();

        await user.type(within(ventana).getByPlaceholderText("ingresar contraseña"), "incorrecta");
        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        expect(within(ventana).getByText("Contraseña incorrecta")).toBeInTheDocument();
    });

    it("guarda un nombre nuevo, pero rechaza uno con números", async () => {
        guardarSesion(ana);
        const user = userEvent.setup();
        renderPerfilAdmin();
        const ventana = await abrirSeccion(user, "Editar perfil");

        await user.type(within(ventana).getByPlaceholderText("ingresar contraseña"), ana.contrasenia);
        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        const nombre = ventana.querySelector('[name="nombre"]');

        await user.clear(nombre);
        await user.type(nombre, "Ana2");
        await user.click(within(ventana).getByRole("button", { name: "Guardar cambios" }));
        expect(within(ventana).getByText("El nombre solo debe contener letras")).toBeInTheDocument();

        await user.clear(nombre);
        await user.type(nombre, "Ana María");
        await user.click(within(ventana).getByRole("button", { name: "Guardar cambios" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.getByText("Nombre: Ana María")).toBeInTheDocument();
        expect(obtenerSesion().nombre).toBe("Ana María");
    });

    it("cerrar sesión pide confirmación y vuelve al login", async () => {
        guardarSesion(ana);
        const user = userEvent.setup();
        renderPerfilAdmin();
        const ventana = await abrirSeccion(user, "Cerrar sesión");

        expect(within(ventana).getByText("¿Seguro que quieres cerrar sesión?")).toBeInTheDocument();
        await user.click(within(ventana).getByRole("button", { name: "Cerrar sesión" }));

        expect(await screen.findByRole("heading", { name: "Página de login" })).toBeInTheDocument();
        expect(obtenerSesion()).toBeNull();
    });
});