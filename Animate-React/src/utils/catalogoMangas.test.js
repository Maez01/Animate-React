import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../services/api";
import {
    obtenerCatalogoCompleto,
    obtenerPapelera,
    agregarManga,
    editarManga,
    eliminarManga,
    restaurarManga,
    agregarTomo,
    eliminarTomo,
    editarTomo,
} from "./catalogoMangas";

// La conexión con el backend se reemplaza por una función simulada
vi.mock("../services/api", () => ({ api: vi.fn() }));

beforeEach(() => {
    api.mockReset();
    api.mockResolvedValue({});
});

describe("lectura del catálogo de mangas", () => {
    it("obtenerCatalogoCompleto pide los mangas activos al backend", async () => {
        api.mockResolvedValue([{ id: 1, titulo: "BOCCHI THE ROCK" }]);

        expect(await obtenerCatalogoCompleto()).toEqual([{ id: 1, titulo: "BOCCHI THE ROCK" }]);
        expect(api).toHaveBeenCalledWith("/mangas");
    });

    it("obtenerPapelera pide los mangas eliminados", async () => {
        await obtenerPapelera();

        expect(api).toHaveBeenCalledWith("/mangas/papelera");
    });
});

describe("administración de mangas", () => {
    it("agregarManga envía los datos del manga y de su tomo 1", async () => {
        const datos = { titulo: "Nuevo", genero: "shonen", sinopsis: "x", imgPortada: "/a.jpg", precio: 9990, stock: 3 };

        await agregarManga(datos);

        expect(api).toHaveBeenCalledWith("/mangas", { metodo: "POST", cuerpo: datos });
    });

    it("editarManga envía los datos generales con PUT", async () => {
        const datos = { titulo: "Corregido", genero: "seinen", sinopsis: "y", imgPortada: "/b.jpg" };

        await editarManga(4, datos);

        expect(api).toHaveBeenCalledWith("/mangas/4", { metodo: "PUT", cuerpo: datos });
    });

    it("eliminarManga lo manda a la papelera y restaurarManga lo devuelve", async () => {
        await eliminarManga(4);
        await restaurarManga(4);

        expect(api).toHaveBeenNthCalledWith(1, "/mangas/4", { metodo: "DELETE" });
        expect(api).toHaveBeenNthCalledWith(2, "/mangas/4/restaurar", { metodo: "PUT" });
    });
});

describe("administración de tomos", () => {
    it("agregarTomo envía precio, stock e imagen (el número lo asigna el backend)", async () => {
        await agregarTomo(4, { precio: 9990, stock: 2, img: "/t5.jpg" });

        expect(api).toHaveBeenCalledWith("/mangas/4/tomos", { metodo: "POST", cuerpo: { precio: 9990, stock: 2, img: "/t5.jpg" } });
    });

    it("editarTomo envía precio, stock e imagen del tomo indicado", async () => {
        await editarTomo(4, 2, { precio: 12990, stock: 0, img: "/t2.jpg" });

        expect(api).toHaveBeenCalledWith("/mangas/4/tomos/2", { metodo: "PUT", cuerpo: { precio: 12990, stock: 0, img: "/t2.jpg" } });
    });

    it("eliminarTomo usa el número del tomo en la ruta", async () => {
        await eliminarTomo(4, 5);

        expect(api).toHaveBeenCalledWith("/mangas/4/tomos/5", { metodo: "DELETE" });
    });

    it("si el backend rechaza el cambio, el error llega al panel", async () => {
        api.mockRejectedValue(new Error("El precio debe ser mayor a 0"));

        await expect(editarTomo(4, 2, { precio: 0, stock: 1, img: "/t2.jpg" })).rejects.toThrow("El precio debe ser mayor a 0");
    });
});