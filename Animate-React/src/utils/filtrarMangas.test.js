import { describe, it, expect } from "vitest";
import { filtrarMangas } from "./filtrarMangas";

const lista = [
    { titulo: "Bocchi the Rock", genero: "SLICE OF LIFE", vistas: 100, fechaAgregado: "2026-01-05" },
    { titulo: "Call of the Night", genero: "SEINEN", vistas: 300, fechaAgregado: "2026-02-28" },
    { titulo: "Ayanashi", genero: "shonen", vistas: 200, fechaAgregado: "2026-01-22" },
];

const sinFiltros = { busqueda: "", genero: "todos", orden: "predeterminado" };
const titulos = mangas => mangas.map(m => m.titulo);

describe("filtrarMangas", () => {
    it("sin filtros devuelve todos, en su orden original", () => {
        expect(titulos(filtrarMangas(lista, sinFiltros))).toEqual(["Bocchi the Rock", "Call of the Night", "Ayanashi"]);
    });

    it("la búsqueda ignora mayúsculas y espacios sobrantes", () => {
        const resultado = filtrarMangas(lista, { ...sinFiltros, busqueda: "  NIGHT " });
        expect(titulos(resultado)).toEqual(["Call of the Night"]);
    });

    it("el género coincide aunque los datos estén en mayúsculas", () => {
        expect(titulos(filtrarMangas(lista, { ...sinFiltros, genero: "seinen" }))).toEqual(["Call of the Night"]);
        expect(titulos(filtrarMangas(lista, { ...sinFiltros, genero: "shonen" }))).toEqual(["Ayanashi"]);
    });

    it("ordena por más vistos y por más recientes", () => {
        const esperado = ["Call of the Night", "Ayanashi", "Bocchi the Rock"];
        expect(titulos(filtrarMangas(lista, { ...sinFiltros, orden: "mas-vistos" }))).toEqual(esperado);
        expect(titulos(filtrarMangas(lista, { ...sinFiltros, orden: "recientes" }))).toEqual(esperado);
    });

    it("devuelve una lista vacía si nada coincide", () => {
        expect(filtrarMangas(lista, { ...sinFiltros, busqueda: "zzz" })).toEqual([]);
    });

    it("no modifica la lista original al ordenar", () => {
        filtrarMangas(lista, { ...sinFiltros, orden: "mas-vistos" });
        expect(lista[0].titulo).toBe("Bocchi the Rock");
    });
});