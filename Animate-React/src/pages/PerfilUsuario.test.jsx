import { describe, it, expect } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Perfil from "./PerfilUsuario";
import { guardarSesion, obtenerSesion, obtenerTodosUsuarios } from "../utils/usuarios";
import { agregarTarjeta, obtenerTarjetas, obtenerSeleccionada } from "../utils/tarjetas";
import { agregarDireccion, obtenerDirecciones, obtenerDireccionSeleccionada } from "../utils/direcciones";
import { registrarVenta, obtenerVentasDe } from "../utils/ventas";
import { formatearPrecio } from "../utils/formatoPrecio";

const [ana, carlos] = obtenerTodosUsuarios();
const direccion = { id: 1, calle: "Av. Libertad 1234", referencia: "", comuna: "Viña del Mar", region: "Valparaíso" };

function renderPerfil() {
    return render(
        <MemoryRouter initialEntries={["/perfil"]}>
            <Routes>
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/perfil-admin" element={<h1>Perfil de administrador</h1>} />
                <Route path="/login" element={<h1>Página de login</h1>} />
            </Routes>
        </MemoryRouter>
    );
}

async function abrirSeccion(user, boton) {
    await user.click(screen.getByRole("button", { name: boton }));
    return screen.findByRole("dialog");
}

describe("acceso al perfil", () => {
    it("sin sesión manda al login", () => {
        renderPerfil();
        expect(screen.getByRole("heading", { name: "Página de login" })).toBeInTheDocument();
    });

    it("un administrador es enviado a su propio perfil", () => {
        guardarSesion(ana);
        renderPerfil();
        expect(screen.getByRole("heading", { name: "Perfil de administrador" })).toBeInTheDocument();
    });

    it("un cliente ve sus datos, y que no tiene tarjetas ni direcciones", () => {
        guardarSesion(carlos);
        renderPerfil();

        expect(screen.getByText("Nombre: Carlos")).toBeInTheDocument();
        expect(screen.getByText(`Correo: ${carlos.correo}`)).toBeInTheDocument();

        const [selectorTarjeta, selectorDireccion] = screen.getAllByRole("combobox");
        expect(selectorTarjeta).toBeDisabled();
        expect(selectorDireccion).toBeDisabled();
        expect(screen.getByRole("option", { name: "Sin tarjetas registradas" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Sin direcciones registradas" })).toBeInTheDocument();
    });
});

describe("editar perfil", () => {
    it("pide la contraseña actual antes de dejar editar", async () => {
        guardarSesion(carlos);
        const user = userEvent.setup();
        renderPerfil();
        const ventana = await abrirSeccion(user, "Editar perfil");

        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        expect(within(ventana).getByText("campo vacio, ingresar contraseña")).toBeInTheDocument();

        await user.type(within(ventana).getByPlaceholderText("ingresar contraseña"), "incorrecta");
        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        expect(within(ventana).getByText("Contraseña incorrecta")).toBeInTheDocument();
    });

    it("muestra errores si los datos nuevos no son válidos", async () => {
        guardarSesion(carlos);
        const user = userEvent.setup();
        renderPerfil();
        const ventana = await abrirSeccion(user, "Editar perfil");

        await user.type(within(ventana).getByPlaceholderText("ingresar contraseña"), carlos.contrasenia);
        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));

        const correo = ventana.querySelector('[name="correo"]');
        await user.clear(correo);
        await user.type(correo, "malo");
        await user.click(within(ventana).getByRole("button", { name: "Guardar cambios" }));

        expect(within(ventana).getByText("Ingrese un correo válido")).toBeInTheDocument();
    });

    it("guarda los cambios y traspasa tarjetas, direcciones y compras al correo nuevo", async () => {
        guardarSesion(carlos);
        agregarTarjeta(carlos.correo, { id: 1, ultimos4: "4242", propietario: "Carlos" });
        agregarDireccion(carlos.correo, direccion);
        registrarVenta([], 1000, carlos, { ultimos4: "4242" }, direccion);
        const user = userEvent.setup();
        renderPerfil();
        const ventana = await abrirSeccion(user, "Editar perfil");

        await user.type(within(ventana).getByPlaceholderText("ingresar contraseña"), carlos.contrasenia);
        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        expect(ventana.querySelector('[name="nombre"]')).toHaveValue("Carlos");

        await user.clear(ventana.querySelector('[name="nombre"]'));
        await user.type(ventana.querySelector('[name="nombre"]'), "Carlitos");
        await user.clear(ventana.querySelector('[name="correo"]'));
        await user.type(ventana.querySelector('[name="correo"]'), "carlitos@email.com");
        await user.click(within(ventana).getByRole("button", { name: "Guardar cambios" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.getByText("Nombre: Carlitos")).toBeInTheDocument();
        expect(obtenerSesion().correo).toBe("carlitos@email.com");
        expect(obtenerTarjetas("carlitos@email.com")).toHaveLength(1);
        expect(obtenerDirecciones("carlitos@email.com")).toHaveLength(1);
        expect(obtenerVentasDe("carlitos@email.com")).toHaveLength(1);
    });
});

describe("historial de compras", () => {
    it("avisa cuando todavía no hay compras", async () => {
        guardarSesion(carlos);
        const user = userEvent.setup();
        renderPerfil();

        const ventana = await abrirSeccion(user, "Ver historial de compras");

        expect(within(ventana).getByText(/Todav[ií]a no ha[sz] realizado compras/)).toBeInTheDocument();
    });

    it("muestra la cantidad de compras, el total gastado y cada compra", async () => {
        guardarSesion(carlos);
        const producto = { nombre: "Lucia Crimson Abyss", cantidad: 2, precio: 1000 };
        registrarVenta([producto], 2000, carlos, { ultimos4: "4242" }, direccion);
        registrarVenta([producto], 3000, carlos, { ultimos4: "4242" }, direccion);
        registrarVenta([producto], 9999, ana, { ultimos4: "1111" }, direccion);
        const user = userEvent.setup();
        renderPerfil();

        const ventana = await abrirSeccion(user, "Ver historial de compras");

        expect(within(ventana).getByText(`Compras realizadas: 2 | Total gastado: ${formatearPrecio(5000)}`)).toBeInTheDocument();
        expect(within(ventana).getAllByRole("row")).toHaveLength(3);
        expect(within(ventana).getAllByText("Av. Libertad 1234, Viña del Mar, Valparaíso")).toHaveLength(2);
    });
});

describe("tarjetas", () => {
    it("registra una tarjeta, la deja seleccionada y permite eliminarla", async () => {
        guardarSesion(carlos);
        const user = userEvent.setup();
        renderPerfil();
        const ventana = await abrirSeccion(user, "Mis tarjetas");

        expect(within(ventana).getByText("No tienes tarjetas registradas.")).toBeInTheDocument();

        await user.type(within(ventana).getByPlaceholderText("1234 5678 9012 3456"), "4242 4242 4242 4242");
        await user.type(within(ventana).getByPlaceholderText("123"), "123");
        await user.type(within(ventana).getByPlaceholderText("Nombre como aparece en la tarjeta"), "Carlos Calderon");
        await user.click(within(ventana).getByRole("button", { name: "Guardar tarjeta" }));

        expect(within(ventana).getByText("**** **** **** 4242 (Carlos Calderon)")).toBeInTheDocument();
        expect(within(ventana).getByText("(seleccionada)")).toBeInTheDocument();

        await user.click(within(ventana).getByRole("button", { name: "Eliminar" }));
        expect(within(ventana).getByText("No tienes tarjetas registradas.")).toBeInTheDocument();
    });

    it("permite elegir con qué tarjeta pagar", async () => {
        guardarSesion(carlos);
        agregarTarjeta(carlos.correo, { id: 1, ultimos4: "1111", propietario: "Carlos" });
        agregarTarjeta(carlos.correo, { id: 2, ultimos4: "2222", propietario: "Carlos" });
        const user = userEvent.setup();
        renderPerfil();

        const [selectorTarjeta] = screen.getAllByRole("combobox");
        await user.selectOptions(selectorTarjeta, "2");

        expect(obtenerSeleccionada(carlos.correo).id).toBe(2);
    });
});

describe("direcciones", () => {
    it("valida, registra una dirección y la deja seleccionada", async () => {
        guardarSesion(carlos);
        const user = userEvent.setup();
        renderPerfil();
        const ventana = await abrirSeccion(user, "Mis direcciones");

        expect(within(ventana).getByText("No tienes direcciones registradas.")).toBeInTheDocument();

        await user.click(within(ventana).getByRole("button", { name: "Guardar dirección" }));
        expect(within(ventana).getByText("La calle es obligatoria")).toBeInTheDocument();

        await user.type(within(ventana).getByPlaceholderText("Ej: Av. Libertad 1234"), "Av. Libertad 1234");
        await user.type(within(ventana).getByPlaceholderText("Ej: Depto 502"), "Depto 502");
        await user.type(within(ventana).getByPlaceholderText("Ej: Viña del Mar"), "Viña del Mar");
        await user.selectOptions(within(ventana).getByRole("combobox"), "Valparaíso");
        await user.click(within(ventana).getByRole("button", { name: "Guardar dirección" }));

        expect(within(ventana).getByText("Av. Libertad 1234, Depto 502, Viña del Mar, Valparaíso")).toBeInTheDocument();
        expect(within(ventana).getByText("(seleccionada)")).toBeInTheDocument();
        expect(obtenerDireccionSeleccionada(carlos.correo).comuna).toBe("Viña del Mar");
    });

    it("elimina una dirección registrada", async () => {
        guardarSesion(carlos);
        agregarDireccion(carlos.correo, direccion);
        const user = userEvent.setup();
        renderPerfil();
        const ventana = await abrirSeccion(user, "Mis direcciones");

        await user.click(within(ventana).getByRole("button", { name: "Eliminar" }));

        expect(within(ventana).getByText("No tienes direcciones registradas.")).toBeInTheDocument();
        expect(obtenerDirecciones(carlos.correo)).toHaveLength(0);
    });

    it("permite elegir a qué dirección enviar", async () => {
        guardarSesion(carlos);
        agregarDireccion(carlos.correo, direccion);
        agregarDireccion(carlos.correo, { ...direccion, id: 2, calle: "Calle Valparaíso 55" });
        const user = userEvent.setup();
        renderPerfil();

        const [, selectorDireccion] = screen.getAllByRole("combobox");
        await user.selectOptions(selectorDireccion, "2");

        expect(obtenerDireccionSeleccionada(carlos.correo).id).toBe(2);
    });
});

describe("cerrar sesión", () => {
    it("Cancelar mantiene la sesión abierta", async () => {
        guardarSesion(carlos);
        const user = userEvent.setup();
        renderPerfil();
        const ventana = await abrirSeccion(user, "Cerrar sesión");

        await user.click(within(ventana).getByRole("button", { name: "Cancelar" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(obtenerSesion()).not.toBeNull();
    });

    it("confirmar cierra la sesión y vuelve al login", async () => {
        guardarSesion(carlos);
        const user = userEvent.setup();
        renderPerfil();
        const ventana = await abrirSeccion(user, "Cerrar sesión");

        await user.click(within(ventana).getByRole("button", { name: "Cerrar sesión" }));

        expect(await screen.findByRole("heading", { name: "Página de login" })).toBeInTheDocument();
        expect(obtenerSesion()).toBeNull();
    });
});