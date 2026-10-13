import { Button } from "react-bootstrap";
import { formatearPrecio } from "../utils/formatoPrecio";

const estiloBotonCantidad = { width: 34, height: 34, padding: 0, lineHeight: 1 };

function ItemCarrito({ item, alSumar, alRestar, alEliminar }) {
    return (
        <div className="d-flex align-items-center gap-3 border-bottom border-secondary py-3">
            <img
                src={item.img}
                alt={item.nombre}
                style={{ width: 60, height: 84, objectFit: "cover", borderRadius: 6 }}
            />
            <div className="flex-grow-1">
                <p className="mb-1 fw-bold">{item.nombre}</p>
                <p className="mb-1 opacity-75">{formatearPrecio(item.precio)} c/u</p>
                <div className="d-flex align-items-center gap-2">
                    <Button variant="outline-secondary" className="fw-bold" style={estiloBotonCantidad} onClick={alRestar}>
                        −
                    </Button>
                    <span className="fw-bold fs-5 mx-1">{item.cantidad}</span>
                    <Button variant="outline-secondary" className="fw-bold" style={estiloBotonCantidad} onClick={alSumar}>
                        +
                    </Button>
                </div>
            </div>
            <div className="text-end">
                <p className="fw-bold mb-2">{formatearPrecio(item.precio * item.cantidad)}</p>
                <Button variant="outline-danger" size="sm" onClick={alEliminar}>
                    Eliminar
                </Button>
            </div>
        </div>
    );
}

export default ItemCarrito;