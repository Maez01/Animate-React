import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Perfil from "./PerfilUsuario";
import RutaProtegida from "../components/RutaProtegida";
import { AuthContext } from "../context/authContext";
import * as tarjetas from "../utils/tarjetas";
import * as direcciones from "../utils/direcciones";
import { obtenerMisCompras } from "../utils/ventas";
import { confirmarContrasenia, editarMiPerfil } from "../utils/usuarios";
import { formatearPrecio } from "../utils/formatoPrecio";

// Se simulan solo las funciones que llaman al backend; validaciones y textos quedan reales
vi.mock("../utils/tarjetas", async importOriginal => ({
    ...(await importOriginal()),
    obtenerTarjetas: vi.fn(),
    agregarTarjeta: vi.fn(),
    eliminarTarjeta: vi.fn(),
    seleccionarTarjeta: vi.fn(),
}));
vi.mock("../utils/direcciones", async importOriginal => ({
    ...(await importOriginal()),
    obtenerDirecciones: vi.fn(),
    agregarDireccion: vi.fn(),
    eliminarDireccion: vi.fn(),
    seleccionarDireccion: vi.fn(),
}));
vi.mock("../utils/ventas", async importOriginal => ({
    ...(await importOriginal()),
    obtenerMisCompras: vi.fn(),
}));
vi.mock("../utils/usuarios", async importOriginal => ({
    ...(await importOriginal()),
    confirmarContrasenia: vi.fn(),
    editarMiPerfil: vi.fn(),
}));

const CLAVE_CARLOS = "Carlos#Laraña1";
const carlos = { id: 2, nombre: "Carlos", apellido: "Calderon", correo: "carlos@email.com", rol: "USUARIO" };
const ana = { id: 1, nombre: "Ana", apellido: "Gonzales", correo: "ana@email.com", rol: "ADMIN" };

const tarjeta = (id, ultimos4, seleccionada = false) => ({ id, ultimos4, propietario: "Carlos Calderon", seleccionada });
const direccion = (id, calle, seleccionada = false) => ({
    id, calle, referencia: "", comuna: "Viña del Mar", region: "Valparaíso", seleccionada,
});

const COMPRAS = [
    { id: "c1", fecha: "2026-11-15T10:00:00Z", tarjeta: "**** 3456", total: 29980,
        direccion: "Av. Libertad 1234, Viña del Mar, Valparaíso",
        productos: [{ nombre: "Bocchi - Tomo 1", precio: 14990, cantidad: 2 }] },
    { id: "c2", fecha: "2026-11-16T10:00:00Z", tarjeta: "**** 3456", total: 127000, direccion: "",
        productos: [{ nombre: "Lucia", precio: 127000, cantidad: 1 }] },
];

const errorCon = (status, mensaje) => Object.assign(new Error(mensaje), { status });

// "Backend" en memoria para tarjetas y direcciones: la primera registrada queda seleccionada
function simularBackend({ listaTarjetas = [], listaDirecciones = [], compras = [] } = {}) {
    let guardadasT = structuredClone(listaTarjetas);
    let guardadasD = structuredClone(listaDirecciones);
    let siguienteId = 100;
    const seleccionarPrimera = lista => {
        if (lista.length > 0 && !lista.some(x => x.seleccionada)) lista[0].seleccionada = true;
    };

    tarjetas.obtenerTarjetas.mockImplementation(async () => structuredClone(guardadasT));
    tarjetas.agregarTarjeta.mockImplementation(async ({ numero, propietario }) => {
        guardadasT.push(tarjeta(siguienteId++, numero.replace(/\s/g, "").slice(-4)));
        guardadasT.at(-1).propietario = propietario.trim();
        seleccionarPrimera(guardadasT);
    });
    tarjetas.eliminarTarjeta.mockImplementation(async id => {
        guardadasT = guardadasT.filter(t => t.id !== id);
        seleccionarPrimera(guardadasT);
    });
    tarjetas.seleccionarTarjeta.mockImplementation(async id => {
        guardadasT.forEach(t => { t.seleccionada = t.id === id; });
    });

    direcciones.obtenerDirecciones.mockImplementation(async () => structuredClone(guardadasD));
    direcciones.agregarDireccion.mockImplementation(async datos => {
        guardadasD.push({ id: siguienteId++, ...datos, seleccionada: false });
        seleccionarPrimera(guardadasD);
    });
    direcciones.eliminarDireccion.mockImplementation(async id => {
        guardadasD = guardadasD.filter(d => d.id !== id);
        seleccionarPrimera(guardadasD);
    });
    direcciones.seleccionarDireccion.mockImplementation(async id => {
        guardadasD.forEach(d => { d.seleccionada = d.id === id; });
    });

    obtenerMisCompras.mockResolvedValue(compras);
}

