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
    if (status >= 500) return "El servidor no esta disponible"
    return "Ocurrio un error inesperado";
}

function sinConexion() {
    return new ErrorApi(0,"No se pudo conectar con el servidor")

}

async function leerRespuesta(res){
    if (res.status === 204) return null;

    const texto = await res.text();
    let datos = null;
    try{
        datos = texto ? JSON.parse(texto) : null;
    } catch {
        datos = null;
    }

    if (!res.ok) {
        throw new ErrorApi(res.status, datos?.mensaje || mensajePorEstado(res.status), datos?.campos || {});
    }
    return datos;
}

// ---------- Autenticación (usa la cookie HttpOnly) ----------
async function llamarAuth(ruta, cuerpo) {
    let res;
    try{
        res = await fetch(`${API_URL}/auth/${ruta}`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", "X-Requested-With": "Animate"},
            body: cuerpo ? JSON.stringify(cuerpo): undefined,
        });
    } catch {
        throw sinConexion();
    }
    return leerRespuesta(res);
}


export async function iniciarSesion(correo, contrasenia) {
    const sesion = await llamarAuth("login", { correo, contrasenia });
    guardarSesionApi(sesion);
    return sesion.usuario;
}


// Si se piden dos renovaciones al mismo tiempo, ambas esperan la misma.
// Así la cookie no se usa dos veces (el backend la cambia en cada renovación).

let renovacionEnCurso = null;


export function renovarSesion() {
    if (!renovacionEnCurso) {
        renovacionEnCurso = llamarAuth("refresh")
        .then(sesion =>{
            guardarSesionApi(sesion);
            return sesion.usuario;
        })
        .catch(error => {
            limpiarSesionApi();
            throw error;
        })
        .finally(() =>{
            renovacionEnCurso = null;
        });
    }
    return renovacionEnCurso;
}

export async function cerrarSesionApi() {
 try {
    await llamarAuth("logout");
 } catch {
    // Aunque el backend no responda, la sesión del navegador se borra igual
 } finally {
    limpiarSesionApi();
 }
}


// ---------- Llamadas al resto de la API ----------
export async function api(ruta, { metodo = "GET", cuerpo, cabeceras = {} } = {}, reintentar = true) {
    const headers = { ...cabeceras };
    if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let res;
    try {
        res = await fetch(`${API_URL}${ruta}`, {
            method: metodo,
            headers,
            body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
        });
    } catch {
        throw sinConexion();
    }

    // El token dura 15 minutos: si venció, se renueva una vez y se repite la llamada
    if (res.status === 401 && accessToken && reintentar) {
        try {
            await renovarSesion();
        } catch {
            throw new ErrorApi(401, "Tu sesion expiro");
        }
        return api(ruta, {metodo, cuerpo, cabeceras}, false);
    }

    return leerRespuesta(res);
}















