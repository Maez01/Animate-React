import { useState } from "react";
import { Modal } from "react-bootstrap";
import FilaTomoAdmin from "./FilaTomoAdmin";
import { agregarTomo, eliminarTomo, cambiarPrecioYStockTomo } from "../utils/catalogoMangas";

const tomoVacio = { precio: "", stock: "", img: "" };

function ModalTomosAdmin({ manga, alCerrar, alCambiar }) {
    const [nuevoTomo, setNuevoTomo] = useState(tomoVacio);
    const [error, setError] = useState("");

    function manejarCerrar() {
        setNuevoTomo(tomoVacio);
        setError("");
        alCerrar();
    }

    function manejarCambio(e) {
        setNuevoTomo({ ...nuevoTomo, [e.target.name]: e.target.value });
    }

    function manejarGuardar(tomo, precio, stock) {
        cambiarPrecioYStockTomo(manga.id, tomo, precio, stock);
        alCambiar();
    }

    function manejarEliminar(tomo) {
        if (window.confirm(`¿Eliminar el Vol. ${tomo}? (esto sí es permanente; puedes volver a agregarlo abajo)`)) {
            eliminarTomo(manga.id, tomo);
            alCambiar();
        }
    }

    function manejarAgregar(e) {
        e.preventDefault();

        const precio = Number(nuevoTomo.precio);
        const stock = Number(nuevoTomo.stock);
        const img = nuevoTomo.img.trim();

        if (nuevoTomo.precio === "" || nuevoTomo.stock === "" || precio < 0 || stock < 0 || !Number.isInteger(stock)) {
            setError("Precio y stock deben ser números válidos (0 o más).");
            return;
        }
        if (!img) {
            setError("Indica la ruta de la imagen del tomo.");
            return;
        }

        agregarTomo(manga.id, { precio, stock, img });
        setNuevoTomo(tomoVacio);
        setError("");
        alCambiar();
    }

    return (
        <Modal show={manga !== null} onHide={manejarCerrar} size="lg" centered>
            {manga && (
                <>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">Tomos de: {manga.titulo}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="table-responsive mb-4">
                            <table className="table align-middle">
                                <thead>
                                    <tr>
                                        <th>Tomo</th>
                                        <th>Precio</th>
                                        <th>Stock</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {manga.volumenes.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center text-muted">Este manga no tiene tomos.</td>
                                        </tr>
                                    )}
                                    {manga.volumenes.map(volumen => (
                                        <FilaTomoAdmin key={volumen.tomo} volumen={volumen} alGuardar={manejarGuardar} alEliminar={manejarEliminar} />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <h6 className="fw-bold">Agregar tomo nuevo</h6>
                        <form className="row g-2 align-items-end" onSubmit={manejarAgregar} noValidate>
                            <div className="col-md-4">
                                <label className="form-label">Precio</label>
                                <input type="number" min="0" className="form-control" name="precio"
                                    value={nuevoTomo.precio} onChange={manejarCambio} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Stock</label>
                                <input type="number" min="0" className="form-control" name="stock"
                                    value={nuevoTomo.stock} onChange={manejarCambio} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Imagen</label>
                                <input type="text" className="form-control" name="img" placeholder="Ej: /Imagenes/Mangas/tomo5.jpg"
                                    value={nuevoTomo.img} onChange={manejarCambio} />
                            </div>
                            <div className="col-12">
                                {error && <div className="text-danger small">{error}</div>}
                                <button type="submit" className="btn btn-primary btn-sm fw-bold mt-2">Agregar tomo</button>
                            </div>
                        </form>
                    </Modal.Body>
                </>
            )}
        </Modal>
    );
}

export default ModalTomosAdmin;