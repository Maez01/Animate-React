import { api } from "../services/api";
import { textoDireccion } from "./direcciones";

// Clave única para cada compra (Idempotency-Key). Si la misma compra se envía dos veces
// (doble clic, conexión lenta), el backend reconoce la clave y no cobra ni descuenta stock otra vez.
function nuevaClaveCompra() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    // randomUUID solo existe en HTTPS o localhost; en otra dirección se arma un UUID igual de válido
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
}

// Envía la compra al backend. Solo viajan los ids y las cantidades:
// el precio y el total los calcula el backend, así nadie puede cambiarlos desde el navegador.
export function registrarVenta(carrito, tarjeta, direccion, conSesion) {
    return api(conSesion ? "/pedidos" : "/pedidos/invitado", {
        metodo: "POST",
        cabeceras: { "Idempotency-Key": nuevaClaveCompra() },
        cuerpo: {
            items: carrito.map(item => ({
                tipo: item.tipo.toUpperCase(),
                productoId: item.productoId,
                tomo: item.tipo === "manga" ? item.tomo : null,
                cantidad: item.cantidad,
            })),
            direccion: textoDireccion(direccion),
            tarjetaUltimos4: tarjeta.ultimos4,
        },
    });
}

// Compras del usuario con sesión, de la más nueva a la más antigua (PerfilUsuario)
export function obtenerMisCompras() {
    return api("/pedidos/mios");
}

// Todas las ventas; el backend solo responde si el usuario es ADMIN (PerfilAdmin)
export function obtenerVentas() {
    return api("/pedidos");
}

// Siguiente estado permitido de un pedido. El backend aplica la misma regla.
export const SIGUIENTE_ESTADO = { CONFIRMADO: "ENVIADO", ENVIADO: "ENTREGADO" };

// Solo ADMIN. Devuelve el pedido ya actualizado.
export function cambiarEstadoPedido(id, estado) {
    return api(`/pedidos/${id}/estado`, { metodo: "PUT", cuerpo: { estado } });
}

// El backend envía la fecha en formato ISO ("2026-11-15T03:44:00Z")
export function formatearFecha(fechaIso) {
    return new Date(fechaIso).toLocaleString("es-CL");
}