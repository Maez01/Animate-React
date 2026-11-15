import { api } from "../services/api";
import { soloLetras } from "./usuarios";


export const regiones = [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso",
    "Metropolitana de Santiago", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía",
    "Los Ríos", "Los Lagos", "Aysén", "Magallanes",
];

// ---------- Validación ----------
export function validarDireccion({ calle, comuna, region }) {
    const errores = {};

    if (calle.trim() === "") errores.calle = "La calle es obligatoria";
    else if (!/\d/.test(calle)) errores.calle = "Incluya el número de la dirección";

    if (comuna.trim() === "") errores.comuna = "La comuna es obligatoria";
    else if (!soloLetras.test(comuna.trim())) errores.comuna = "La comuna solo debe contener letras";

    if (region === "") errores.region = "Seleccione una región";

    return errores;
}

// Solo para la compra como invitado: la dirección no se guarda, viaja dentro del pedido
export function crearDireccion({ calle, referencia, comuna, region }) {
    return {
        id: Date.now(),
        calle: calle.trim(),
        referencia: referencia.trim(),
        comuna: comuna.trim(),
        region,
    };
}

export function textoDireccion(d) {
    const referencia = d.referencia ? `, ${d.referencia}` : "";
    return `${d.calle}${referencia}, ${d.comuna}, ${d.region}`;
}

/// ---------- Direcciones del usuario con sesión (backend) ----------
 // Cada dirección llega como { id, calle, referencia, comuna, region, seleccionada, texto }
 export function obtenerDirecciones() {
     return api("/direcciones");
 }

 export async function obtenerDireccionSeleccionada() {
     const lista = await obtenerDirecciones();
     return lista.find(d => d.seleccionada) || null;
 }

 // La primera dirección que se registra queda seleccionada automáticamente (lo hace el backend)
 export function agregarDireccion({ calle, referencia, comuna, region }) {
     return api("/direcciones", {
         metodo: "POST",
         cuerpo: { calle: calle.trim(), referencia: referencia.trim(), comuna: comuna.trim(), region },
     });
 }

 // Si se elimina la seleccionada, el backend selecciona la primera que quede
 export function eliminarDireccion(id) {
     return api(`/direcciones/${id}`, { metodo: "DELETE" });
 }

 export function seleccionarDireccion(id) {
     return api(`/direcciones/${id}/seleccionar`, { metodo: "PUT" });
 }