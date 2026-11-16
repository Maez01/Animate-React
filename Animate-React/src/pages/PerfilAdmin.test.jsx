import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PerfilAdmin from "./PerfilAdmin";
import RutaProtegida from "../components/RutaProtegida";
import { AuthContext } from "../context/authContext";
import { obtenerVentas, cambiarEstadoPedido } from "../utils/ventas";
import { confirmarContrasenia, editarMiPerfil } from "../utils/usuarios";
import { formatearPrecio } from "../utils/formatoPrecio";

// Se simulan solo las funciones que llaman al backend
vi.mock("../utils/ventas", async importOriginal => ({
    ...(await importOriginal()),
    obtenerVentas: vi.fn(),
    cambiarEstadoPedido: vi.fn(),
}));
vi.mock("../utils/usuarios", async importOriginal => ({
    ...(await importOriginal()),
    confirmarContrasenia: vi.fn(),
    editarMiPerfil: vi.fn(),
}));

const CLAVE_ANA = "AdminAnimate#1";
const ana = { id: 1, nombre: "Ana", apellido: "Gonzales", correo: "ana@email.com", rol: "ADMIN" };
const carlos = { id: 2, nombre: "Carlos", apellido: "Calderon", correo: "carlos@email.com", rol: "USUARIO" };

const VENTAS = [
    { id: "p1", fecha: "2026-11-15T10:00:00Z", comprador: "carlos@email.com", estado: "CONFIRMADO", total: 1000,
        productos: [{ nombre: "Bocchi - Tomo 1", cantidad: 1 }] },
    { id: "p2", fecha: "2026-11-15T11:00:00Z", comprador: "Invitado", estado: "RECHAZADO", total: 2500,
        productos: [{ nombre: "Lucia", cantidad: 1 }] },
    { id: "p3", fecha: "2026-11-15T12:00:00Z", comprador: "Invitado", estado: "ENVIADO", total: 500,
        productos: [{ nombre: "Rem", cantidad: 1 }] },
];

const errorCon = (status, mensaje) => Object.assign(new Error(mensaje), { status });

beforeEach(() => {
    vi.clearAllMocks();
    obtenerVentas.mockResolvedValue([]);
    confirmarContrasenia.mockImplementation(async (correo, contrasenia) => {
        if (contrasenia !== CLAVE_ANA) throw errorCon(401, "Correo o contraseña incorrectos.");
    });
    editarMiPerfil.mockResolvedValue({});
});

