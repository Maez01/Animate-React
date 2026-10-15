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
import { registrarVenta } from "../utils/ventas";
import { obtenerSesion } from "../utils/usuarios";
import { obtenerSeleccionada } from "../utils/tarjetas";
import { obtenerDireccionSeleccionada } from "../utils/direcciones";

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

       function finalizarCompra(tarjetaInvitado, direccionInvitado) {
           if (carrito.length === 0) {
               alert("Tu carrito está vacío.");
               return false;
           }

           const sesion = obtenerSesion();
           const tarjeta = sesion ? obtenerSeleccionada(sesion.correo) : tarjetaInvitado;
           const direccion = sesion ? obtenerDireccionSeleccionada(sesion.correo) : direccionInvitado;

           if (!tarjeta) {
               alert(sesion
                   ? "Selecciona o registra una tarjeta en tu perfil antes de comprar."
                   : "Debes ingresar una tarjeta para comprar.");
               return false;
           }

           if (!direccion) {
               alert(sesion
                   ? "Selecciona o registra una dirección de envío en tu perfil antes de comprar."
                   : "Debes ingresar una dirección de envío para comprar.");
               return false;
           }

           const total = calcularTotal(carrito);
           descontarStock(carrito);
           registrarVenta(carrito, total, sesion, tarjeta, direccion);
           setCarrito([]);
           alert("¡Gracias por tu compra! Total: " + formatearPrecio(total));
           return true;
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