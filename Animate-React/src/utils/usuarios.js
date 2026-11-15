import { api, obtenerUsuarioActual, cerrarSesionApi, iniciarSesion } from "../services/api";

// Solo letras y espacios (incluye tildes y ñ)
export const soloLetras = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/;
// Formato básico de correo
export const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Al menos una mayúscula (incluye tildes y Ñ)
export const tieneMayuscula = /[A-ZÁÉÍÓÚÑ]/;
// Al menos un carácter especial de estos: # $ % & *
export const tieneEspecial = /[#$%&*]/;

// ---------- Sesión ----------
// TEMPORAL: Admin.jsx y BarraAdmin.jsx todavía usan estas dos funciones y comparan
// el rol con "Admin". Se quitan cuando se conecte el panel de administración.
export function obtenerSesion() {
    const usuario = obtenerUsuarioActual();
    if (!usuario) return null;
    return { ...usuario, rol: usuario.rol === "ADMIN" ? "Admin" : "Usuario" };
}

export function cerrarSesion() {
    return cerrarSesionApi();
}

// ---------- Validación del registro ----------
export function validarRegistro(datos) {
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

    return errores;
}

// ---------- Registrar ----------
// El backend valida de nuevo, encripta la contraseña con BCrypt y siempre asigna el rol USUARIO
export function registrarUsuario(datos) {
    return api("/auth/registro", { metodo: "POST", cuerpo: datos });
}

// ---------- Perfil propio ----------
// Antes de editar el perfil se pide la contraseña de nuevo. La comprueba el backend
// (con el mismo login), así ninguna contraseña queda guardada en el navegador.
export async function confirmarContrasenia(correo, contrasenia) {
    await iniciarSesion(correo, contrasenia);
}

// datos: { nombre, apellido, correo, contraseniaActual, contraseniaNueva }
export function editarMiPerfil(datos) {
    return api("/usuarios/me", { metodo: "PUT", cuerpo: datos });
}