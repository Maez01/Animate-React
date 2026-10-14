import {baseDatosFiguras} from "../data/figuras";

const FIGURAS_KEY = "catalogoFiguras";
const PAPELERA_FIGURAS_KEY ="papeleraFiguras";

export function obtenerCatalogoFiguras (){
    const data = localStorage.getItem(FIGURAS_KEY);
    if (data) return JSON.parse(data);

    const copiaInicial = JSON.parse(JSON.stringify(baseDatosFiguras));
    guardarCatalogoFiguras(copiaInicial);
    return copiaInicial;
}

export function guardarCatalogoFiguras(catalogo){
    localStorage.setItem(FIGURAS_KEY, JSON.stringify(catalogo));
}

export function obtenerPapeleraFiguras (){
    const data = localStorage.getItem(PAPELERA_FIGURAS_KEY);
    return data ? JSON.parse(data): [];
}

function guardarPapeleraFiguras (lista){
    localStorage.setItem(PAPELERA_FIGURAS_KEY, JSON.stringify(lista));
}

function generarNuevoIdFigura(){
    const idsCatalogo = obtenerCatalogoFiguras().map(f=>f.id);
    const idsPapelera = obtenerPapeleraFiguras().map(f=>f.id);
    return Math.max(0, ...idsCatalogo, ...idsPapelera) + 1;
}

export function agregarFigura(datos){
    const catalogo = obtenerCatalogoFiguras();

    const nuevaFigura = {
        id: generarNuevoIdFigura(),
        nombre: datos.nombre,
        proveniencia: datos.proveniencia,
        tipoFigura: datos.tipoFigura,
        precio: datos.precio,
        stock: datos.stock,
        vistas:0,
        fechaAgregado: new Date().toISOString().slice(0,10),
        imgPortada: datos.imgPortada
    };

    catalogo.push(nuevaFigura);
    guardarCatalogoFiguras(catalogo);
    return nuevaFigura;
} 

export function eliminarFigura(id){
    const catalogo = obtenerCatalogoFiguras();
    const figura = catalogo.find(f=> f.id ===id);
    if (!figura) return;

    guardarCatalogoFiguras(catalogo.filter(f=> f.id !==id));

    const papelera = obtenerPapeleraFiguras();
    papelera.push(figura);
    guardarPapeleraFiguras(papelera);
}

export function restaurarFigura(id){
    const papelera = obtenerPapeleraFiguras();
    const figura = papelera.find(f=> f.id === id);
    if (!figura) return;

    guardarPapeleraFiguras(papelera.filter(f => f.id !== id));

    const catalogo = obtenerCatalogoFiguras();
    catalogo.push(figura);
    guardarCatalogoFiguras(catalogo);
}

export function cambiarPrecioYStockFigura(id, nuevoPrecio, nuevoStock){
    const catalogo = obtenerCatalogoFiguras();
    const figura = catalogo.find(f => f.id === id);
    if (!figura) return;

    figura.precio = nuevoPrecio;
    figura.stock = nuevoStock;
    guardarCatalogoFiguras(catalogo);
}


// Busca una figura por su id (lo usa el carrito para revisar el stock).
export function obtenerFigura(id) {
    return obtenerCatalogoFiguras().find(f => f.id === id) ?? null;
}

// Resta del stock de una figura la cantidad comprada.
export function descontarStockFigura(id, cantidad) {
    const catalogo = obtenerCatalogoFiguras();
    const figura = catalogo.find(f => f.id === id);
    if (!figura) return;

    figura.stock = Math.max(0, figura.stock - cantidad);
    guardarCatalogoFiguras(catalogo);
}