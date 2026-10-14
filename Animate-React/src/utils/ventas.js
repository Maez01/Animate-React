const VENTAS_KEY = "ventasAnimate";


export function obtenerVentas() {
    const data = localStorage.getItem(VENTAS_KEY);
    return data ? JSON.parse(data) : [];
}


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
    localStorage.setItem(VENTAS_KEY, JSON.stringify(ventas));
}