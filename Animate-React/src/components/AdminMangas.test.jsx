import { describe, it, expect, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminMangas from "./AdminMangas";
import { baseDatosMangas } from "../data/mangas";
import { obtenerCatalogoCompleto, obtenerVolumen } from "../utils/catalogoMangas";

const primero = baseDatosMangas[0];

function renderAdminMangas() {
    const { container } = render(<AdminMangas />);
    const campo = nombre => container.querySelector(`form [name="${nombre}"]`);
    return { campo };
}

function filaDe(texto) {
    return screen.getAllByRole("row").find(fila => within(fila).queryByText(texto));
}

function responderConfirmacion(respuesta) {
    return vi.spyOn(window, "confirm").mockReturnValue(respuesta);
}

describe("mangas del catálogo", () => {
    it("agrega un manga nuevo con su tomo 1", async () => {
        const user = userEvent.setup();
        const { campo } = renderAdminMangas();

        await user.type(campo("titulo"), "Manga de prueba");
        await user.selectOptions(campo("genero"), "seinen");
        await user.type(campo("sinopsis"), "Una sinopsis de prueba.");
        await user.type(campo("imgPortada"), "/Imagenes/Mangas/prueba.jpg");
        await user.type(campo("precio"), "9990");
        await user.type(campo("stock"), "4");
        await user.click(screen.getByRole("button", { name: "Agregar manga" }));

        expect(within(filaDe("Manga de prueba")).getByText("1")).toBeInTheDocument();
        expect(obtenerCatalogoCompleto().at(-1)).toMatchObject({ titulo: "Manga de prueba", genero: "seinen" });
    });

    it("avisa si faltan textos o si el precio no es válido", async () => {
        const user = userEvent.setup();
        const { campo } = renderAdminMangas();

        await user.click(screen.getByRole("button", { name: "Agregar manga" }));
        expect(screen.getByText("Completa todos los campos de texto.")).toBeInTheDocument();

        await user.type(campo("titulo"), "Manga");
        await user.type(campo("sinopsis"), "Sinopsis");
        await user.type(campo("imgPortada"), "/x.jpg");
        await user.type(campo("stock"), "1.5");
        await user.click(screen.getByRole("button", { name: "Agregar manga" }));
        expect(screen.getByText("Precio y stock deben ser números válidos (0 o más).")).toBeInTheDocument();
    });

    it("elimina con confirmación y restaura desde la papelera", async () => {
        const user = userEvent.setup();
        renderAdminMangas();

        responderConfirmacion(false);
        await user.click(within(filaDe(primero.titulo)).getByRole("button", { name: "Eliminar" }));
        expect(obtenerCatalogoCompleto().some(m => m.id === primero.id)).toBe(true);

        responderConfirmacion(true);
        await user.click(within(filaDe(primero.titulo)).getByRole("button", { name: "Eliminar" }));
        expect(obtenerCatalogoCompleto().some(m => m.id === primero.id)).toBe(false);

        await user.click(within(filaDe(primero.titulo)).getByRole("button", { name: "Restaurar" }));
        expect(obtenerCatalogoCompleto().some(m => m.id === primero.id)).toBe(true);
    });
});

describe("tomos de un manga", () => {
    async function abrirTomos(user) {
        await user.click(within(filaDe(primero.titulo)).getByRole("button", { name: "Gestionar tomos" }));
        return screen.findByRole("dialog");
    }

    it("muestra una fila por tomo", async () => {
        const user = userEvent.setup();
        renderAdminMangas();

        const ventana = await abrirTomos(user);

        primero.volumenes.forEach(v => {
            expect(within(ventana).getByText(`Vol. ${v.tomo}`)).toBeInTheDocument();
        });
    });

    it("guarda el precio y el stock de un tomo", async () => {
        const user = userEvent.setup();
        renderAdminMangas();
        const ventana = await abrirTomos(user);

        const fila = within(ventana).getByText("Vol. 1").closest("tr");
        const [precio, stock] = within(fila).getAllByRole("spinbutton");
        await user.clear(precio);
        await user.type(precio, "12990");
        await user.clear(stock);
        await user.type(stock, "20");
        await user.click(within(fila).getByRole("button", { name: "Guardar" }));

        expect(obtenerVolumen(primero.id, 1)).toMatchObject({ precio: 12990, stock: 20 });
    });

    it("agrega un tomo nuevo y actualiza la cantidad en la tabla", async () => {
        const user = userEvent.setup();
        renderAdminMangas();
        const ventana = await abrirTomos(user);
        const campoTomo = nombre => ventana.querySelector(`[name="${nombre}"]`);

        await user.click(within(ventana).getByRole("button", { name: "Agregar tomo" }));
        expect(within(ventana).getByText("Precio y stock deben ser números válidos (0 o más).")).toBeInTheDocument();

        await user.type(campoTomo("precio"), "15990");
        await user.type(campoTomo("stock"), "6");
        await user.click(within(ventana).getByRole("button", { name: "Agregar tomo" }));
        expect(within(ventana).getByText("Indica la ruta de la imagen del tomo.")).toBeInTheDocument();

        await user.type(campoTomo("img"), "/Imagenes/Mangas/nuevo.jpg");
        await user.click(within(ventana).getByRole("button", { name: "Agregar tomo" }));

        const nuevoNumero = primero.volumenes.length + 1;
        expect(within(ventana).getByText(`Vol. ${nuevoNumero}`)).toBeInTheDocument();
        expect(within(filaDe(primero.titulo)).getByText(String(nuevoNumero))).toBeInTheDocument();
    });

    it("elimina un tomo después de confirmar y la ventana se puede cerrar", async () => {
        responderConfirmacion(true);
        const user = userEvent.setup();
        renderAdminMangas();
        const ventana = await abrirTomos(user);

        const fila = within(ventana).getByText("Vol. 1").closest("tr");
        await user.click(within(fila).getByRole("button", { name: "Eliminar" }));
        expect(within(ventana).queryByText("Vol. 1")).not.toBeInTheDocument();

        await user.click(within(ventana).getByRole("button", { name: "Close" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
});