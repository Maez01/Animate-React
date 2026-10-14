import { descontarStockFigura, obtenerFigura } from "./catalogoFiguras";
import { obtenerVolumen, descontarStockTomo } from "./catalogoMangas";

// Devuelve el stock disponible de un producto del carrito, según su tipo.
export function obtenerStock(item) {
    switch (item.tipo) {
        case "manga": {
            const volumen = obtenerVolumen(item.productoId, item.tomo);
            return volumen ? volumen.stock : 0;
        }
        case "figura":{
            const figura = obtenerFigura(item.productoId);
            return figura ? figura.stock: 0;
        }
        default:
            return 0;
    }
}

// Resta del stock lo comprado, producto por producto, según su tipo.
export function descontarStock(carrito) {
    carrito.forEach(item => {
        switch (item.tipo) {
            case "manga":
                descontarStockTomo(item.productoId, item.tomo, item.cantidad);
                break;
            case "figura":
                descontarStockFigura(item.productoId, item.cantidad);
                break;
            default:
                break;
        }
    });
}