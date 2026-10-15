import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminFiguras from "./AdminFiguras";
import { baseDatosFiguras } from "../data/figuras";
import { obtenerCatalogoFiguras, obtenerFigura, obtenerImagenesGaleria } from "../utils/catalogoFiguras";

const primera = baseDatosFiguras[0];

function renderAdminFiguras() {
    const { container } = render(<AdminFiguras />);
    const campo = nombre => container.querySelector(`[name="${nombre}"]`);
    return { campo };
}

function filaDe(nombre) {
    return screen.getAllByRole("row").find(fila => within(fila).queryByText(nombre));
}

function responderConfirmacion(respuesta) {
    return vi.spyOn(window, "confirm").mockReturnValue(respuesta);
}

describe("formulario para agregar figuras", () => {
    it("muestra una fila por cada figura del catálogo", () => {
        renderAdminFiguras();

        baseDatosFiguras.forEach(figura => {
            expect(filaDe(figura.nombre)).toBeDefined();
        });
    });

    it("agrega una figura con todos sus datos y limpia el formulario", async () => {
        const user = userEvent.setup();
        const { campo } = renderAdminFiguras();

        await user.type(campo("nombre"), "Figura de prueba");
        await user.type(campo("proveniencia"), "Pruebas");
        await user.type(campo("imgPortada"), "/Imagenes/Figuras/prueba.webp");
        await user.type(campo("precio"), "50000");
        await user.type(campo("stock"), "3");
        await user.click(screen.getByRole("button", { name: "Agregar figura" }));

        expect(filaDe("Figura de prueba")).toBeDefined();
        const nueva = obtenerCatalogoFiguras().at(-1);
        expect(nueva).toMatchObject({
            nombre: "Figura de prueba",
            proveniencia: "Pruebas",
            tipoFigura: "Figura a escala",
            precio: 50000,
            stock: 3,
        });
        expect(campo("nombre")).toHaveValue("");
    });

    it("avisa si faltan textos o si el precio no es válido", async () => {
        const user = userEvent.setup();
        const { campo } = renderAdminFiguras();

        await user.click(screen.getByRole("button", { name: "Agregar figura" }));
        expect(screen.getByText("Completa todos los campos de texto.")).toBeInTheDocument();

        await user.type(campo("nombre"), "Figura");
        await user.type(campo("proveniencia"), "Pruebas");
        await user.type(campo("imgPortada"), "/x.webp");
        await user.click(screen.getByRole("button", { name: "Agregar figura" }));

        expect(screen.getByText(/precio y stock deben ser/i)).toBeInTheDocument();
        expect(obtenerCatalogoFiguras()).toHaveLength(baseDatosFiguras.length);
    });
});

describe("editar, eliminar y restaurar", () => {
    it("guarda el precio y el stock nuevos de una figura", async () => {
        const user = userEvent.setup();
        renderAdminFiguras();

        const [precio, stock] = within(filaDe(primera.nombre)).getAllByRole("spinbutton");
        await user.clear(precio);
        await user.type(precio, "99990");
        await user.clear(stock);
        await user.type(stock, "7");
        await user.click(within(filaDe(primera.nombre)).getByRole("button", { name: "Guardar" }));

        expect(obtenerFigura(primera.id)).toMatchObject({ precio: 99990, stock: 7 });
    });

    it("no guarda un stock vacío y avisa con una alerta", async () => {
        const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
        const user = userEvent.setup();
        renderAdminFiguras();

        const [, stock] = within(filaDe(primera.nombre)).getAllByRole("spinbutton");
        await user.clear(stock);
        await user.click(within(filaDe(primera.nombre)).getByRole("button", { name: "Guardar" }));

        expect(alerta).toHaveBeenCalled();
        expect(obtenerFigura(primera.id).stock).toBe(primera.stock);
    });

    it("si se cancela la confirmación, la figura no se elimina", async () => {
        responderConfirmacion(false);
        const user = userEvent.setup();
        renderAdminFiguras();

        await user.click(within(filaDe(primera.nombre)).getByRole("button", { name: "Eliminar" }));

        expect(obtenerFigura(primera.id)).not.toBeNull();
    });

    it("al confirmar va a la papelera, y desde ahí se puede restaurar", async () => {
        responderConfirmacion(true);
        const user = userEvent.setup();
        renderAdminFiguras();

        await user.click(within(filaDe(primera.nombre)).getByRole("button", { name: "Eliminar" }));
        expect(obtenerFigura(primera.id)).toBeNull();

        await user.click(within(filaDe(primera.nombre)).getByRole("button", { name: "Restaurar" }));
        expect(obtenerFigura(primera.id)).not.toBeNull();
        expect(within(filaDe(primera.nombre)).getByRole("button", { name: "Eliminar" })).toBeInTheDocument();
    });
});

describe("galería de una figura", () => {
    async function abrirGaleria(user) {
        await user.click(within(filaDe(primera.nombre)).getByRole("button", { name: "Galería" }));
        return screen.findByRole("dialog");
    }

    it("muestra todas las imágenes con la portada marcada y sin botón para quitarla", async () => {
        const user = userEvent.setup();
        renderAdminFiguras();

        const ventana = await abrirGaleria(user);

        expect(within(ventana).getAllByRole("img")).toHaveLength(obtenerImagenesGaleria(primera).length);
        expect(within(ventana).getByText("Portada")).toBeInTheDocument();
        expect(within(ventana).getAllByRole("button", { name: "Quitar" })).toHaveLength(obtenerImagenesGaleria(primera).length - 1);
    });

    it("valida la ruta y agrega una imagen nueva al final", async () => {
        const user = userEvent.setup();
        renderAdminFiguras();
        const ventana = await abrirGaleria(user);
        const ruta = within(ventana).getByPlaceholderText("Ej: /Imagenes/Figuras/foto2.webp");

        await user.click(within(ventana).getByRole("button", { name: "Agregar" }));
        expect(within(ventana).getByText("Escribe la ruta de la imagen.")).toBeInTheDocument();

        await user.type(ruta, primera.imgPortada);
        await user.click(within(ventana).getByRole("button", { name: "Agregar" }));
        expect(within(ventana).getByText("Esa imagen ya está en la galería.")).toBeInTheDocument();

        await user.clear(ruta);
        await user.type(ruta, "/Imagenes/Figuras/nueva.webp");
        await user.click(within(ventana).getByRole("button", { name: "Agregar" }));

        expect(obtenerImagenesGaleria(obtenerFigura(primera.id)).at(-1)).toBe("/Imagenes/Figuras/nueva.webp");
        expect(within(ventana).getAllByRole("img")).toHaveLength(obtenerImagenesGaleria(primera).length + 1);
    });

    it("quita una imagen extra después de confirmar", async () => {
        responderConfirmacion(true);
        const user = userEvent.setup();
        renderAdminFiguras();
        const ventana = await abrirGaleria(user);

        await user.click(within(ventana).getAllByRole("button", { name: "Quitar" })[0]);

        expect(obtenerImagenesGaleria(obtenerFigura(primera.id))).toHaveLength(obtenerImagenesGaleria(primera).length - 1);
    });
});