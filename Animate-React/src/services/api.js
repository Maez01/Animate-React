// punto de contacto entre React y el backend.
// las llamadas pasan por el api gateway (puerto 8080).

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");


// ---------- Sesión en memoria ----------

let accessToken = null;
let usuarioActual = null;
const oyentes = new Set();

function avisarCambio(){
    oyentes.forEach(oyente => oyente(usuarioActual));
}

function guardarSesionApi(sesion){
    accessToken = sesion.accessToken;
    usuarioActual = sesion.usuario;
    avisarCambio();
}

function limpiarSesionApi(){
    accessToken = null;
    usuarioActual = null;
    avisarCambio();
}

export function obtenerUsuarioActual(){
    return usuarioActual;
}

// Permite que AuthProvider se entere cuando alguien inicia o cierra sesión.
// Devuelve una función para dejar de escuchar.

export function suscribirSesion(oyente){
    oyentes.add(oyente);
    return () => oyentes.delete(oyente);
}

// ---------- Errores ----------

export class ErrorApi extends Error{
    constructor(status, mensaje, campos = {}){
    super(mensaje);
    this.name = "ErrorApi";
    this.status = status; // código HTTP
    this.campos = campos; // errores por campo
    }
}

function mensajePorEstado(status) {
    if (status === 401) return "Debes iniciar sesion";
    if (status === 403) return "No tienes permisos para realizar esta accion";
    if (status === 500) return "El servidor no esta disponible"
    return "Ocurrio un error inesperado";
}

