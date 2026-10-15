import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TarjetaFigura from "./TarjetaFiguras";

const figuraBase = {
    id: 1,
    nombre: "Lucia Crimson Abyss",
    proveniencia: "Punishing Gray Raven",
    tipoFigura: "Figura a escala",
    precio: 127000,
    stock: 5,
    imgPortada: "/Imagenes/Figuras/portada.webp",
    galeria: ["/Imagenes/Figuras/extra1.webp", "/Imagenes/Figuras/extra2.webp"],
};

describe("TarjetaFigura", () => {
    it("muestra el nombre, la proveniencia, el precio y el stock", () => {
        render(<TarjetaFigura figura={figuraBase} alComprar={vi.fn()} />);

        expect(screen.getByRole("heading", { name: "Lucia Crimson Abyss" })).toBeInTheDocument();
        expect(screen.getByText("Punishing Gray Raven")).toBeInTheDocument();
        expect(screen.getByText("$127.000")).toBeInTheDocument();
        expect(screen.getByText("Stock: 5 u.")).toBeInTheDocument();
    });

    it("desactiva el botón cuando la figura está agotada", () => {
        render(<TarjetaFigura figura={{ ...figuraBase, stock: 0 }} alComprar={vi.fn()} />);

        expect(screen.getByText("Agotado")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Sin stock" })).toBeDisabled();
    });

    it("al comprar envía la figura y muestra 'Agregado ✓'", async () => {
        const user = userEvent.setup();
        const alComprar = vi.fn(() => true);
        render(<TarjetaFigura figura={figuraBase} alComprar={alComprar} />);

        await user.click(screen.getByRole("button", { name: "Agregar al carrito" }));

        expect(alComprar).toHaveBeenCalledTimes(1);
        expect(alComprar).toHaveBeenCalledWith(figuraBase);
        expect(screen.getByRole("button", { name: "Agregado ✓" })).toBeInTheDocument();
    });

    it("no muestra 'Agregado ✓' si el carrito rechaza la figura", async () => {
        const user = userEvent.setup();
        render(<TarjetaFigura figura={figuraBase} alComprar={vi.fn(() => false)} />);

        await user.click(screen.getByRole("button", { name: "Agregar al carrito" }));

        expect(screen.getByRole("button", { name: "Agregar al carrito" })).toBeInTheDocument();
    });

    it("al hacer clic en la imagen abre la galería con la portada primero", async () => {
        const user = userEvent.setup();
        render(<TarjetaFigura figura={figuraBase} alComprar={vi.fn()} />);

        await user.click(screen.getByRole("img", { name: "Lucia Crimson Abyss" }));

        const ventana = await screen.findByRole("dialog");
        const imagenes = within(ventana).getAllByRole("img");
        expect(imagenes).toHaveLength(3);
        expect(imagenes[0]).toHaveAttribute("src", figuraBase.imgPortada);
    });
});