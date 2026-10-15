const VENTAS_KEY = "ventasAnimate";

// Devuelve todas las ventas guardadas (o una lista vacía)
export function obtenerVentas() {
    const data = sessionStorage.getItem(VENTAS_KEY);
    return data ? JSON.parse(data) : [];
}

// Devuelve solo las compras de un usuario, de la más nueva a la más antigua
export function obtenerVentasDe(correo) {
    return obtenerVentas()
        .filter(v => v.comprador.toLowerCase() === correo.toLowerCase())
        .reverse();
}

// Guarda una venta nueva con los productos del carrito y la tarjeta usada
export function registrarVenta(carrito, total, comprador, tarjeta) {
    const ventas = obtenerVentas();
    ventas.push({
        id: Date.now(),
        fecha: new Date().toLocaleString("es-CL"),
        comprador: comprador ? comprador.correo : "Invitado",
        tarjeta: `**** ${tarjeta.ultimos4}`,
        productos: carrito.map(item => ({
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio,
        })),
        total,
    });
    sessionStorage.setItem(VENTAS_KEY, JSON.stringify(ventas));
}

// Si el usuario cambia su correo, sus compras pasan al correo nuevo
export function cambiarCorreoVentas(correoAnterior, correoNuevo) {
    const ventas = obtenerVentas().map(v =>
        v.comprador.toLowerCase() === correoAnterior.toLowerCase()
            ? { ...v, comprador: correoNuevo }
            : v
    );
    sessionStorage.setItem(VENTAS_KEY, JSON.stringify(ventas));
}