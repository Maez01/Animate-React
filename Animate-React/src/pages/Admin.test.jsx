import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Admin from "./Admin";
import { guardarSesion, obtenerSesion, obtenerTodosUsuarios } from "../utils/usuarios";

function renderAdmin() {
    return render(
        <MemoryRouter initialEntries={["/admin"]}>
            <Routes>
                <Route path="/admin" element={<Admin />} />
                <Route path="/login" element={<h1>Página de login</h1>} />
            </Routes>
        </MemoryRouter>
    );
}

const [ana, carlos] = obtenerTodosUsuarios();

describe("acceso al panel de administración", () => {
    it("sin sesión manda al login", () => {
        renderAdmin();
        expect(screen.getByRole("heading", { name: "Página de login" })).toBeInTheDocument();
    });

    it("un cliente sin rol Admin tampoco puede entrar", () => {
        guardarSesion(carlos);
        renderAdmin();
        expect(screen.getByRole("heading", { name: "Página de login" })).toBeInTheDocument();
    });

    it("una administradora ve el panel con su nombre", () => {
        guardarSesion(ana);
        renderAdmin();

        expect(screen.getByRole("heading", { name: "Panel de Administracion" })).toBeInTheDocument();
        expect(screen.getByText(/Ana \(Admin\)/)).toBeInTheDocument();
    });

    it("las pestañas cambian entre mangas y figuras", async () => {
        guardarSesion(ana);
        const user = userEvent.setup();
        renderAdmin();

        expect(screen.getByRole("tab", { name: "Mangas" })).toHaveAttribute("aria-selected", "true");

        await user.click(screen.getByRole("tab", { name: "Figuras" }));

        expect(screen.getByRole("tab", { name: "Figuras" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("tab", { name: "Mangas" })).toHaveAttribute("aria-selected", "false");
    });

    it("cerrar sesión borra la sesión y vuelve al login", async () => {
        guardarSesion(ana);
        const user = userEvent.setup();
        renderAdmin();

        await user.click(screen.getByRole("button", { name: /Cerrar sesi[oó]n/ }));

        expect(await screen.findByRole("heading", { name: "Página de login" })).toBeInTheDocument();
        expect(obtenerSesion()).toBeNull();
    });
});