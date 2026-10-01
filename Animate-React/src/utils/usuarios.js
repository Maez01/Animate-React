const usuariosBase = [
    { nombre: "Ana", apellido: "Gonzales", correo: "ana@email.com", contrasenia: "admin123", rol: "Admin" },
    { nombre: "Carlos", apellido: "Calderon", correo: "carlos@email.com", contrasenia: "laraña", rol: "Usuario" },
];

const REGISTRADOS_KEY = "usuariosRegistrados";
const SESION_KEY = "usuarioActual";

// Solo letras y espacios (incluye tildes y ñ)
export const soloLetras = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/;
// Formato básico de correo
export const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// ---------- Usuarios registrados (sessionStorage) ----------
export function cargarUsuariosRegistrados() {
    const guardado = sessionStorage.getItem(REGISTRADOS_KEY);
    return guardado ? JSON.parse(guardado) : [];
}

export function guardarUsuariosRegistrados(lista) {
    sessionStorage.setItem(REGISTRADOS_KEY, JSON.stringify(lista));
}

export function obtenerTodosUsuarios() {
    return usuariosBase.concat(cargarUsuariosRegistrados());
}

// ---------- Sesión ----------
export function guardarSesion(usuario) {
    const { nombre, apellido, correo, rol } = usuario;
    sessionStorage.setItem(SESION_KEY, JSON.stringify({ nombre, apellido, correo, rol }));
}

export function obtenerSesion() {
    const data = sessionStorage.getItem(SESION_KEY);
    return data ? JSON.parse(data) : null;
}

export function cerrarSesion() {
    sessionStorage.removeItem(SESION_KEY);
}

// ---------- Validación del registro ----------
export function validarRegistro(datos, todos) {
    const { nombre, apellido, correo, contrasenia } = datos;
    const errores = {};

    if (nombre === "") errores.nombre = "El nombre es obligatorio";
    if (apellido === "") errores.apellido = "El apellido es obligatorio";
    if (correo === "") errores.correo = "El correo es obligatorio";
    if (contrasenia === "") errores.contrasenia = "La contraseña es obligatoria";
    if (Object.keys(errores).length > 0) return errores;

    if (!soloLetras.test(nombre)) errores.nombre = "El nombre solo debe contener letras";
    if (!soloLetras.test(apellido)) errores.apellido = "El apellido solo debe contener letras";
    if (!formatoCorreo.test(correo)) errores.correo = "Ingrese un correo válido";

    if (todos.some(u => u.nombre.toLowerCase() === nombre.toLowerCase()))
        errores.nombre = "Ese nombre ya está registrado";
    if (todos.some(u => u.apellido.toLowerCase() === apellido.toLowerCase()))
        errores.apellido = "Ese apellido ya está registrado";
    if (todos.some(u => u.correo.toLowerCase() === correo.toLowerCase()))
        errores.correo = "Ese correo ya está registrado";

    return errores;
}

// ---------- Registrar----------
export function registrarUsuario(datos) {
    const lista = cargarUsuariosRegistrados();
    lista.push({ ...datos, rol: "Usuario" });
    guardarUsuariosRegistrados(lista);
}

// ---------- Login ----------
export function buscarUsuario(correo, contrasenia) {
    const usuario = obtenerTodosUsuarios().find(
        u => u.correo.toLowerCase() === correo.toLowerCase() && u.contrasenia === contrasenia
    );
    return usuario || null;
}