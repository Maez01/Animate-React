import { useState } from "react";
import { Modal } from "react-bootstrap";
import { agregarImagenGaleria, eliminarImagenGaleria } from "../utils/catalogoFiguras";

function ModalGaleriaAdmin({figura, alCerrar, alCambiar}){
    const [nuevaImagen, setNuevaImagen] = useState("");
    const [error, setError] = useState("");

    const imagenes = figura ? figura.galeria || [figura.imgPortada] : [];
    function manejarCerrar(){
        setNuevaImagen("");
        setError("");
        alCerrar();
    }

    function manejarAgregar(e){
        e.preventDefault();
        const ruta = nuevaImagen.trim();

        if(!ruta){
            setError("Escriba la ruta de la imagen");
            return;
        }
        if(imagenes.includes(ruta)){
            setError("Esa imagen ya esta en la galeria");
            return;
        }

        agregarImagenGaleria(figura.id, ruta)
        setNuevaImagen("");
        setError("");
        alCambiar();
    }

    function manejarEliminar (ruta){
        if (window.confirm("Quitar esta imagen de la galeria?")){
            eliminarImagenGaleria(figura.id, ruta);
            alCambiar();
        }
    }
    
    return(
        <Modal show={figura !== null} onHide={manejarCerrar} size="lg" centered>
            {figura && (
                <>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">Galeria de: {figura.nombre}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row row-cols-2 row-cols-md-4 g-3 mb-3">
                        {imagenes.map((imagen, indice)=> (
                            <div className="col" key={imagen}>
                                <div className="card h-100"> 
                                <img src={imagen} alt={`Imagen ${indice + 1}`} className="card-img-top" style={{height: "140px", objectFit: "cover"}}/>
                                <div className="card-body p-2 text-center">
                                    <small className="b-block text-muted mb-2">Imagen {indice +1}</small>
                                    <button className="btn btn-outline-danger btn-sm w-100"
                                    onClick={()=> manejarEliminar(imagen)} disabled={imagenes.length===1}>
                                        Quitar
                                    </button>
                                </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {imagenes.length===1 && (
                        <p className="small text-muted">La galeria debe tener al menos una imagen</p>
                    )}

                    <h6 className="fw-bold">Agregar imagen</h6>
                    <form className="row g-2" onSubmit={manejarAgregar} noValidate>
                        <div className="col-md-9">
                            <input type="text" className="form-control" placeholder="EJ: /imagenes/figuras/blablabla.jpge"
                            value={nuevaImagen} onChange={e=>setNuevaImagen(e.target.value)}/>
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