beforeEach(() => {
    vi.clearAllMocks();
    simularBackend();
    confirmarContrasenia.mockImplementation(async (correo, contrasenia) => {
        if (contrasenia !== CLAVE_CARLOS) throw errorCon(401, "Correo o contraseña incorrectos.");
    });
    editarMiPerfil.mockResolvedValue({});
});

// Muestra /perfil protegido igual que en App.jsx
function renderPerfil(usuario = carlos) {
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
            <MemoryRouter initialEntries={["/perfil"]}>
                <Routes>
                    <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />
                    <Route path="/perfil-admin" element={<h1>Perfil de administrador</h1>} />
                    <Route path="/login" element={<h1>Página de login</h1>} />
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

describe("acceso al perfil", () => {
    it("sin sesión manda al login", () => {
        renderPerfil(null);

        expect(screen.getByRole("heading", { name: "Página de login" })).toBeInTheDocument();
    });

    it("un administrador es enviado a su propio perfil", () => {
        renderPerfil(ana);

        expect(screen.getByRole("heading", { name: "Perfil de administrador" })).toBeInTheDocument();
    });

    it("un cliente ve sus datos, y que no tiene tarjetas ni direcciones", async () => {
        renderPerfil();

        expect(screen.getByText("Nombre: Carlos")).toBeInTheDocument();
        expect(screen.getByText("Correo: carlos@email.com")).toBeInTheDocument();
        expect(await screen.findByText("Sin tarjetas registradas")).toBeInTheDocument();
        expect(screen.getByText("Sin direcciones registradas")).toBeInTheDocument();
    });

    it("si el backend no responde, muestra el error en el perfil", async () => {
        obtenerMisCompras.mockRejectedValueOnce(errorCon(0, "No se pudo conectar con el servidor"));

        renderPerfil();

        expect(await screen.findByText("No se pudo conectar con el servidor")).toBeInTheDocument();
    });
});

describe("editar perfil", () => {
    it("pide la contraseña actual y rechaza una vacía o incorrecta", async () => {
        const { user } = renderPerfil();
        const ventana = await abrirSeccion(user, "Editar perfil");

        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        expect(within(ventana).getByText("campo vacio, ingresar contraseña")).toBeInTheDocument();

        await user.type(within(ventana).getByPlaceholderText("ingresar contraseña"), "incorrecta");
        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        expect(await within(ventana).findByText("Contraseña incorrecta")).toBeInTheDocument();
    });

    it("valida los datos nuevos, los guarda en el backend y renueva la sesión", async () => {
        const { user, sesion } = renderPerfil();
        const ventana = await abrirSeccion(user, "Editar perfil");
        await user.type(within(ventana).getByPlaceholderText("ingresar contraseña"), CLAVE_CARLOS);
        await user.click(within(ventana).getByRole("button", { name: "Verificar" }));
        await within(ventana).findByRole("button", { name: "Guardar cambios" });
        const nombre = ventana.querySelector('[name="nombre"]');

        await user.clear(nombre);
        await user.type(nombre, "Carlos2");
        await user.click(within(ventana).getByRole("button", { name: "Guardar cambios" }));
        expect(within(ventana).getByText("El nombre solo debe contener letras")).toBeInTheDocument();

        await user.clear(nombre);
        await user.type(nombre, "Carlitos");
        await user.click(within(ventana).getByRole("button", { name: "Guardar cambios" }));

        expect(editarMiPerfil).toHaveBeenCalledWith({
            nombre: "Carlitos",
            apellido: "Calderon",
            correo: "carlos@email.com",
            contraseniaActual: CLAVE_CARLOS,
            contraseniaNueva: null,
        });
        await waitFor(() => expect(sesion.refrescarSesion).toHaveBeenCalled());
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
});

describe("historial de compras", () => {
    it("avisa cuando todavía no hay compras", async () => {
        const { user } = renderPerfil();

        const ventana = await abrirSeccion(user, "Ver historial de compras");

        expect(within(ventana).getByText("Todavía no has realizado compras.")).toBeInTheDocument();
    });

    it("muestra la cantidad, el total gastado y una fila de 5 columnas por compra", async () => {
        simularBackend({ compras: COMPRAS });
        const { user } = renderPerfil();
        await waitFor(() => expect(obtenerMisCompras).toHaveBeenCalled());

        const ventana = await abrirSeccion(user, "Ver historial de compras");

        expect(await within(ventana).findByText(`Compras realizadas: 2 | Total gastado: ${formatearPrecio(156980)}`)).toBeInTheDocument();
        const fila = within(ventana).getByText(`Bocchi - Tomo 1 x2 (${formatearPrecio(29980)})`).closest("tr");
        expect(within(fila).getAllByRole("cell")).toHaveLength(5);
        expect(within(fila).getByText("Av. Libertad 1234, Viña del Mar, Valparaíso")).toBeInTheDocument();
        expect(within(ventana).getByText("-")).toBeInTheDocument(); // compra sin dirección guardada
    });
});

describe("tarjetas", () => {
    it("registra una tarjeta, queda seleccionada y luego se puede eliminar", async () => {
        const { user } = renderPerfil();
        const ventana = await abrirSeccion(user, "Mis tarjetas");
        const campo = nombre => ventana.querySelector(`[name="${nombre}"]`);

        await user.type(campo("numero"), "1234 5678 9012 3456");
        await user.type(campo("clave"), "123");
        await user.type(campo("propietario"), "Carlos Calderon");
        await user.click(within(ventana).getByRole("button", { name: "Guardar tarjeta" }));

        expect(tarjetas.agregarTarjeta).toHaveBeenCalledWith({ numero: "1234 5678 9012 3456", clave: "123", propietario: "Carlos Calderon" });
        expect(await within(ventana).findByText("(seleccionada)")).toBeInTheDocument();
        expect(within(ventana).getByText(/\*\*\*\* \*\*\*\* \*\*\*\* 3456 \(Carlos Calderon\)/)).toBeInTheDocument();

        await user.click(within(ventana).getByRole("button", { name: "Eliminar" }));
        expect(await within(ventana).findByText("No tienes tarjetas registradas.")).toBeInTheDocument();
    });

    it("si el backend rechaza la tarjeta, el error aparece en el formulario", async () => {
        tarjetas.agregarTarjeta.mockRejectedValueOnce(errorCon(400, "La tarjeta no es válida."));
        const { user } = renderPerfil();
        const ventana = await abrirSeccion(user, "Mis tarjetas");
        const campo = nombre => ventana.querySelector(`[name="${nombre}"]`);

        await user.type(campo("numero"), "1234567890123456");
        await user.type(campo("clave"), "123");
        await user.type(campo("propietario"), "Carlos");
        await user.click(within(ventana).getByRole("button", { name: "Guardar tarjeta" }));

        expect(await within(ventana).findByText("La tarjeta no es válida.")).toBeInTheDocument();
    });

    it("permite elegir con qué tarjeta pagar", async () => {
        simularBackend({ listaTarjetas: [tarjeta(1, "1111", true), tarjeta(2, "2222")] });
        const { user } = renderPerfil();
        await screen.findByText("**** **** **** 2222 (Carlos Calderon)");
        const [selectTarjeta] = screen.getAllByRole("combobox");

        await user.selectOptions(selectTarjeta, "2");

        expect(tarjetas.seleccionarTarjeta).toHaveBeenCalledWith(2);
        await waitFor(() => expect(selectTarjeta).toHaveValue("2"));
    });
});

describe("direcciones", () => {
    it("valida, registra una dirección y la deja seleccionada", async () => {
        const { user } = renderPerfil();
        const ventana = await abrirSeccion(user, "Mis direcciones");
        const campo = nombre => ventana.querySelector(`[name="${nombre}"]`);

        await user.click(within(ventana).getByRole("button", { name: "Guardar dirección" }));
        expect(within(ventana).getByText("La calle es obligatoria")).toBeInTheDocument();
        expect(direcciones.agregarDireccion).not.toHaveBeenCalled();

        await user.type(campo("calle"), "Av. Libertad 1234");
        await user.type(campo("comuna"), "Viña del Mar");
        await user.selectOptions(campo("region"), "Valparaíso");
        await user.click(within(ventana).getByRole("button", { name: "Guardar dirección" }));

        expect(direcciones.agregarDireccion).toHaveBeenCalledWith({
            calle: "Av. Libertad 1234", referencia: "", comuna: "Viña del Mar", region: "Valparaíso",
        });
        expect(await within(ventana).findByText("(seleccionada)")).toBeInTheDocument();
    });

    it("elimina una dirección registrada", async () => {
        simularBackend({ listaDirecciones: [direccion(1, "Av. Libertad 1234", true)] });
        const { user } = renderPerfil();
        await screen.findByText("Av. Libertad 1234, Viña del Mar, Valparaíso");
        const ventana = await abrirSeccion(user, "Mis direcciones");

        await user.click(within(ventana).getByRole("button", { name: "Eliminar" }));

        expect(direcciones.eliminarDireccion).toHaveBeenCalledWith(1);
        expect(await within(ventana).findByText("No tienes direcciones registradas.")).toBeInTheDocument();
    });

    it("si el backend no puede eliminarla, lo avisa con una alerta", async () => {
        simularBackend({ listaDirecciones: [direccion(1, "Av. Libertad 1234", true)] });
        direcciones.eliminarDireccion.mockRejectedValueOnce(errorCon(0, "No se pudo conectar con el servidor"));
        const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
        const { user } = renderPerfil();
        await screen.findByText("Av. Libertad 1234, Viña del Mar, Valparaíso");
        const ventana = await abrirSeccion(user, "Mis direcciones");

        await user.click(within(ventana).getByRole("button", { name: "Eliminar" }));

        await waitFor(() => expect(alerta).toHaveBeenCalledWith("No se pudo conectar con el servidor"));
    });

    it("permite elegir a qué dirección enviar", async () => {
        simularBackend({ listaDirecciones: [direccion(1, "Av. Libertad 1234", true), direccion(2, "Calle Valparaíso 55")] });
        const { user } = renderPerfil();
        await screen.findByText("Calle Valparaíso 55, Viña del Mar, Valparaíso");
        const [, selectDireccion] = screen.getAllByRole("combobox");

        await user.selectOptions(selectDireccion, "2");

        expect(direcciones.seleccionarDireccion).toHaveBeenCalledWith(2);
        await waitFor(() => expect(selectDireccion).toHaveValue("2"));
    });
});

describe("cerrar sesión", () => {
    it("Cancelar mantiene la sesión abierta", async () => {
        const { user, sesion } = renderPerfil();
        const ventana = await abrirSeccion(user, "Cerrar sesión");

        await user.click(within(ventana).getByRole("button", { name: "Cancelar" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(sesion.logout).not.toHaveBeenCalled();
    });

    it("confirmar cierra la sesión en el backend y vuelve al login", async () => {
        const { user, sesion } = renderPerfil();
        const ventana = await abrirSeccion(user, "Cerrar sesión");

        await user.click(within(ventana).getByRole("button", { name: "Cerrar sesión" }));

        expect(sesion.logout).toHaveBeenCalled();
        expect(await screen.findByRole("heading", { name: "Página de login" })).toBeInTheDocument();
    });
});