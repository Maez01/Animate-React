import { useState } from "react";
import ModalTomosAdmin from "./ModalTomosManga";
import {
    obtenerCatalogoCompleto,
    obtenerPapelera,
    agregarManga,
    eliminarManga,
    restaurarManga,
} from "../utils/catalogoMangas";

const formularioVacio = {
    titulo: "",
    genero: "shonen",
    sinopsis: "",
    imgPortada: "",
    precio: "",
    stock: "",
};

function AdminMangas() {
    const [mangas, setMangas] = useState(obtenerCatalogoCompleto());
    const [papelera, setPapelera] = useState(obtenerPapelera());
    const [formulario, setFormulario] = useState(formularioVacio);
    const [error, setError] = useState("");
    const [mangaIdAbierto, setMangaIdAbierto] = useState(null);

    const mangaAbierto = mangas.find(m => m.id === mangaIdAbierto) || null;

    function recargar() {
        setMangas(obtenerCatalogoCompleto());
        setPapelera(obtenerPapelera());
    }

    function manejarCambio(e) {
        setFormulario({ ...formulario, [e.target.name]: e.target.value });
    }

    function manejarAgregar(e) {
        e.preventDefault();

        const titulo = formulario.titulo.trim();
        const sinopsis = formulario.sinopsis.trim();
        const imgPortada = formulario.imgPortada.trim();
        const precio = Number(formulario.precio);
        const stock = Number(formulario.stock);

        if (!titulo || !sinopsis || !imgPortada) {
            setError("Completa todos los campos de texto.");
            return;
        }
        if (formulario.precio === "" || formulario.stock === "" || precio < 0 || stock < 0 || !Number.isInteger(stock)) {
            setError("Precio y stock deben ser números válidos (0 o más).");
            return;
        }

        agregarManga({ titulo, genero: formulario.genero, sinopsis, imgPortada, precio, stock });
        setFormulario(formularioVacio);
        setError("");
        recargar();
    }

    function manejarEliminar(manga) {
        if (window.confirm(`¿Eliminar "${manga.titulo}" del catálogo? (queda en la papelera, se puede restaurar)`)) {
            eliminarManga(manga.id);
            recargar();
        }
    }

    function manejarRestaurar(id) {
        restaurarManga(id);
        recargar();
    }

    return (
        <>
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="card-title fw-bold mb-3">Agregar nuevo manga</h5>
                    <form onSubmit={manejarAgregar} noValidate>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Título</label>
                                <input type="text" className="form-control" name="titulo"
                                    value={formulario.titulo} onChange={manejarCambio} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Género</label>
                                <select className="form-select" name="genero"
                                    value={formulario.genero} onChange={manejarCambio}>
                                    <option value="shonen">Shonen</option>
                                    <option value="seinen">Seinen</option>
                                    <option value="shojo">Shojo</option>
                                    <option value="slice of life">Slice of Life</option>
                                    <option value="fantasia">Fantasía</option>
                                    <option value="terror">Terror</option>
                                    <option value="josei">Josei</option>
                                    <option value="isekai">Isekai</option>
                                </select>
                            </div>
                            <div className="col-12">
                                <label className="form-label">Sinopsis</label>
                                <textarea className="form-control" rows="2" name="sinopsis"
                                    value={formulario.sinopsis} onChange={manejarCambio} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Imagen de portada (ruta)</label>
                                <input type="text" className="form-control" name="imgPortada" placeholder="Ej: /Imagenes/Mangas/nuevo-T1.jpg"
                                    value={formulario.imgPortada} onChange={manejarCambio} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Precio (tomo 1)</label>
                                <input type="number" min="0" className="form-control" name="precio"
                                    value={formulario.precio} onChange={manejarCambio} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Stock (tomo 1)</label>
                                <input type="number" min="0" className="form-control" name="stock"
                                    value={formulario.stock} onChange={manejarCambio} />
                            </div>
                        </div>
                        {error && <div className="text-danger mt-2">{error}</div>}
                        <button type="submit" className="btn btn-primary fw-bold mt-3">Agregar manga</button>
                    </form>
                </div>
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="card-title fw-bold mb-3">Mangas en el catálogo</h5>
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead>
                                <tr>
                                    <th>Portada</th>
                                    <th>Título</th>
                                    <th>Género</th>
                                    <th>Tomos</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {mangas.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted">No quedan mangas en el catálogo.</td>
                                    </tr>
                                )}
                                {mangas.map(manga => (
                                    <tr key={manga.id}>
                                        <td>
                                            <img src={manga.imgPortada} alt={manga.titulo} style={{ width: "50px", height: "65px", objectFit: "cover", borderRadius: "4px" }} />
                                        </td>
                                        <td>{manga.titulo}</td>
                                        <td className="text-uppercase small">{manga.genero}</td>
                                        <td>{manga.volumenes.length}</td>
                                        <td className="text-nowrap">
                                            <button className="btn btn-outline-primary btn-sm me-1" onClick={() => setMangaIdAbierto(manga.id)}>
                                                Gestionar tomos
                                            </button>
                                            <button className="btn btn-outline-danger btn-sm" onClick={() => manejarEliminar(manga)}>
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <h5 className="card-title fw-bold mb-3">Papelera de mangas</h5>
                    <p className="text-muted small mb-3">Los mangas eliminados quedan aquí, no se borran para siempre. Puedes restaurarlos cuando quieras.</p>
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead>
                                <tr>
                                    <th>Portada</th>
                                    <th>Título</th>
                                    <th>Género</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {papelera.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted">La papelera está vacía.</td>
                                    </tr>
                                )}
                                {papelera.map(manga => (
                                    <tr key={manga.id}>
                                        <td>
                                            <img src={manga.imgPortada} alt={manga.titulo} style={{ width: "50px", height: "65px", objectFit: "cover", borderRadius: "4px", opacity: 0.6 }} />
                                        </td>
                                        <td className="text-muted"><del>{manga.titulo}</del></td>
                                        <td className="text-muted text-uppercase small">{manga.genero}</td>
                                        <td>
                                            <button className="btn btn-outline-success btn-sm fw-bold" onClick={() => manejarRestaurar(manga.id)}>
                                                Restaurar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ModalTomosAdmin manga={mangaAbierto} alCerrar={() => setMangaIdAbierto(null)} alCambiar={recargar} />
        </>
    );
}

export default AdminMangas;