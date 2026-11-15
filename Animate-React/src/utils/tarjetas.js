import { api } from "../services/api";
import { soloLetras } from "./usuarios";

//VALIDACION

export function validarTarjeta({numero, clave, propietario}){
    const errores = {};
    const soloNumero = numero.replace(/\s/g, "");

    if (!/^\d{16}$/.test(soloNumero)) errores.numero = "El número debe tener 16 dígitos";
    if (!/^\d{3}$/.test(clave)) errores.clave = "La clave debe tener 3 dígitos";

    if(propietario.trim()==="")errores.propietario = "El propietario es obligatorio";
    else if (!soloLetras.test(propietario.trim())) errores.propietario = "El propietario solo debe contener letras";

    return errores;
}

// Solo para la compra como invitado: deja únicamente los últimos 4 dígitos
export function resumirTarjeta({numero,propietario}){
    const soloNumero = numero.replace(/\s/g, "");
    return {id: Date.now(), ultimos4: soloNumero.slice(-4), propietario: propietario.trim()};

}

export function textoTarjeta(tarjeta){
    return `**** **** **** ${tarjeta.ultimos4} (${tarjeta.propietario})`;
}

// ---------- Tarjetas del usuario con sesión (backend) ----------
// El número completo y la clave se envían solo para validarlos: el backend guarda
// únicamente los últimos 4 dígitos. Cada tarjeta llega como { id, ultimos4, propietario, seleccionada, texto }
export function obtenerTarjetas() {
    return api("/tarjetas");
}

export async function obtenerSeleccionada() {
    const lista = await obtenerTarjetas();
    return lista.find(t => t.seleccionada) || null;
}

export function agregarTarjeta({ numero, clave, propietario }) {
    return api("/tarjetas", {
        metodo: "POST",
        cuerpo: { numero: numero.trim(), clave, propietario: propietario.trim() },
    });
}

export function eliminarTarjeta(id) {
    return api(`/tarjetas/${id}`, { metodo: "DELETE" });
}

export function seleccionarTarjeta(id) {
    return api(`/tarjetas/${id}/seleccionar`, { metodo: "PUT" });
}