import { describe, it, expect } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CarritoProvider from "../context/CarritoProvider";
import Mangas from "./Mangas";
import { baseDatosMangas } from "../data/mangas";
import { guardarCatalogo } from "../utils/catalogoMangas";

const primero = baseDatosMangas[0];

function renderMangas(ruta = "/mangas") {
    return render(
        <MemoryRouter initialEntries={[ruta]}>
            <CarritoProvider>
                <Mangas />
            </CarritoProvider>
        </MemoryRouter>
    );
}

const tarjetasVisibles = () => screen.queryAllByRole("button", { name: "Ver Volúmenes" });

async function abrirVolumenesDelPrimero(user) {
    await user.click(tarjetasVisibles()[0]);
    return screen.findByRole("dialog");
}

describe("catálogo de mangas", () => {
    it("muestra una tarjeta por cada manga", () => {
        renderMangas();
        expect(tarjetasVisibles()).toHaveLength(baseDatosMangas.length);
    });

    it("el buscador filtra por título", async () => {
        const user = userEvent.setup();
        renderMangas();

        await user.type(screen.getByPlaceholderText("Buscar por título..."), "night");

        const esperados = baseDatosMangas.filter(m => m.titulo.toLowerCase().includes("night"));
        expect(tarjetasVisibles()).toHaveLength(esperados.length);
        expect(screen.getByText(esperados[0].titulo)).toBeInTheDocument();
    });

    it("filtra por género", async () => {
        const user = userEvent.setup();
        renderMangas();

        await user.selectOptions(screen.getByDisplayValue("Todos los géneros"), "seinen");

        const esperados = baseDatosMangas.filter(m => m.genero.toLowerCase() === "seinen");
        expect(tarjetasVisibles()).toHaveLength(esperados.length);
    });

    it("avisa cuando ningún manga coincide", async () => {
        const user = userEvent.setup();
        renderMangas();

        await user.type(screen.getByPlaceholderText("Buscar por título..."), "zzz");

        expect(screen.getByText("No existen registros que coincidan con la búsqueda.")).toBeInTheDocument();
        expect(tarjetasVisibles()).toHaveLength(0);
    });

    it("toma la búsqueda desde la dirección (?buscar=)", () => {
        renderMangas("/mangas?buscar=bocchi");

        const esperados = baseDatosMangas.filter(m => m.titulo.toLowerCase().includes("bocchi"));
        expect(screen.getByPlaceholderText("Buscar por título...")).toHaveValue("bocchi");
        expect(tarjetasVisibles()).toHaveLength(esperados.length);
    });
});

describe("volúmenes y compra", () => {
    it("Ver Volúmenes abre la sinopsis y un botón Comprar por tomo con stock", async () => {
        const user = userEvent.setup();
        renderMangas();

        const ventana = await abrirVolumenesDelPrimero(user);

        expect(within(ventana).getByText(primero.sinopsis)).toBeInTheDocument();
        const conStock = primero.volumenes.filter(v => v.stock > 0);
        expect(within(ventana).getAllByRole("button", { name: "Comprar" })).toHaveLength(conStock.length);
    });

    it("comprar un tomo lo agrega al carrito con su nombre y clave", async () => {
        const user = userEvent.setup();
        renderMangas();

        const ventana = await abrirVolumenesDelPrimero(user);
        await user.click(within(ventana).getAllByRole("button", { name: "Comprar" })[0]);

        expect(within(ventana).getByRole("button", { name: "Agregado ✓" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Carrito/ })).toHaveTextContent("1");

        const [item] = JSON.parse(localStorage.getItem("carritoAnimate"));
        expect(item.clave).toBe(`manga-${primero.id}-1`);
        expect(item.nombre).toBe(`${primero.titulo} - Tomo 1`);
    });

    it("un tomo agotado aparece con el botón desactivado", async () => {
        const catalogo = structuredClone(baseDatosMangas);
        catalogo[0].volumenes[0].stock = 0;
        guardarCatalogo(catalogo);
        const user = userEvent.setup();
        renderMangas();

        const ventana = await abrirVolumenesDelPrimero(user);

        expect(within(ventana).getByRole("button", { name: "Sin stock" })).toBeDisabled();
        expect(within(ventana).getByText("Agotado")).toBeInTheDocument();
    });

    it("la dirección ?manga= abre directo los volúmenes de ese manga", async () => {
        const manga = baseDatosMangas[3];
        renderMangas(`/mangas?manga=${manga.id}`);

        const ventana = await screen.findByRole("dialog");
        expect(within(ventana).getByText(manga.titulo)).toBeInTheDocument();
    });

    it("la ventana se cierra con el botón de cerrar", async () => {
        const user = userEvent.setup();
        renderMangas();

        const ventana = await abrirVolumenesDelPrimero(user);
        await user.click(within(ventana).getByRole("button", { name: "Close" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
});