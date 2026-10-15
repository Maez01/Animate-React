import { soloLetras } from "./usuarios";

const DIRECCIONES_KEY = "direccionesAnimate";

export const regiones = [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso",
    "Metropolitana de Santiago", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía",
    "Los Ríos", "Los Lagos", "Aysén", "Magallanes",
];

// ---------- Lectura y escritura en sessionStorage ----------
// Se guarda un objeto así: { "carlos@email.com": { lista: [...], seleccionada: id } }
function leerTodo() {
    const data = sessionStorage.getItem(DIRECCIONES_KEY);
    return data ? JSON.parse(data) : {};
}

function guardarTodo(todo) {
    sessionStorage.setItem(DIRECCIONES_KEY, JSON.stringify(todo));
}

function datosDe(correo) {
    const todo = leerTodo();
    return todo[correo.toLowerCase()] || { lista: [], seleccionada: null };
}

function guardarDatosDe(correo, datos) {
    const todo = leerTodo();
    todo[correo.toLowerCase()] = datos;
    guardarTodo(todo);
}

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

// ---------- Direcciones de un usuario ----------
export function obtenerDirecciones(correo) {
    return datosDe(correo).lista;
}

export function obtenerDireccionSeleccionada(correo) {
    const datos = datosDe(correo);
    return datos.lista.find(d => d.id === datos.seleccionada) || null;
}

export function agregarDireccion(correo, direccion) {
    const datos = datosDe(correo);
    datos.lista.push(direccion);
    if (datos.seleccionada === null) datos.seleccionada = direccion.id;
    guardarDatosDe(correo, datos);
}

export function eliminarDireccion(correo, id) {
    const datos = datosDe(correo);
    datos.lista = datos.lista.filter(d => d.id !== id);
    if (datos.seleccionada === id) {
        datos.seleccionada = datos.lista.length > 0 ? datos.lista[0].id : null;
    }
    guardarDatosDe(correo, datos);
}

export function seleccionarDireccion(correo, id) {
    const datos = datosDe(correo);
    datos.seleccionada = id;
    guardarDatosDe(correo, datos);
}

// Si el usuario cambia su correo, sus direcciones se mueven al correo nuevo
export function cambiarCorreoDirecciones(correoAnterior, correoNuevo) {
    const anterior = correoAnterior.toLowerCase();
    const nuevo = correoNuevo.toLowerCase();
    if (anterior === nuevo) return;

    const todo = leerTodo();
    if (!todo[anterior]) return;

    todo[nuevo] = todo[anterior];
    delete todo[anterior];
    guardarTodo(todo);
}