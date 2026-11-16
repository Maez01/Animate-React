import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CarritoProvider from "../context/CarritoProvider";
import Mangas from "./Mangas";
import { obtenerCatalogoCompleto } from "../utils/catalogoMangas";

// El catálogo lo entrega una función simulada en vez del backend
vi.mock("../utils/catalogoMangas", () => ({ obtenerCatalogoCompleto: vi.fn() }));

const MANGAS = [
    {
        id: 1, titulo: "BOCCHI THE ROCK", genero: "SLICE OF LIFE", vistas: 10, fechaAgregado: "2026-01-05",
        sinopsis: "Una chica tímida que toca guitarra.", imgPortada: "/b1.jpg",
        volumenes: [
            { tomo: 1, precio: 14990, stock: 8, img: "/b1.jpg" },
            { tomo: 2, precio: 14990, stock: 0, img: "/b2.jpg" },
        ],
    },
    {
        id: 2, titulo: "CHAINSAW MAN", genero: "SHONEN", vistas: 50, fechaAgregado: "2026-03-01",
        sinopsis: "Un cazador de demonios.", imgPortada: "/c1.jpg",
        volumenes: [{ tomo: 1, precio: 12990, stock: 3, img: "/c1.jpg" }],
    },
    {
        id: 3, titulo: "MONSTER", genero: "seinen", vistas: 5, fechaAgregado: "2026-02-01",
        sinopsis: "Un médico persigue a un asesino.", imgPortada: "/m1.jpg",
        volumenes: [{ tomo: 1, precio: 16990, stock: 1, img: "/m1.jpg" }],
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    obtenerCatalogoCompleto.mockImplementation(async () => structuredClone(MANGAS));
});

// Muestra la página y espera a que llegue el catálogo
async function renderMangas(ruta = "/mangas") {
    const user = userEvent.setup();
    const { container } = render(
        <MemoryRouter initialEntries={[ruta]}>
            <CarritoProvider>
                <Mangas />
            </CarritoProvider>
        </MemoryRouter>
    );
    await screen.findAllByRole("button", { name: "Ver Volúmenes" });
    const titulos = () => [...container.querySelectorAll(".card-title")].map(t => t.textContent);
    const [selectGenero, selectOrden] = screen.getAllByRole("combobox");
    return { user, titulos, selectGenero, selectOrden };
}

const carritoGuardado = () => JSON.parse(localStorage.getItem("carritoAnimate") ?? "[]");

describe("catálogo de mangas", () => {
    it("muestra 'Cargando' mientras espera y luego una tarjeta por manga", async () => {
        render(<MemoryRouter><CarritoProvider><Mangas /></CarritoProvider></MemoryRouter>);

        expect(screen.getByText("Cargando mangas...")).toBeInTheDocument();
        expect(await screen.findAllByRole("button", { name: "Ver Volúmenes" })).toHaveLength(3);
    });

    it("si el backend no responde, muestra el error", async () => {
        obtenerCatalogoCompleto.mockRejectedValueOnce(new Error("No se pudo conectar con el servidor"));

        render(<MemoryRouter><CarritoProvider><Mangas /></CarritoProvider></MemoryRouter>);

        expect(await screen.findByText("No se pudo conectar con el servidor")).toBeInTheDocument();
    });

    it("el buscador filtra por título sin importar las mayúsculas", async () => {
        const { user, titulos } = await renderMangas();

        await user.type(screen.getByPlaceholderText("Buscar por título..."), "chain");

        expect(titulos()).toEqual(["CHAINSAW MAN"]);
    });

    it("filtra por género aunque en el backend venga en mayúsculas o minúsculas", async () => {
        const { user, titulos, selectGenero } = await renderMangas();

        await user.selectOptions(selectGenero, "seinen");
        expect(titulos()).toEqual(["MONSTER"]);

        await user.selectOptions(selectGenero, "shonen");
        expect(titulos()).toEqual(["CHAINSAW MAN"]);
    });

    it("ordena por más vistos y por más recientes", async () => {
        const { user, titulos, selectOrden } = await renderMangas();

        await user.selectOptions(selectOrden, "mas-vistos");
        expect(titulos()).toEqual(["CHAINSAW MAN", "BOCCHI THE ROCK", "MONSTER"]);

        await user.selectOptions(selectOrden, "recientes");
        expect(titulos()).toEqual(["CHAINSAW MAN", "MONSTER", "BOCCHI THE ROCK"]);
    });

    it("avisa cuando ningún manga coincide", async () => {
        const { user } = await renderMangas();

        await user.type(screen.getByPlaceholderText("Buscar por título..."), "zzz");

        expect(screen.getByText("No existen registros que coincidan con la búsqueda.")).toBeInTheDocument();
    });

    it("toma la búsqueda desde la dirección (?buscar=), como la envía el inicio", async () => {
        const { titulos } = await renderMangas("/mangas?buscar=monster");

        expect(screen.getByPlaceholderText("Buscar por título...")).toHaveValue("monster");
        expect(titulos()).toEqual(["MONSTER"]);
    });
});

describe("volúmenes y compra", () => {
    async function abrirVolumenes(titulo) {
        const datos = await renderMangas();
        const tarjeta = screen.getByText(titulo).closest(".card");
        await datos.user.click(within(tarjeta).getByRole("button", { name: "Ver Volúmenes" }));
        const dialogo = await screen.findByRole("dialog");
        return { ...datos, dialogo };
    }

    it("muestra la sinopsis, Comprar en los tomos con stock y Sin stock en los agotados", async () => {
        const { dialogo } = await abrirVolumenes("BOCCHI THE ROCK");

        expect(within(dialogo).getByText("Una chica tímida que toca guitarra.")).toBeInTheDocument();
        expect(within(dialogo).getByRole("button", { name: "Comprar" })).toBeEnabled();
        expect(within(dialogo).getByRole("button", { name: "Sin stock" })).toBeDisabled();
    });

    it("comprar un tomo lo agrega al carrito con su clave, precio y stock", async () => {
        const { user, dialogo } = await abrirVolumenes("BOCCHI THE ROCK");

        await user.click(within(dialogo).getByRole("button", { name: "Comprar" }));

        await waitFor(() => expect(carritoGuardado()).toEqual([{
            clave: "manga-1-1",
            tipo: "manga",
            productoId: 1,
            tomo: 1,
            nombre: "BOCCHI THE ROCK - Tomo 1",
            precio: 14990,
            stock: 8,
            img: "/b1.jpg",
            cantidad: 1,
        }]));
    });

    it("la dirección ?manga= abre directo los volúmenes de ese manga", async () => {
        await renderMangas("/mangas?manga=2");

        const dialogo = await screen.findByRole("dialog");
        expect(within(dialogo).getByText("Un cazador de demonios.")).toBeInTheDocument();
    });

    it("la ventana se cierra con el botón de cerrar", async () => {
        const { user, dialogo } = await abrirVolumenes("MONSTER");

        await user.click(within(dialogo).getByRole("button", { name: "Close" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
});