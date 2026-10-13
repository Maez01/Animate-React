import { Container, Button } from "react-bootstrap";
import BarraNavegacion from "../components/BarraNavegacion";
import Footer from "../components/Footer";
import ItemCarrito from "../components/ItemCarrito";
import { useCarrito } from "../context/carritoContext";
import { formatearPrecio } from "../utils/formatoPrecio";

function Carrito() {
    const { carrito, total, cambiarCantidad, eliminar, finalizarCompra } = useCarrito();

    return (
        <div style={{ backgroundColor: "darkgray" }}>
            <BarraNavegacion />

            <Container className="py-5">
                <div className="bg-white rounded shadow-sm p-4">
                    <h2 className="fw-bold mb-4">Tu Carrito de Compras</h2>

                    {carrito.length === 0 ? (
                        <p className="text-center opacity-75">Tu carrito está vacío.</p>
                    ) : (
                        carrito.map(item => (
                            <ItemCarrito
                                key={item.clave}
                                item={item}
                                alSumar={() => cambiarCantidad(item.clave, 1)}
                                alRestar={() => cambiarCantidad(item.clave, -1)}
                                alEliminar={() => eliminar(item.clave)}
                            />
                        ))
                    )}

                    <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-3">
                        <h5 className="fw-bold mb-0">Total: {formatearPrecio(total)}</h5>
                        <Button variant="success" className="fw-bold" onClick={finalizarCompra}>
                            Finalizar compra
                        </Button>
                    </div>
                </div>
            </Container>

            <Footer />
        </div>
    );
}

export default Carrito;