import { useState } from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { formatearPrecio } from "../utils/carrito";

function TarjetaTomo({ volumen, alComprar }) {
    const [agregado, setAgregado] = useState(false);
    const sinStock = volumen.stock === 0;

    function manejarCompra() {
        if (alComprar(volumen)) {
            setAgregado(true);
            setTimeout(() => setAgregado(false), 1200);
        }
    }

    return (
        <Card className="h-100 bg-secondary bg-opacity-25 border-secondary text-center p-2 text-white">
            <Card.Img
                src={volumen.img}
                alt={`Tomo ${volumen.tomo}`}
                className="rounded"
                style={{ height: 150, objectFit: "cover" }}
            />
            <Card.Body className="p-1 d-flex flex-column justify-content-between">
                <Card.Title as="h6" className="my-1">Vol. {volumen.tomo}</Card.Title>
                <p className="text-warning mb-1 fw-bold">{formatearPrecio(volumen.precio)}</p>
                <p className="mb-1">
                    <Badge bg={sinStock ? "danger" : "success"}>
                        {sinStock ? "Agotado" : `Stock: ${volumen.stock} u.`}
                    </Badge>
                </p>
                <Button
                    variant="warning"
                    size="sm"
                    className="mt-2 fw-bold w-100"
                    disabled={sinStock}
                    onClick={manejarCompra}
                >
                    {sinStock ? "Sin stock" : agregado ? "Agregado ✓" : "Comprar"}
                </Button>
            </Card.Body>
        </Card>
    );
}

export default TarjetaTomo;