import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminMangas from "./AdminMangas";
import * as catalogo from "../utils/catalogoMangas";

// Se reemplazan las funciones que hablan con el backend por funciones simuladas
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

const PRECIO_INVALIDO = "El precio debe ser mayor a 0 y el stock un número entero (0 o más).";

// "Backend" en memoria: guarda los mangas y responde como lo haría catalogo-service
function simularBackend() {
    let mangas = [{
        id: 1,
        titulo: "BOCCHI THE ROCK",
        genero: "SLICE OF LIFE",
        vistas: 10,
        fechaAgregado: "2026-01-05",
        sinopsis: "Una banda de rock",
        imgPortada: "/Imagenes/Mangas/BOCCHI-T1.jpg",
        volumenes: [
            { tomo: 1, precio: 14990, stock: 8, img: "/Imagenes/Mangas/BOCCHI-T1.jpg" },
            { tomo: 2, precio: 14990, stock: 2, img: "/Imagenes/Mangas/BR-T2.jpg" },
        ],
    }];
    let papelera = [];
    let siguienteId = 2;
    const buscar = id => mangas.find(m => m.id === id);

    catalogo.obtenerCatalogoCompleto.mockImplementation(async () => structuredClone(mangas));
    catalogo.obtenerPapelera.mockImplementation(async () => structuredClone(papelera));
    catalogo.agregarManga.mockImplementation(async datos => {
        const { precio, stock, ...generales } = datos;
        mangas.push({
            id: siguienteId++, ...generales, vistas: 0, fechaAgregado: "2026-11-16",
            volumenes: [{ tomo: 1, precio, stock, img: datos.imgPortada }],
        });
    });
    catalogo.editarManga.mockImplementation(async (id, datos) => { Object.assign(buscar(id), datos); });
    catalogo.eliminarManga.mockImplementation(async id => {
        papelera.push(buscar(id));
        mangas = mangas.filter(m => m.id !== id);
    });
    catalogo.restaurarManga.mockImplementation(async id => {
        mangas.push(papelera.find(m => m.id === id));
        papelera = papelera.filter(m => m.id !== id);
    });
    catalogo.agregarTomo.mockImplementation(async (id, datos) => {
        const manga = buscar(id);
        manga.volumenes.push({ tomo: Math.max(0, ...manga.volumenes.map(v => v.tomo)) + 1, ...datos });
    });
    catalogo.editarTomo.mockImplementation(async (id, tomo, datos) => {
        Object.assign(buscar(id).volumenes.find(v => v.tomo === tomo), datos);
    });
    catalogo.eliminarTomo.mockImplementation(async (id, tomo) => {
        const manga = buscar(id);
        manga.volumenes = manga.volumenes.filter(v => v.tomo !== tomo);
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    simularBackend();
});

// Muestra el panel y espera a que lleguen los datos del "backend"
async function renderAdminMangas() {
    const user = userEvent.setup();
    const { container } = render(<AdminMangas />);
    await screen.findByText("BOCCHI THE ROCK");
    const campo = nombre => container.querySelector(`form [name="${nombre}"]`);
    return { user, campo };
}

function filaDe(texto) {
    return screen.getAllByRole("row").find(fila => within(fila).queryByText(texto));
}

describe("mangas del catálogo", () => {
    it("muestra los mangas que entrega el backend y la papelera vacía", async () => {
        await renderAdminMangas();

        expect(within(filaDe("BOCCHI THE ROCK")).getByText("2")).toBeInTheDocument(); // cantidad de tomos
        expect(screen.getByText("La papelera está vacía.")).toBeInTheDocument();
    });

    it("si el backend no responde, muestra el error", async () => {
        catalogo.obtenerCatalogoCompleto.mockRejectedValueOnce(new Error("No se pudo conectar con el servidor"));

        render(<AdminMangas />);

        expect(await screen.findByText("No se pudo conectar con el servidor")).toBeInTheDocument();
    });

    it("agrega un manga nuevo, lo muestra en la tabla y limpia el formulario", async () => {
        const { user, campo } = await renderAdminMangas();

        await user.type(campo("titulo"), "Manga de prueba");
        await user.selectOptions(campo("genero"), "seinen");
        await user.type(campo("sinopsis"), "Una sinopsis.");
        await user.type(campo("imgPortada"), "/Imagenes/Mangas/prueba.jpg");
        await user.type(campo("precio"), "9990");
        await user.type(campo("stock"), "4");
        await user.click(screen.getByRole("button", { name: "Agregar manga" }));

        expect(catalogo.agregarManga).toHaveBeenCalledWith({
            titulo: "Manga de prueba",
            genero: "seinen",
            sinopsis: "Una sinopsis.",
            imgPortada: "/Imagenes/Mangas/prueba.jpg",
            precio: 9990,
            stock: 4,
        });
        expect(await screen.findByText("Manga de prueba")).toBeInTheDocument();
        expect(campo("titulo")).toHaveValue("");
    });

    it("no envía nada si faltan textos o el precio es 0", async () => {
        const { user, campo } = await renderAdminMangas();

        await user.click(screen.getByRole("button", { name: "Agregar manga" }));
        expect(screen.getByText("Completa todos los campos de texto.")).toBeInTheDocument();

        await user.type(campo("titulo"), "Manga");
        await user.type(campo("sinopsis"), "Sinopsis");
        await user.type(campo("imgPortada"), "/x.jpg");
        await user.type(campo("precio"), "0");
        await user.type(campo("stock"), "1");
        await user.click(screen.getByRole("button", { name: "Agregar manga" }));
        expect(screen.getByText(PRECIO_INVALIDO)).toBeInTheDocument();

        expect(catalogo.agregarManga).not.toHaveBeenCalled();
    });

    it("si el backend rechaza el manga, muestra el motivo y conserva lo escrito", async () => {
        catalogo.agregarManga.mockRejectedValueOnce(new Error("Ya existe un manga con ese título."));
        const { user, campo } = await renderAdminMangas();

        await user.type(campo("titulo"), "Repetido");
        await user.type(campo("sinopsis"), "Sinopsis");
        await user.type(campo("imgPortada"), "/x.jpg");
        await user.type(campo("precio"), "9990");
        await user.type(campo("stock"), "1");
        await user.click(screen.getByRole("button", { name: "Agregar manga" }));

        expect(await screen.findByText("Ya existe un manga con ese título.")).toBeInTheDocument();
        expect(campo("titulo")).toHaveValue("Repetido");
    });

    it("elimina solo después de confirmar y luego se puede restaurar", async () => {
        const { user } = await renderAdminMangas();
        const confirmar = vi.spyOn(window, "confirm").mockReturnValue(false);

        await user.click(within(filaDe("BOCCHI THE ROCK")).getByRole("button", { name: "Eliminar" }));
        expect(catalogo.eliminarManga).not.toHaveBeenCalled();

        confirmar.mockReturnValue(true);
        await user.click(within(filaDe("BOCCHI THE ROCK")).getByRole("button", { name: "Eliminar" }));
        expect(catalogo.eliminarManga).toHaveBeenCalledWith(1);

        await user.click(await screen.findByRole("button", { name: "Restaurar" }));
        expect(catalogo.restaurarManga).toHaveBeenCalledWith(1);
        expect(await screen.findByText("La papelera está vacía.")).toBeInTheDocument();
    });
});

describe("tomos de un manga", () => {
    async function abrirTomos() {
        const { user } = await renderAdminMangas();
        await user.click(within(filaDe("BOCCHI THE ROCK")).getByRole("button", { name: "Gestionar tomos" }));
        const dialogo = await screen.findByRole("dialog");
        const filaTomo = tomo => within(within(dialogo).getByText(`Vol. ${tomo}`).closest("tr"));
        return { user, dialogo, filaTomo };
    }

    it("muestra una fila por tomo y solo el último se puede eliminar", async () => {
        const { dialogo, filaTomo } = await abrirTomos();

        expect(within(dialogo).getByText("Tomos de: BOCCHI THE ROCK")).toBeInTheDocument();
        expect(filaTomo(1).queryByRole("button", { name: "Eliminar" })).toBeNull();
        expect(filaTomo(2).getByRole("button", { name: "Eliminar" })).toBeInTheDocument();
    });

    it("guarda el precio, el stock y la imagen de un tomo", async () => {
        const { user, filaTomo } = await abrirTomos();
        const [precio, stock] = filaTomo(1).getAllByRole("spinbutton");
        const imagen = filaTomo(1).getByRole("textbox");

        await user.clear(precio);
        await user.type(precio, "12990");
        await user.clear(stock);
        await user.type(stock, "5");
        await user.clear(imagen);
        await user.type(imagen, "/Imagenes/Mangas/nueva.jpg");
        await user.click(filaTomo(1).getByRole("button", { name: "Guardar" }));

        expect(catalogo.editarTomo).toHaveBeenCalledWith(1, 1, { precio: 12990, stock: 5, img: "/Imagenes/Mangas/nueva.jpg" });
    });

    it("no guarda un tomo con precio 0 y avisa con una alerta", async () => {
        const { user, filaTomo } = await abrirTomos();
        const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
        const [precio] = filaTomo(1).getAllByRole("spinbutton");

        await user.clear(precio);
        await user.type(precio, "0");
        await user.click(filaTomo(1).getByRole("button", { name: "Guardar" }));

        expect(alerta).toHaveBeenCalledWith(PRECIO_INVALIDO);
        expect(catalogo.editarTomo).not.toHaveBeenCalled();
    });

    it("agrega un tomo nuevo con el número siguiente y pasa a ser el último", async () => {
        const { user, dialogo, filaTomo } = await abrirTomos();
        const campoTomo = nombre => dialogo.querySelector(`form [name="${nombre}"]`);

        await user.type(campoTomo("precio"), "9990");
        await user.type(campoTomo("stock"), "3");
        await user.type(campoTomo("img"), "/Imagenes/Mangas/BR-T3.jpg");
        await user.click(within(dialogo).getByRole("button", { name: "Agregar tomo" }));

        expect(catalogo.agregarTomo).toHaveBeenCalledWith(1, { precio: 9990, stock: 3, img: "/Imagenes/Mangas/BR-T3.jpg" });
        expect(await within(dialogo).findByText("Vol. 3")).toBeInTheDocument();
        expect(filaTomo(2).queryByRole("button", { name: "Eliminar" })).toBeNull();
    });

    it("elimina el último tomo después de confirmar", async () => {
        const { user, dialogo, filaTomo } = await abrirTomos();
        vi.spyOn(window, "confirm").mockReturnValue(true);

        await user.click(filaTomo(2).getByRole("button", { name: "Eliminar" }));

        expect(catalogo.eliminarTomo).toHaveBeenCalledWith(1, 2);
        await waitFor(() => expect(within(dialogo).queryByText("Vol. 2")).toBeNull());
    });

    it("la ventana de tomos se puede cerrar", async () => {
        const { user, dialogo } = await abrirTomos();

        await user.click(within(dialogo).getByRole("button", { name: "Close" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
});

describe("editar un manga", () => {
    async function abrirEdicion() {
        const { user } = await renderAdminMangas();
        await user.click(within(filaDe("BOCCHI THE ROCK")).getByRole("button", { name: "Editar" }));
        const dialogo = await screen.findByRole("dialog");
        const campo = nombre => dialogo.querySelector(`[name="${nombre}"]`);
        return { user, dialogo, campo };
    }

    it("parte con los datos actuales, guarda los cambios y actualiza la tabla", async () => {
        const { user, dialogo, campo } = await abrirEdicion();

        expect(campo("titulo")).toHaveValue("BOCCHI THE ROCK");
        expect(campo("genero")).toHaveValue("slice of life"); // del backend llega en mayúsculas

        await user.clear(campo("titulo"));
        await user.type(campo("titulo"), "BOCCHI EDITADO");
        await user.click(within(dialogo).getByRole("button", { name: "Guardar cambios" }));

        expect(catalogo.editarManga).toHaveBeenCalledWith(1, {
            titulo: "BOCCHI EDITADO",
            genero: "slice of life",
            sinopsis: "Una banda de rock",
            imgPortada: "/Imagenes/Mangas/BOCCHI-T1.jpg",
        });
        expect(await screen.findByText("BOCCHI EDITADO")).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("valida los campos vacíos y muestra el error del backend sin cerrarse", async () => {
        const { user, dialogo, campo } = await abrirEdicion();

        await user.clear(campo("titulo"));
        await user.click(within(dialogo).getByRole("button", { name: "Guardar cambios" }));
        expect(within(dialogo).getByText("Completa todos los campos.")).toBeInTheDocument();
        expect(catalogo.editarManga).not.toHaveBeenCalled();

        catalogo.editarManga.mockRejectedValueOnce(new Error("Ya existe un manga con ese título."));
        await user.type(campo("titulo"), "OTRO");
        await user.click(within(dialogo).getByRole("button", { name: "Guardar cambios" }));

        expect(await within(dialogo).findByText("Ya existe un manga con ese título.")).toBeInTheDocument();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
});