// Muestra /perfil-admin protegido igual que en App.jsx, con la sesión que se indique
function renderPerfilAdmin(usuario = ana) {
    const sesion = {
        usuario,
        cargando: false,
        esAdmin: usuario?.rol === "ADMIN",
        login: vi.fn(),
        logout: vi.fn().mockResolvedValue(),
        refrescarSesion: vi.fn().mockResolvedValue(usuario),
    };
    render(
        <AuthContext.Provider value={sesion}>
            <MemoryRouter initialEntries={["/perfil-admin"]}>
                <Routes>
                    <Route path="/perfil-admin" element={<RutaProtegida soloAdmin><PerfilAdmin /></RutaProtegida>} />
                    <Route path="/login" element={<h1>Página de login</h1>} />
                    <Route path="/" element={<h1>Página de inicio</h1>} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
    return { user: userEvent.setup(), sesion };
}

async function abrirSeccion(user, boton) {
    await user.click(screen.getByRole("button", { name: boton }));
    return screen.findByRole("dialog");
}

const filaDe = (ventana, texto) => within(within(ventana).getByText(texto).closest("tr"));

describe("acceso al perfil de administrador", () => {
    it("sin sesión manda al login", () => {
        renderPerfilAdmin(null);

        expect(screen.getByRole("heading", { name: "Página de login" })).toBeInTheDocument();
    });

    it("un cliente con rol USUARIO no puede entrar y vuelve al inicio", () => {
        renderPerfilAdmin(carlos);

        expect(screen.getByRole("heading", { name: "Página de inicio" })).toBeInTheDocument();
    });

    it("la administradora ve sus datos y su rol", () => {
        renderPerfilAdmin();

        expect(screen.getByRole("heading", { name: "Perfil de administrador" })).toBeInTheDocument();
        expect(screen.getByText("Nombre: Ana")).toBeInTheDocument();
        expect(screen.getByText("Rol: ADMIN")).toBeInTheDocument();
    });
});

describe("ventas realizadas", () => {
    it("avisa cuando todavía no hay ventas", async () => {
        const { user } = renderPerfilAdmin();

        const ventana = await abrirSeccion(user, "Ver ventas realizadas");

        expect(within(ventana).getByText("Todavía no hay ventas registradas.")).toBeInTheDocument();
    });

    it("si el backend falla, muestra el error en vez de la tabla", async () => {
        obtenerVentas.mockRejectedValueOnce(errorCon(403, "No tienes permisos para esta acción."));
        const { user } = renderPerfilAdmin();

        const ventana = await abrirSeccion(user, "Ver ventas realizadas");

        expect(await within(ventana).findByText("No tienes permisos para esta acción.")).toBeInTheDocument();
    });

    it("muestra todas las ventas y el total vendido no suma los pedidos rechazados", async () => {
        obtenerVentas.mockResolvedValue(VENTAS);
        const { user } = renderPerfilAdmin();

        const ventana = await abrirSeccion(user, "Ver ventas realizadas");

        expect(await within(ventana).findByText(`Ventas realizadas: 3 | Total vendido: ${formatearPrecio(1500)}`)).toBeInTheDocument();
        expect(within(ventana).getByText("carlos@email.com")).toBeInTheDocument();
        expect(within(ventana).getAllByText("Invitado")).toHaveLength(2);
    });

    it("cada pedido muestra solo el botón del siguiente estado permitido", async () => {
        obtenerVentas.mockResolvedValue(VENTAS);
        const { user } = renderPerfilAdmin();
        const ventana = await abrirSeccion(user, "Ver ventas realizadas");
        await within(ventana).findByText("Bocchi - Tomo 1 x1");

        expect(filaDe(ventana, "Bocchi - Tomo 1 x1").getByRole("button", { name: "Marcar enviado" })).toBeInTheDocument();
        expect(filaDe(ventana, "Rem x1").getByRole("button", { name: "Marcar entregado" })).toBeInTheDocument();
        expect(filaDe(ventana, "Lucia x1").queryByRole("button")).toBeNull();
    });

    it("al confirmar, avanza el pedido y actualiza solo esa fila", async () => {
        obtenerVentas.mockResolvedValue(VENTAS);
        cambiarEstadoPedido.mockResolvedValue({ ...VENTAS[0], estado: "ENVIADO" });
        vi.spyOn(window, "confirm").mockReturnValue(true);
        const { user } = renderPerfilAdmin();
        const ventana = await abrirSeccion(user, "Ver ventas realizadas");
        await within(ventana).findByText("Bocchi - Tomo 1 x1");

        await user.click(filaDe(ventana, "Bocchi - Tomo 1 x1").getByRole("button", { name: "Marcar enviado" }));

        expect(cambiarEstadoPedido).toHaveBeenCalledWith("p1", "ENVIADO");
        expect(await filaDe(ventana, "Bocchi - Tomo 1 x1").findByRole("button", { name: "Marcar entregado" })).toBeInTheDocument();
    });

    it("si el backend rechaza el cambio de estado, lo avisa con una alerta", async () => {
        obtenerVentas.mockResolvedValue(VENTAS);
        cambiarEstadoPedido.mockRejectedValue(errorCon(409, "Transición de estado no permitida."));
        vi.spyOn(window, "confirm").mockReturnValue(true);
        const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
        const { user } = renderPerfilAdmin();
        const ventana = await abrirSeccion(user, "Ver ventas realizadas");
        await within(ventana).findByText("Rem x1");

        await user.click(filaDe(ventana, "Rem x1").getByRole("button", { name: "Marcar entregado" }));

        await waitFor(() => expect(alerta).toHaveBeenCalledWith("Transición de estado no permitida."));
    });
});

describe("editar perfil", () => {
    it("pide la contraseña y rechaza una vacía o incorrecta", async () => {
        const { user } = renderPerfilAdmin();
        const ventana = await abrirSeccion(user, "Editar perfil");

        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        expect(within(ventana).getByText("campo vacio, ingresar contraseña")).toBeInTheDocument();

        await user.type(within(ventana).getByPlaceholderText("ingresar contraseña"), "incorrecta");
        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        expect(await within(ventana).findByText("Contraseña incorrecta")).toBeInTheDocument();
    });

    it("valida el nombre, guarda los cambios en el backend y renueva la sesión", async () => {
        const { user, sesion } = renderPerfilAdmin();
        const ventana = await abrirSeccion(user, "Editar perfil");
        await user.type(within(ventana).getByPlaceholderText("ingresar contraseña"), CLAVE_ANA);
        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        const nombre = await waitFor(() => ventana.querySelector('[name="nombre"]') ?? Promise.reject());

        await user.clear(nombre);
        await user.type(nombre, "Ana2");
        await user.click(within(ventana).getByRole("button", { name: "Guardar cambios" }));
        expect(within(ventana).getByText("El nombre solo debe contener letras")).toBeInTheDocument();

        await user.clear(nombre);
        await user.type(nombre, "Ana María");
        await user.click(within(ventana).getByRole("button", { name: "Guardar cambios" }));

        expect(editarMiPerfil).toHaveBeenCalledWith({
            nombre: "Ana María",
            apellido: "Gonzales",
            correo: "ana@email.com",
            contraseniaActual: CLAVE_ANA,
            contraseniaNueva: null,
        });
        await waitFor(() => expect(sesion.refrescarSesion).toHaveBeenCalled());
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("si el correo ya existe, muestra el error bajo el campo correo", async () => {
        editarMiPerfil.mockRejectedValueOnce(errorCon(409, "Ese correo ya está registrado"));
        const { user } = renderPerfilAdmin();
        const ventana = await abrirSeccion(user, "Editar perfil");
        await user.type(within(ventana).getByPlaceholderText("ingresar contraseña"), CLAVE_ANA);
        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        await within(ventana).findByRole("button", { name: "Guardar cambios" });

        await user.click(within(ventana).getByRole("button", { name: "Guardar cambios" }));

        expect(await within(ventana).findByText("Ese correo ya está registrado")).toBeInTheDocument();
    });
});

describe("cerrar sesión", () => {
    it("pide confirmación, cierra la sesión en el backend y vuelve al login", async () => {
        const { user, sesion } = renderPerfilAdmin();
        const ventana = await abrirSeccion(user, "Cerrar sesión");

        expect(within(ventana).getByText("¿Seguro que quieres cerrar sesión?")).toBeInTheDocument();
        await user.click(within(ventana).getByRole("button", { name: "Cerrar sesión" }));

        expect(sesion.logout).toHaveBeenCalled();
        expect(await screen.findByRole("heading", { name: "Página de login" })).toBeInTheDocument();
    });
});