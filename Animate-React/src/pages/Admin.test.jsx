import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Admin from "./Admin";
import RutaProtegida from "../components/RutaProtegida";
import { AuthContext } from "../context/authContext";
import * as mangas from "../utils/catalogoMangas";
import * as figuras from "../utils/catalogoFiguras";

// El panel carga los catálogos al abrirse: se simulan vacíos
vi.mock("../utils/catalogoMangas", () => ({
    obtenerCatalogoCompleto: vi.fn(),
    obtenerPapelera: vi.fn(),
    agregarManga: vi.fn(),
    editarManga: vi.fn(),
    eliminarManga: vi.fn(),
    restaurarManga: vi.fn(),
    agregarTomo: vi.fn(),
    editarTomo: vi.fn(),
    eliminarTomo: vi.fn(),
}));
vi.mock("../utils/catalogoFiguras", async importOriginal => ({
    ...(await importOriginal()),
    obtenerCatalogoFiguras: vi.fn(),
    obtenerPapeleraFiguras: vi.fn(),
}));

const ana = { id: 1, nombre: "Ana", apellido: "Gonzales", correo: "ana@email.com", rol: "ADMIN" };
const carlos = { id: 2, nombre: "Carlos", apellido: "Calderon", correo: "carlos@email.com", rol: "USUARIO" };

beforeEach(() => {
    vi.clearAllMocks();
    mangas.obtenerCatalogoCompleto.mockResolvedValue([]);
    mangas.obtenerPapelera.mockResolvedValue([]);
    figuras.obtenerCatalogoFiguras.mockResolvedValue([]);
    figuras.obtenerPapeleraFiguras.mockResolvedValue([]);
});

// Muestra /admin protegido igual que en App.jsx, con la sesión que se indique
function renderAdmin({ usuario = null, cargando = false } = {}) {
    const sesion = {
        usuario,
        cargando,
        esAdmin: usuario?.rol === "ADMIN",
        login: vi.fn(),
        logout: vi.fn().mockResolvedValue(),
        refrescarSesion: vi.fn(),
    };
    render(
        <AuthContext.Provider value={sesion}>
            <MemoryRouter initialEntries={["/admin"]}>
                <Routes>
                    <Route path="/admin" element={<RutaProtegida soloAdmin><Admin /></RutaProtegida>} />
                    <Route path="/login" element={<h1>Página de login</h1>} />
                    <Route path="/" element={<h1>Página de inicio</h1>} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
    return sesion;
}

describe("acceso al panel de administración", () => {
    it("mientras se recupera la sesión muestra un aviso de carga", () => {
        renderAdmin({ cargando: true });

        expect(screen.getByText("Cargando sesion...")).toBeInTheDocument();
    });

    it("sin sesión manda al login", () => {
        renderAdmin();

        expect(screen.getByRole("heading", { name: "Página de login" })).toBeInTheDocument();
    });

    it("un cliente con rol USUARIO no puede entrar y vuelve al inicio", () => {
        renderAdmin({ usuario: carlos });

        expect(screen.getByRole("heading", { name: "Página de inicio" })).toBeInTheDocument();
    });

    it("una administradora ve el panel con su nombre y su rol", async () => {
        renderAdmin({ usuario: ana });

        expect(screen.getByRole("heading", { name: "Panel de Administracion" })).toBeInTheDocument();
        expect(screen.getByText("Ana (ADMIN)")).toBeInTheDocument();
        expect(await screen.findByText("No quedan mangas en el catálogo.")).toBeInTheDocument();
    });

    it("las pestañas cambian entre mangas y figuras", async () => {
        const user = userEvent.setup();
        renderAdmin({ usuario: ana });

        expect(screen.getByRole("tab", { name: "Mangas" })).toHaveAttribute("aria-selected", "true");

        await user.click(screen.getByRole("tab", { name: "Figuras" }));

        expect(screen.getByRole("tab", { name: "Figuras" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("tab", { name: "Mangas" })).toHaveAttribute("aria-selected", "false");
    });

    it("cerrar sesión espera al backend y vuelve al login", async () => {
        const user = userEvent.setup();
        const sesion = renderAdmin({ usuario: ana });

        await user.click(screen.getByRole("button", { name: /Cerrar sesi[oó]n/ }));

        expect(sesion.logout).toHaveBeenCalled();
        expect(await screen.findByRole("heading", { name: "Página de login" })).toBeInTheDocument();
    });
});