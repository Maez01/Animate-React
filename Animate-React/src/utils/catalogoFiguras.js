import { api } from "../services/api";

export function obtenerCatalogoFiguras() {
    return api("/figuras");
}

// ---------- Admin ----------
export function obtenerPapeleraFiguras() {
    return api("/figuras/papelera");
}

export function agregarFigura(datos) {
    return api("/figuras", { metodo: "POST", cuerpo: datos });
}

export function eliminarFigura(id) {
    return api(`/figuras/${id}`, { metodo: "DELETE" });
}

export function restaurarFigura(id) {
    return api(`/figuras/${id}/restaurar`, { metodo: "PUT" });
}

export function cambiarPrecioYStockFigura(id, precio, stock) {
    return api(`/figuras/${id}/precio-stock`, { metodo: "PUT", cuerpo: { precio, stock } });
}

// Portada primero y después el resto de la galería (no llama al backend)
export function obtenerImagenesGaleria(figura) {
    const extras = (figura.galeria || []).filter(imagen => imagen !== figura.imgPortada);
    return [figura.imgPortada, ...extras];
}

export function agregarImagenGaleria(id, ruta) {
    return api(`/figuras/${id}/galeria`, { metodo: "POST", cuerpo: { ruta } });
}

export function eliminarImagenGaleria(id, ruta) {
    return api(`/figuras/${id}/galeria?ruta=${encodeURIComponent(ruta)}`, { metodo: "DELETE" });
}