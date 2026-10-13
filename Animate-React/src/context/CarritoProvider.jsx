import { useState, useEffect } from "react";
import { CarritoContext } from "./carritoContext";
import {
    agregarItem,
    eliminarItem,
    cambiarCantidadItem,
    calcularTotal,
    contarItems,
} from "../utils/carrito";
import { formatearPrecio } from "../utils/formatoPrecio";
import { obtenerStock, descontarStock } from "../utils/inventario";

const CARRITO_KEY = "carritoAnimate";

function leerCarritoGuardado() {
    const data = localStorage.getItem(CARRITO_KEY);
    return data ? JSON.parse(data) : [];
}

function CarritoProvider({ children }) {
    const [carrito, setCarrito] = useState(leerCarritoGuardado);

    useEffect(() => {
        localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
    }, [carrito]);

    function agregar(producto) {
        const resultado = agregarItem(carrito, producto, obtenerStock(producto));
        if (resultado.error) {
            alert(resultado.error);
            return false;
        }
        setCarrito(resultado.carrito);
        return true;
    }

    function cambiarCantidad(clave, delta) {
        const item = carrito.find(p => p.clave === clave);
        if (!item) return;
        const resultado = cambiarCantidadItem(carrito, clave, delta, obtenerStock(item));
        if (resultado.error) {
            alert(resultado.error);
            return;
        }
        setCarrito(resultado.carrito);
    }

    function eliminar(clave) {
        setCarrito(eliminarItem(carrito, clave));
    }

    function finalizarCompra() {
        if (carrito.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }
        const total = calcularTotal(carrito);
        descontarStock(carrito);
        setCarrito([]);
        alert("¡Gracias por tu compra! Total: " + formatearPrecio(total));
    }

    const valor = {
        carrito,
        agregar,
        cambiarCantidad,
        eliminar,
        finalizarCompra,
        total: calcularTotal(carrito),
        cantidadTotal: contarItems(carrito),
    };

    return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export default CarritoProvider;