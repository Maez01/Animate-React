
// Crea la clave única de un producto en el carrito.
// Ej: manga 1 tomo 2 -> "manga-1-2"; figura 3 -> "figura-3"
export function crearClave(tipo, id, variante) {
    return variante === undefined ? `${tipo}-${id}` : `${tipo}-${id}-${variante}`;
}

export function agregarItem(carrito, producto, stockDisponible) {
    const existente = carrito.find(p => p.clave === producto.clave);

    if (existente) {
        if (existente.cantidad >= stockDisponible) {
            return { carrito, error: "No quedan más unidades de este producto." };
        }
        const nuevoCarrito = carrito.map(p =>
            p === existente ? { ...p, cantidad: p.cantidad + 1 } : p
        );
        return { carrito: nuevoCarrito, error: null };
    }

    if (stockDisponible <= 0) {
        return { carrito, error: "Este producto no tiene stock disponible." };
    }
    return { carrito: [...carrito, { ...producto, cantidad: 1 }], error: null };
}

export function eliminarItem(carrito, clave) {
    return carrito.filter(p => p.clave !== clave);
}

export function cambiarCantidadItem(carrito, clave, delta, stockDisponible) {
    const item = carrito.find(p => p.clave === clave);
    if (!item) return { carrito, error: null };

    const nuevaCantidad = item.cantidad + delta;

    if (nuevaCantidad <= 0) {
        return { carrito: eliminarItem(carrito, clave), error: null };
    }
    if (nuevaCantidad > stockDisponible) {
        return { carrito, error: "No quedan más unidades de este producto." };
    }

    const nuevoCarrito = carrito.map(p =>
        p === item ? { ...p, cantidad: nuevaCantidad } : p
    );
    return { carrito: nuevoCarrito, error: null };
}

export function calcularTotal(carrito) {
    return carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);
}

export function contarItems(carrito) {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
}