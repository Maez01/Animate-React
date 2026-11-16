import { useState, useEffect } from "react";
import FilaFiguraAdmin from "./FilaFiguraAdmin";
import ModalGaleriaAdmin from "./ModalGaleriaAdmin";
import ModalEditarFigura from "./ModalEditarFigura";
import { TIPOS_FIGURA } from "../utils/tiposFigura";
import {
    obtenerCatalogoFiguras,
    obtenerPapeleraFiguras,
    agregarFigura,
    eliminarFigura,
    restaurarFigura,
    cambiarPrecioYStockFigura,
} from "../utils/catalogoFiguras";

const formularioVacio = {
    nombre: "",
    proveniencia: "",
    tipoFigura: TIPOS_FIGURA[0],
    imgPortada: "",
    precio: "",
    stock: "",
};

function AdminFiguras(){
    const [figuras, setFiguras] = useState([]);
    const [papelera, setPapelera] = useState([]);
    const [formulario, setFormulario] = useState(formularioVacio);
    const [error, setError] = useState("");
    const [figuraIdAbierta, setFiguraIdAbierta] = useState(null);
    const [figuraEditando, setFiguraEditando] = useState(null);
    const [version, setVersion] = useState(0);
    const figuraAbierta = figuras.find(f => f.id === figuraIdAbierta) || null;

    // Cada vez que cambia "version" se vuelven a pedir las figuras y la papelera al backend
    useEffect(() => {
        Promise.all([obtenerCatalogoFiguras(), obtenerPapeleraFiguras()])
            .then(([lista, borradas]) => {
                setFiguras(lista);
                setPapelera(borradas);
            })
            .catch(err => setError(err.message));
    }, [version]);

    function recargar(){
        setVersion(v => v + 1);
    }

    // Llama al backend; si sale bien recarga la lista, si falla muestra el mensaje del backend
    async function ejecutar(accion){
        try {
            await accion();
            setError("");
            recargar();
        } catch (err) {
            setError(err.message);
        }
    }

    function manejarCambio(e){
        setFormulario({...formulario, [e.target.name]: e.target.value});
    }

    function manejarAgregar(e){
        e.preventDefault();

        const nombre = formulario.nombre.trim();
        const proveniencia = formulario.proveniencia.trim();
        const imgPortada = formulario.imgPortada.trim();
        const precio = Number(formulario.precio);
        const stock = Number(formulario.stock);

        if (!nombre || !proveniencia || !imgPortada) {
            setError("Completa todos los campos de texto.");
            return;
        }
        if (formulario.precio === "" || formulario.stock === "" || precio <= 0 || stock < 0 || !Number.isInteger(stock)){
            setError("El precio debe ser mayor a 0 y el stock un número entero (0 o más).");
            return;
        }

        ejecutar(async () => {
            await agregarFigura({nombre, proveniencia, tipoFigura: formulario.tipoFigura, imgPortada, precio, stock});
            setFormulario(formularioVacio);
        });
    }

    function manejarGuardar(id, precio, stock){
        ejecutar(() => cambiarPrecioYStockFigura(id, precio, stock));
    }

    function manejarEliminar(figura){
        if(window.confirm(`Eliminar "${figura.nombre}" del catalogo? (queda en la papelera, se puede restaurar)`)){
            ejecutar(() => eliminarFigura(figura.id));
        }
    }

    function manejarRestaurar(id){
        ejecutar(() => restaurarFigura(id));
    }

    return (
        <>
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="card-title fw-bold mb-3">Agregar nueva figura</h5>
                    <form onSubmit={manejarAgregar} noValidate>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Nombre</label>
                                <input type="text" className="form-control" name="nombre"
                                       value={formulario.nombre} onChange={manejarCambio}/>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Proveniencia</label>
                                <input type="text" className="form-control" name="proveniencia" placeholder="Ej: Punishing Gray Raven"
                                       value={formulario.proveniencia} onChange={manejarCambio}/>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Tipo de figura</label>
                                <select className="form-select" name="tipoFigura"
                                        value={formulario.tipoFigura} onChange={manejarCambio}>
                                    {TIPOS_FIGURA.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Imagen de portada</label>
                                <input type="text" className="form-control" name="imgPortada" placeholder="Ej: /Imagenes/Figuras/nueva.webp"
                                       value={formulario.imgPortada} onChange={manejarCambio}/>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Precio</label>
                                <input type="number" min="1" className="form-control" name="precio"
                                       value={formulario.precio} onChange={manejarCambio}/>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Stock</label>
                                <input type="number" min="0" className="form-control" name="stock"
                                       value={formulario.stock} onChange={manejarCambio}/>
                            </div>
                        </div>
                        {error && <div className="text-danger mt-2">{error}</div>}
                        <button type="submit" className="btn btn-primary fw-bold mt-3">Agregar figura</button>
                    </form>
                </div>
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="card-title fw-bold mb-3">Figuras en catalogo</h5>
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead>
                            <tr>
                                <th>Portada</th>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {figuras.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted">No quedan figuras en el catalogo.</td>
                                </tr>
                            )}

                            {figuras.map(figura => (
                                <FilaFiguraAdmin
                                    key={figura.id}
                                    figura={figura}
                                    alGuardar={manejarGuardar}
                                    alEliminar={manejarEliminar}
                                    alVerGaleria={f => setFiguraIdAbierta(f.id)}
                                    alEditar={setFiguraEditando}
                                />
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <h5 className="card-title fw-bold mb-3">Papelera figuras</h5>
                    <p className="text-muted small mb-3">Las figuras eliminadas quedan en la papelera, pueden ser restauradas</p>
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead>
                            <tr>
                                <th>Portada</th>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {papelera.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted">La papelera esta vacia</td>
                                </tr>
                            )}
                            {papelera.map(figura =>(
                                <tr key={figura.id}>
                                    <td>
                                        <img src={figura.imgPortada} alt={figura.nombre} style={{width:"50px", height:"65px", objectFit:"cover", borderRadius:"4px", opacity:0.6}}/>
                                    </td>
                                    <td className="text-muted"><del>{figura.nombre}</del></td>
                                    <td className="text-muted">{figura.tipoFigura}</td>
                                    <td>
                                        <button className="btn btn-outline-success btn-sm fw-bold" onClick={()=>manejarRestaurar(figura.id)}>
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

            <ModalGaleriaAdmin figura={figuraAbierta} alCerrar={() => setFiguraIdAbierta(null)} alCambiar={recargar} />

            {figuraEditando && (
                <ModalEditarFigura
                    key={figuraEditando.id}
                    figura={figuraEditando}
                    alCerrar={() => setFiguraEditando(null)}
                    alGuardar={() => {
                        setFiguraEditando(null);
                        recargar();
                    }}
                />
            )}
        </>
    )
}

export default AdminFiguras;