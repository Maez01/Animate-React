import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CarritoProvider from "../context/CarritoProvider";
import Figuras from "./Figuras";
import { baseDatosFiguras } from "../data/figuras";

function renderFiguras() {
    return render(
        <MemoryRouter>
            <CarritoProvider>
                <Figuras />
            </CarritoProvider>
        </MemoryRouter>
    );
}

function nombresEnPantalla() {
    return screen.queryAllByRole("heading", { level: 5 }).map(titulo => titulo.textContent);
}

describe("página de figuras", () => {
    it("muestra todas las figuras del catálogo", () => {
        renderFiguras();
        expect(nombresEnPantalla()).toHaveLength(baseDatosFiguras.length);
    });

    it("el buscador filtra por nombre sin importar las mayúsculas", async () => {
        const user = userEvent.setup();
        renderFiguras();

        await user.type(screen.getByPlaceholderText("Buscar por nombre..."), "NENDO");

        const esperadas = baseDatosFiguras
            .filter(f => f.nombre.toLowerCase().includes("nendo"))
            .map(f => f.nombre);
        expect(nombresEnPantalla()).toEqual(esperadas);
    });

    it("filtra por tipo de figura", async () => {
        const user = userEvent.setup();
        renderFiguras();

        await user.selectOptions(screen.getByDisplayValue("Todos los tipos"), "Nendoroid");

        const esperadas = baseDatosFiguras
            .filter(f => f.tipoFigura === "Nendoroid")
            .map(f => f.nombre);
        expect(nombresEnPantalla()).toEqual(esperadas);
    });

    it("ordena por precio de menor a mayor", async () => {
        const user = userEvent.setup();
        renderFiguras();

        await user.selectOptions(screen.getByDisplayValue("Ordenar por..."), "precio-menor");

        const esperadas = [...baseDatosFiguras]
            .sort((a, b) => a.precio - b.precio)
            .map(f => f.nombre);
        expect(nombresEnPantalla()).toEqual(esperadas);
    });

    it("muestra un mensaje cuando la búsqueda no encuentra nada", async () => {
        const user = userEvent.setup();
        renderFiguras();

        await user.type(screen.getByPlaceholderText("Buscar por nombre..."), "zzz");

        expect(screen.getByText("Busqueda sin resultados")).toBeInTheDocument();
        expect(nombresEnPantalla()).toHaveLength(0);
    });

    it("agregar al carrito actualiza el contador y guarda la figura", async () => {
        const user = userEvent.setup();
        renderFiguras();

        await user.click(screen.getAllByRole("button", { name: "Agregar al carrito" })[0]);

        expect(screen.getByRole("link", { name: /Carrito/ })).toHaveTextContent("1");

        const carritoGuardado = JSON.parse(localStorage.getItem("carritoAnimate"));
        expect(carritoGuardado).toHaveLength(1);
        expect(carritoGuardado[0].clave).toBe(`figura-${baseDatosFiguras[0].id}`);
    });
});