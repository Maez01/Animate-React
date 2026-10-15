const usuariosBase = [
    { nombre: "Ana", apellido: "Gonzales", correo: "ana@email.com", contrasenia: "AdminAnimate#1", rol: "Admin" },
    { nombre: "Carlos", apellido: "Calderon", correo: "carlos@email.com", contrasenia: "Carlos#Laraña1", rol: "Usuario"},
];

const USUARIOS_KEY = "usuarios";
const SESION_KEY = "usuarioActual";

// Solo letras y espacios (incluye tildes y ñ)
export const soloLetras = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/;
// Formato básico de correo
export const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Al menos una mayúscula (incluye tildes y Ñ)
export const tieneMayuscula = /[A-ZÁÉÍÓÚÑ]/;
// Al menos un carácter especial de estos: # $ % & *
export const tieneEspecial = /[#$%&*]/;


/// ---------- Lista de usuarios (sessionStorage) ----------
 export function obtenerTodosUsuarios() {
     const guardado = sessionStorage.getItem(USUARIOS_KEY);
     return guardado ? JSON.parse(guardado) : [...usuariosBase];
 }

 function guardarTodosUsuarios(lista) {
     sessionStorage.setItem(USUARIOS_KEY, JSON.stringify(lista));
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

    if (contrasenia.length < 12)
        errores.contrasenia = "La contraseña debe tener al menos 12 caracteres";
    else if (!tieneMayuscula.test(contrasenia))
        errores.contrasenia = "La contraseña debe tener al menos una mayúscula";
    else if (!tieneEspecial.test(contrasenia))
        errores.contrasenia = "La contraseña debe tener al menos un carácter especial (# $ % & *)";

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
    const lista = obtenerTodosUsuarios();
    lista.push({ ...datos, rol: "Usuario" });
    guardarTodosUsuarios(lista);
}

// ---------- Editar perfil ----------
export function actualizarUsuario(correoActual, nuevosDatos) {
    const lista = obtenerTodosUsuarios().map(u =>
        u.correo.toLowerCase() === correoActual.toLowerCase() ? { ...u, ...nuevosDatos } : u
    );
    guardarTodosUsuarios(lista);

    const actualizado = lista.find(u => u.correo.toLowerCase() === nuevosDatos.correo.toLowerCase());
    guardarSesion(actualizado);
}

// ---------- Login ----------
export function buscarUsuario(correo, contrasenia) {
    const usuario = obtenerTodosUsuarios().find(
        u => u.correo.toLowerCase() === correo.toLowerCase() && u.contrasenia === contrasenia
    );
    return usuario || null;
}

export function obtenerUsuario() {
    const sesion = obtenerSesion();
    return sesion ? sesion : null;
}