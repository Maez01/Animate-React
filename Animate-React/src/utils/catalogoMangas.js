import { api } from "../services/api";

// Catálogo público (solo mangas activos)
export function obtenerCatalogoCompleto() {
    return api("/mangas");
}

// ---------- Admin ----------
export function obtenerPapelera() {
    return api("/mangas/papelera");
}

// datos: { titulo, genero, sinopsis, imgPortada, precio, stock } -> se crea con su tomo 1
export function agregarManga(datos) {
    return api("/mangas", { metodo: "POST", cuerpo: datos });
}

export function eliminarManga(id) {
    return api(`/mangas/${id}`, { metodo: "DELETE" });
}

export function restaurarManga(id) {
    return api(`/mangas/${id}/restaurar`, { metodo: "PUT" });
}

// El número del tomo lo asigna el backend (el siguiente al mayor)
export function agregarTomo(mangaId, datos) {
    return api(`/mangas/${mangaId}/tomos`, { metodo: "POST", cuerpo: datos });
}

// Solo se elimina el último tomo, así la numeración que ven los clientes no queda con huecos
export function eliminarTomo(mangaId, tomo) {
    return api(`/mangas/${mangaId}/tomos/${tomo}`, { metodo: "DELETE" });
}

// datos: { precio, stock, img }
export function editarTomo(mangaId, tomo, datos) {
    return api(`/mangas/${mangaId}/tomos/${tomo}`, { metodo: "PUT", cuerpo: datos });
}