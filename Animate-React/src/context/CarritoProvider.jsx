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
import { useAuth } from "./authContext";

const CARRITO_KEY = "carritoAnimate";

function leerCarritoGuardado() {
    const data = localStorage.getItem(CARRITO_KEY);
    return data ? JSON.parse(data) : [];
}

function CarritoProvider({ children }) {
    const { usuario } = useAuth();
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

           // tarjeta y direccion: las seleccionadas en el perfil (con sesión) o las que escribió el invitado
           async function finalizarCompra(tarjeta, direccion) {
               if (carrito.length === 0) {
                   alert("Tu carrito está vacío.");
                   return false;
               }

               if (!tarjeta) {
                   alert(usuario
                       ? "Selecciona o registra una tarjeta en tu perfil antes de comprar."
                       : "Debes ingresar una tarjeta para comprar.");
                   return false;
               }

               if (!direccion) {
                   alert(usuario
                       ? "Selecciona o registra una dirección de envío en tu perfil antes de comprar."
                       : "Debes ingresar una dirección de envío para comprar.");
                   return false;
               }

               try {
                   // El backend confirma precios y stock, descuenta el inventario y guarda el pedido
                   const pedido = await registrarVenta(carrito, tarjeta, direccion, Boolean(usuario));
                   // TEMPORAL: también se descuenta en el catálogo local hasta que se conecte el catálogo
                   descontarStock(carrito);
                   setCarrito([]);
                   alert("¡Gracias por tu compra! Total: " + formatearPrecio(pedido.total));
                   return true;
               } catch (error) {
                   alert(error.message);
                   return false;
               }
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