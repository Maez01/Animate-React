import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CarritoProvider from "../context/CarritoProvider";
import Figuras from "./Figuras";
import { obtenerCatalogoFiguras } from "../utils/catalogoFiguras";

// Solo se simula la función que pide las figuras al backend;
// obtenerImagenesGaleria (la usa la tarjeta) se mantiene real.
vi.mock("../utils/catalogoFiguras", async importOriginal => ({
    ...(await importOriginal()),
    obtenerCatalogoFiguras: vi.fn(),
}));

const FIGURAS = [
    {
        id: 1, nombre: "Lucia Crimson Abyss", proveniencia: "Punishing Gray Raven", tipoFigura: "Figura a escala",
        precio: 127000, stock: 2, vistas: 5, fechaAgregado: "2026-01-10", imgPortada: "/lucia.webp", galeria: [],
    },
    {
        id: 2, nombre: "Bocchi Nendoroid", proveniencia: "Bocchi the Rock", tipoFigura: "Nendoroid",
        precio: 45990, stock: 0, vistas: 20, fechaAgregado: "2026-03-01", imgPortada: "/bocchi.webp", galeria: [],
    },
    {
        id: 3, nombre: "Rem", proveniencia: "Re:Zero", tipoFigura: "Figura a escala",
        precio: 89990, stock: 4, vistas: 1, fechaAgregado: "2026-02-01", imgPortada: "/rem.webp", galeria: [],
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    obtenerCatalogoFiguras.mockImplementation(async () => structuredClone(FIGURAS));
});

// Muestra la página y espera a que llegue el catálogo
async function renderFiguras() {
    const user = userEvent.setup();
    const { container } = render(
        <MemoryRouter>
            <CarritoProvider>
                <Figuras />
            </CarritoProvider>
        </MemoryRouter>
    );
    await screen.findByText("Lucia Crimson Abyss");
    const nombres = () => [...container.querySelectorAll(".card-producto .card-title")].map(t => t.textContent);
    const [selectTipo, selectOrden] = screen.getAllByRole("combobox");
    return { user, nombres, selectTipo, selectOrden };
}

const tarjetaDe = nombre => within(screen.getByText(nombre).closest(".card"));
const carritoGuardado = () => JSON.parse(localStorage.getItem("carritoAnimate") ?? "[]");

describe("página de figuras", () => {
    it("muestra 'Cargando' mientras espera y luego todas las figuras", async () => {
        render(<MemoryRouter><CarritoProvider><Figuras /></CarritoProvider></MemoryRouter>);

        expect(screen.getByText("Cargando figuras...")).toBeInTheDocument();
        expect(await screen.findByText("Rem")).toBeInTheDocument();
        expect(screen.getByText("Bocchi Nendoroid")).toBeInTheDocument();
    });

    it("si el backend no responde, muestra el error", async () => {
        obtenerCatalogoFiguras.mockRejectedValueOnce(new Error("No se pudo conectar con el servidor"));

        render(<MemoryRouter><CarritoProvider><Figuras /></CarritoProvider></MemoryRouter>);

        expect(await screen.findByText("No se pudo conectar con el servidor")).toBeInTheDocument();
    });

    it("el buscador filtra por nombre sin importar las mayúsculas", async () => {
        const { user, nombres } = await renderFiguras();

        await user.type(screen.getByPlaceholderText("Buscar por nombre..."), "LUCIA");

        expect(nombres()).toEqual(["Lucia Crimson Abyss"]);
    });

    it("filtra por tipo de figura", async () => {
        const { user, nombres, selectTipo } = await renderFiguras();

        await user.selectOptions(selectTipo, "Nendoroid");

        expect(nombres()).toEqual(["Bocchi Nendoroid"]);
    });

    it("ordena por precio de menor a mayor y de mayor a menor", async () => {
        const { user, nombres, selectOrden } = await renderFiguras();

        await user.selectOptions(selectOrden, "precio-menor");
        expect(nombres()).toEqual(["Bocchi Nendoroid", "Rem", "Lucia Crimson Abyss"]);

        await user.selectOptions(selectOrden, "precio-mayor");
        expect(nombres()).toEqual(["Lucia Crimson Abyss", "Rem", "Bocchi Nendoroid"]);
    });

    it("muestra un mensaje cuando la búsqueda no encuentra nada", async () => {
        const { user } = await renderFiguras();

        await user.type(screen.getByPlaceholderText("Buscar por nombre..."), "zzz");

        expect(screen.getByText("Busqueda sin resultados")).toBeInTheDocument();
    });

    it("una figura sin stock no se puede agregar al carrito", async () => {
        await renderFiguras();

        expect(tarjetaDe("Bocchi Nendoroid").getByRole("button", { name: "Sin stock" })).toBeDisabled();
    });

    it("agregar al carrito guarda la figura con su clave, precio y stock", async () => {
        const { user } = await renderFiguras();

        await user.click(tarjetaDe("Lucia Crimson Abyss").getByRole("button", { name: "Agregar al carrito" }));

        expect(tarjetaDe("Lucia Crimson Abyss").getByRole("button", { name: "Agregado ✓" })).toBeInTheDocument();
        await waitFor(() => expect(carritoGuardado()).toEqual([{
            clave: "figura-1",
            tipo: "figura",
            productoId: 1,
            nombre: "Lucia Crimson Abyss",
            precio: 127000,
            stock: 2,
            img: "/lucia.webp",
            cantidad: 1,
        }]));
    });
});