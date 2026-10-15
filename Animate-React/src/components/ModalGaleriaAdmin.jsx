import { useState } from "react";
import { Modal } from "react-bootstrap";
import { agregarImagenGaleria, eliminarImagenGaleria, obtenerImagenesGaleria } from "../utils/catalogoFiguras";

function ModalGaleriaAdmin({ figura, alCerrar, alCambiar }) {
    const [nuevaImagen, setNuevaImagen] = useState("");
    const [error, setError] = useState("");

    const imagenes = figura ? obtenerImagenesGaleria(figura) : [];

    function manejarCerrar() {
        setNuevaImagen("");
        setError("");
        alCerrar();
    }

    function manejarAgregar(e) {
        e.preventDefault();
        const ruta = nuevaImagen.trim();

        if (!ruta) {
            setError("Escribe la ruta de la imagen.");
            return;
        }
        if (imagenes.includes(ruta)) {
            setError("Esa imagen ya está en la galería.");
            return;
        }

        agregarImagenGaleria(figura.id, ruta);
        setNuevaImagen("");
        setError("");
        alCambiar();
    }

    function manejarEliminar(ruta) {
        if (window.confirm("¿Quitar esta imagen de la galería?")) {
            eliminarImagenGaleria(figura.id, ruta);
            alCambiar();
        }
    }

    return (
        <Modal show={figura !== null} onHide={manejarCerrar} size="lg" centered>
            {figura && (
                <>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">Galería de: {figura.nombre}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="row row-cols-2 row-cols-md-4 g-3 mb-3">
                            {imagenes.map((imagen, indice) => (
                                <div className="col" key={imagen}>
                                    <div className="card h-100">
                                        <img src={imagen} alt={`Imagen ${indice + 1}`} className="card-img-top" style={{ height: "140px", objectFit: "cover" }} />
                                        <div className="card-body p-2 text-center">
                                            {indice === 0 ? (
                                                <span className="badge bg-primary">Portada</span>
                                            ) : (
                                                <button className="btn btn-outline-danger btn-sm w-100" onClick={() => manejarEliminar(imagen)}>
                                                    Quitar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="small text-muted">
                            La portada siempre aparece primero en la galería. Se cambia desde los datos de la figura, no desde aquí.
                        </p>

                        <h6 className="fw-bold">Agregar imagen</h6>
                        <form className="row g-2" onSubmit={manejarAgregar} noValidate>
                            <div className="col-md-9">
                                <input type="text" className="form-control" placeholder="Ej: /Imagenes/Figuras/foto2.webp"
                                    value={nuevaImagen} onChange={e => setNuevaImagen(e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <button type="submit" className="btn btn-primary w-100 fw-bold">Agregar</button>
                            </div>
                            {error && <div className="col-12 text-danger small">{error}</div>}
                        </form>
                    </Modal.Body>
                </>
            )}
        </Modal>
    );
}

export default ModalGaleriaAdmin;