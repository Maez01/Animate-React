import { formatearPrecio } from "../utils/formatoPrecio";
import { useState } from "react";
import { Carousel, Modal } from "react-bootstrap";

function TarjetaFigura({ figura, alComprar }) {
    const sinStock = figura.stock === 0;
    const [verImagen, setVerImagen] = useState(false);
    const [agregado, setAgregado] = useState(false);
    const imagenes = figura.galeria || [figura.imgPortada];
    const variasImagenes = imagenes.length > 1;

    function manejarCompra() {
        if (alComprar(figura)) {
            setAgregado(true);
            setTimeout(() => setAgregado(false), 1200);
        }
    }

    let textoBoton = "Agregar al carrito";
    if (sinStock) textoBoton = "Sin stock";
    else if (agregado) textoBoton = "Agregado ✓";

    return (
        <div className="col">
            <div className="card card-producto h-100 shadow border-0">
                <img src={figura.imgPortada}
                    className="card-img-top"
                    style={{ height: "280px", objectFit: "cover", cursor: "zoom-in" }}
                    alt={figura.nombre}
                    onClick={() => setVerImagen(true)}
                />
                <div className="card-body d-flex flex-column">
                    <span className="badge bg-secondary align-self-start mb-2 text-uppercase">{figura.tipoFigura}</span>
                    <h5 className="card-title fw-bold text-dark">{figura.nombre}</h5>
                    <p className="card-text text-muted small mb-2">{figura.proveniencia}</p>
                    <p className="fw-bold fs-5 mb-1 mt-auto">{formatearPrecio(figura.precio)}</p>
                    <p className="mb-0">
                        <span className={sinStock ? "badge bg-danger" : "badge bg-success"}>
                            {sinStock ? "Agotado" : `Stock: ${figura.stock} u.`}
                        </span>
                    </p>
                    <button className="btn btn-primary w-100 fw-bold mt-3" onClick={manejarCompra} disabled={sinStock}>
                        {textoBoton}
                    </button>
                </div>
            </div>
            <Modal show={verImagen} onHide={() => setVerImagen(false)} size="lg" centered contentClassName="bg-dark text-white">
                <Modal.Header closeButton closeVariant="white" className="border-secondary">
                    <Modal.Title>{figura.nombre}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Carousel interval={null} controls={variasImagenes} indicators={variasImagenes}>
                        {imagenes.map((imagen, indice) => (
                            <Carousel.Item key={imagen}>
                                <img src={imagen} alt={`${figura.nombre} - imagen ${indice + 1}`} className="d-block w-100 rounded" style={{ height: "70vh", objectFit: "contain" }} />
                            </Carousel.Item>
                        ))}
                    </Carousel>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default TarjetaFigura;