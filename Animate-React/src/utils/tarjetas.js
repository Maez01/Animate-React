import {soloLetras} from "./usuarios";

//Lectura y escritura en localStorage
const TARJETAS_KEY = "tarjetasAnimate";

function leerTodo(){
    const data = localStorage.getItem(TARJETAS_KEY);
    return data ? JSON.parse(data): {};
}

function guardarTodo(todo){
    localStorage.setItem(TARJETAS_KEY, JSON.stringify(todo))
}

function datosDe(correo){
    const todo = leerTodo();
    return todo[correo.toLowerCase()] || {lista:[], seleccionada: null};
}

function guardarDatosDe(correo, datos){
    const todo = leerTodo();
    todo[correo.toLowerCase()] = datos;
    guardarTodo(todo)
}

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

//SOLO SE GUARDAN LOS ULTIMOS 4 DIGITOS DE LA TARJETA
export function resumirTarjeta({numero,propietario}){
    const soloNumero = numero.replace(/\s/g, "");
    return {id: Date.now(), ultimos4: soloNumero.slice(-4), propietario: propietario.trim()};

}

export function textoTarjeta(tarjeta){
    return `**** **** **** ${tarjeta.ultimos4} (${tarjeta.propietario})`;
}

//TARJETAS DE EL USUARIO

export function obtenerTarjetas(correo){
    return datosDe(correo);
    return datos.lista.find(t => t.id === datos.seleccionada) || null;
}

export function obtenerSeleccionada(correo){
    const datos = datosDe(correo);
    return datos.lista.find(t => t.id === datos.seleccionada) || null;
}

export function agregarTarjeta(correo, tarjeta){
    const datos = datosDe(correo);
    datos.lista.push(tarjeta);
    if (datos.seleccionada === null) datos.seleccionada = tarjeta.id;
    guardarDatosDe(correo, datos);
}

export function eliminarTarjeta(correo, id){
    const datos = datosDe(correo);
    datos.lista = datos.lista.filyer(t => t.id !==id);
    if (datos.seleccionada === id){
        datos.seleccionada = datos.lista.length > 0 ? datos.lista[0].id : null;
    }
    guardarDatosDe(correo, datos);
}

export function seleccionarTarjeta(correo, id){
    const datos = datosDe(correo);
    datos.seleccionada = id;
    guardarDatosDe(correo,datos);
}

