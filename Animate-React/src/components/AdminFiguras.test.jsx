import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminFiguras from "./AdminFiguras";
import * as catalogo from "../utils/catalogoFiguras";

// Se simulan solo las funciones que hablan con el backend;
// obtenerImagenesGaleria se mantiene real porque solo ordena las imágenes.
vi.mock("../utils/catalogoFiguras", async importOriginal => ({
    ...(await importOriginal()),
    obtenerCatalogoFiguras: vi.fn(),
    obtenerPapeleraFiguras: vi.fn(),
    agregarFigura: vi.fn(),
    editarFigura: vi.fn(),
    eliminarFigura: vi.fn(),
    restaurarFigura: vi.fn(),
    cambiarPrecioYStockFigura: vi.fn(),
    agregarImagenGaleria: vi.fn(),
    eliminarImagenGaleria: vi.fn(),
}));

const PRECIO_INVALIDO = "El precio debe ser mayor a 0 y el stock un número entero (0 o más).";
const PORTADA = "/Imagenes/Figuras/lucia.webp";
const EXTRA = "/Imagenes/Figuras/lucia-2.webp";

// "Backend" en memoria: guarda las figuras y responde como lo haría catalogo-service
function simularBackend() {
    let figuras = [{
        id: 1,
        nombre: "Lucia Crimson Abyss",
        proveniencia: "Punishing Gray Raven",
        tipoFigura: "Figura a escala",
        stock: 2,
        precio: 127000,
        vistas: 5,
        fechaAgregado: "2026-01-10",
        imgPortada: PORTADA,
        galeria: [EXTRA],
    }];
    let papelera = [];
    let siguienteId = 2;
    const buscar = id => figuras.find(f => f.id === id);

    catalogo.obtenerCatalogoFiguras.mockImplementation(async () => structuredClone(figuras));
    catalogo.obtenerPapeleraFiguras.mockImplementation(async () => structuredClone(papelera));
    catalogo.agregarFigura.mockImplementation(async datos => {
        figuras.push({ id: siguienteId++, ...datos, vistas: 0, fechaAgregado: "2026-11-16", galeria: [] });
    });
    catalogo.editarFigura.mockImplementation(async (id, datos) => { Object.assign(buscar(id), datos); });
    catalogo.cambiarPrecioYStockFigura.mockImplementation(async (id, precio, stock) => {
        Object.assign(buscar(id), { precio, stock });
    });
    catalogo.eliminarFigura.mockImplementation(async id => {
        papelera.push(buscar(id));
        figuras = figuras.filter(f => f.id !== id);
    });
    catalogo.restaurarFigura.mockImplementation(async id => {
        figuras.push(papelera.find(f => f.id === id));
        papelera = papelera.filter(f => f.id !== id);
    });
    catalogo.agregarImagenGaleria.mockImplementation(async (id, ruta) => { buscar(id).galeria.push(ruta); });
    catalogo.eliminarImagenGaleria.mockImplementation(async (id, ruta) => {
        buscar(id).galeria = buscar(id).galeria.filter(imagen => imagen !== ruta);
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    simularBackend();
});

// Muestra el panel y espera a que lleguen los datos del "backend"
async function renderAdminFiguras() {
    const user = userEvent.setup();
    const { container } = render(<AdminFiguras />);
    await screen.findByText("Lucia Crimson Abyss");
    const campo = nombre => container.querySelector(`form [name="${nombre}"]`);
    return { user, campo };
}

function filaDe(texto) {
    return screen.getAllByRole("row").find(fila => within(fila).queryByText(texto));
}

describe("formulario para agregar figuras", () => {
    it("muestra las figuras que entrega el backend y la papelera vacía", async () => {
        await renderAdminFiguras();

        expect(within(filaDe("Lucia Crimson Abyss")).getByText("Figura a escala")).toBeInTheDocument();
        expect(screen.getByText("La papelera esta vacia")).toBeInTheDocument();
    });

    it("si el backend no responde, muestra el error", async () => {
        catalogo.obtenerCatalogoFiguras.mockRejectedValueOnce(new Error("No se pudo conectar con el servidor"));

        render(<AdminFiguras />);

        expect(await screen.findByText("No se pudo conectar con el servidor")).toBeInTheDocument();
    });

    it("agrega una figura con todos sus datos y limpia el formulario", async () => {
        const { user, campo } = await renderAdminFiguras();

        await user.type(campo("nombre"), "Nendoroid de prueba");
        await user.type(campo("proveniencia"), "Bocchi the Rock");
        await user.selectOptions(campo("tipoFigura"), "Nendoroid");
        await user.type(campo("imgPortada"), "/Imagenes/Figuras/prueba.webp");
        await user.type(campo("precio"), "45990");
        await user.type(campo("stock"), "3");
        await user.click(screen.getByRole("button", { name: "Agregar figura" }));

        expect(catalogo.agregarFigura).toHaveBeenCalledWith({
            nombre: "Nendoroid de prueba",
            proveniencia: "Bocchi the Rock",
            tipoFigura: "Nendoroid",
            imgPortada: "/Imagenes/Figuras/prueba.webp",
            precio: 45990,
            stock: 3,
        });
        expect(await screen.findByText("Nendoroid de prueba")).toBeInTheDocument();
        expect(campo("nombre")).toHaveValue("");
    });

    it("no envía nada si faltan textos o el precio es 0", async () => {
        const { user, campo } = await renderAdminFiguras();

        await user.click(screen.getByRole("button", { name: "Agregar figura" }));
        expect(screen.getByText("Completa todos los campos de texto.")).toBeInTheDocument();

        await user.type(campo("nombre"), "Figura");
        await user.type(campo("proveniencia"), "Serie");
        await user.type(campo("imgPortada"), "/x.webp");
        await user.type(campo("precio"), "0");
        await user.type(campo("stock"), "1");
        await user.click(screen.getByRole("button", { name: "Agregar figura" }));
        expect(screen.getByText(PRECIO_INVALIDO)).toBeInTheDocument();

        expect(catalogo.agregarFigura).not.toHaveBeenCalled();
    });
});

describe("precio, stock, eliminar y restaurar", () => {
    it("guarda el precio y el stock nuevos de una figura", async () => {
        const { user } = await renderAdminFiguras();
        const fila = within(filaDe("Lucia Crimson Abyss"));
        const [precio, stock] = fila.getAllByRole("spinbutton");

        await user.clear(precio);
        await user.type(precio, "99000");
        await user.clear(stock);
        await user.type(stock, "0");
        await user.click(fila.getByRole("button", { name: "Guardar" }));

        expect(catalogo.cambiarPrecioYStockFigura).toHaveBeenCalledWith(1, 99000, 0);
    });

    it("no guarda un precio 0 y avisa con una alerta", async () => {
        const { user } = await renderAdminFiguras();
        const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
        const fila = within(filaDe("Lucia Crimson Abyss"));
        const [precio] = fila.getAllByRole("spinbutton");

        await user.clear(precio);
        await user.type(precio, "0");
        await user.click(fila.getByRole("button", { name: "Guardar" }));

        expect(alerta).toHaveBeenCalledWith(PRECIO_INVALIDO);
        expect(catalogo.cambiarPrecioYStockFigura).not.toHaveBeenCalled();
    });

    it("si el backend rechaza el cambio, muestra el motivo", async () => {
        catalogo.cambiarPrecioYStockFigura.mockRejectedValueOnce(new Error("No tienes permisos para esta acción."));
        const { user } = await renderAdminFiguras();

        await user.click(within(filaDe("Lucia Crimson Abyss")).getByRole("button", { name: "Guardar" }));

        expect(await screen.findByText("No tienes permisos para esta acción.")).toBeInTheDocument();
    });

    it("elimina solo después de confirmar y luego se puede restaurar", async () => {
        const { user } = await renderAdminFiguras();
        const confirmar = vi.spyOn(window, "confirm").mockReturnValue(false);

        await user.click(within(filaDe("Lucia Crimson Abyss")).getByRole("button", { name: "Eliminar" }));
        expect(catalogo.eliminarFigura).not.toHaveBeenCalled();

        confirmar.mockReturnValue(true);
        await user.click(within(filaDe("Lucia Crimson Abyss")).getByRole("button", { name: "Eliminar" }));
        expect(catalogo.eliminarFigura).toHaveBeenCalledWith(1);

        await user.click(await screen.findByRole("button", { name: "Restaurar" }));
        expect(catalogo.restaurarFigura).toHaveBeenCalledWith(1);
        expect(await screen.findByText("La papelera esta vacia")).toBeInTheDocument();
    });
});

describe("editar una figura", () => {
    async function abrirEdicion() {
        const { user } = await renderAdminFiguras();
        await user.click(within(filaDe("Lucia Crimson Abyss")).getByRole("button", { name: "Editar" }));
        const dialogo = await screen.findByRole("dialog");
        const campo = nombre => dialogo.querySelector(`[name="${nombre}"]`);
        return { user, dialogo, campo };
    }

    it("parte con los datos actuales y reenvía precio y stock sin cambiarlos", async () => {
        const { user, dialogo, campo } = await abrirEdicion();

        expect(campo("nombre")).toHaveValue("Lucia Crimson Abyss");

        await user.clear(campo("proveniencia"));
        await user.type(campo("proveniencia"), "PGR");
        await user.selectOptions(campo("tipoFigura"), "Nendoroid");
        await user.click(within(dialogo).getByRole("button", { name: "Guardar cambios" }));

        expect(catalogo.editarFigura).toHaveBeenCalledWith(1, {
            nombre: "Lucia Crimson Abyss",
            proveniencia: "PGR",
            tipoFigura: "Nendoroid",
            imgPortada: PORTADA,
            precio: 127000,
            stock: 2,
        });
        await waitFor(() => expect(within(filaDe("Lucia Crimson Abyss")).getByText("Nendoroid")).toBeInTheDocument());
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("valida los campos vacíos y muestra el error del backend sin cerrarse", async () => {
        const { user, dialogo, campo } = await abrirEdicion();

        await user.clear(campo("nombre"));
        await user.click(within(dialogo).getByRole("button", { name: "Guardar cambios" }));
        expect(within(dialogo).getByText("Completa todos los campos.")).toBeInTheDocument();
        expect(catalogo.editarFigura).not.toHaveBeenCalled();

        catalogo.editarFigura.mockRejectedValueOnce(new Error("Ya existe una figura con ese nombre."));
        await user.type(campo("nombre"), "Repetida");
        await user.click(within(dialogo).getByRole("button", { name: "Guardar cambios" }));

        expect(await within(dialogo).findByText("Ya existe una figura con ese nombre.")).toBeInTheDocument();
    });
});

describe("galería de una figura", () => {
    async function abrirGaleria() {
        const { user } = await renderAdminFiguras();
        await user.click(within(filaDe("Lucia Crimson Abyss")).getByRole("button", { name: "Galería" }));
        const ventana = await screen.findByRole("dialog");
        return { user, ventana };
    }

    it("muestra la portada marcada y solo las imágenes extra se pueden quitar", async () => {
        const { ventana } = await abrirGaleria();

        expect(within(ventana).getAllByRole("img")).toHaveLength(2);
        expect(within(ventana).getByText("Portada")).toBeInTheDocument();
        expect(within(ventana).getAllByRole("button", { name: "Quitar" })).toHaveLength(1);
    });

    it("valida la ruta y agrega una imagen nueva", async () => {
        const { user, ventana } = await abrirGaleria();
        const ruta = within(ventana).getByPlaceholderText("Ej: /Imagenes/Figuras/foto2.webp");

        await user.click(within(ventana).getByRole("button", { name: "Agregar" }));
        expect(within(ventana).getByText("Escribe la ruta de la imagen.")).toBeInTheDocument();

        await user.type(ruta, PORTADA);
        await user.click(within(ventana).getByRole("button", { name: "Agregar" }));
        expect(within(ventana).getByText("Esa imagen ya está en la galería.")).toBeInTheDocument();

        await user.clear(ruta);
        await user.type(ruta, "/Imagenes/Figuras/nueva.webp");
        await user.click(within(ventana).getByRole("button", { name: "Agregar" }));

        expect(catalogo.agregarImagenGaleria).toHaveBeenCalledWith(1, "/Imagenes/Figuras/nueva.webp");
        await waitFor(() => expect(within(ventana).getAllByRole("img")).toHaveLength(3));
    });

    it("quita una imagen extra después de confirmar", async () => {
        const { user, ventana } = await abrirGaleria();
        vi.spyOn(window, "confirm").mockReturnValue(true);

        await user.click(within(ventana).getByRole("button", { name: "Quitar" }));

        expect(catalogo.eliminarImagenGaleria).toHaveBeenCalledWith(1, EXTRA);
        await waitFor(() => expect(within(ventana).getAllByRole("img")).toHaveLength(1));
    });
});