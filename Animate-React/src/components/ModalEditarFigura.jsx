import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { editarFigura } from "../utils/catalogoFiguras";
import { TIPOS_FIGURA } from "../utils/tiposFigura";

// Formulario para corregir nombre, proveniencia, tipo y portada de una figura.
// Precio y stock se cambian en la fila de la tabla; aquí se reenvían tal como están
// porque el backend pide la figura completa al editar.
// AdminFiguras lo monta con key={figura.id}, así cada figura abre con sus propios datos.
function ModalEditarFigura({ figura, alCerrar, alGuardar }) {
    const [formulario, setFormulario] = useState({
        nombre: figura.nombre,
        proveniencia: figura.proveniencia,
        tipoFigura: figura.tipoFigura,
        imgPortada: figura.imgPortada,
    });
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);

    function manejarCambio(e) {
        setFormulario({ ...formulario, [e.target.name]: e.target.value });
    }

    async function manejarGuardar(e) {
        e.preventDefault();

        const datos = {
            nombre: formulario.nombre.trim(),
            proveniencia: formulario.proveniencia.trim(),
            tipoFigura: formulario.tipoFigura,
            imgPortada: formulario.imgPortada.trim(),
            precio: figura.precio,
            stock: figura.stock,
        };

        if (!datos.nombre || !datos.proveniencia || !datos.imgPortada) {
            setError("Completa todos los campos.");
            return;
        }

        setGuardando(true);
        try {
            await editarFigura(figura.id, datos);
            alGuardar();
        } catch (err) {
            setError(err.message);
            setGuardando(false);
        }
    }

    return (
        <Modal show onHide={alCerrar} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fw-bold">Editar figura</Modal.Title>
            </Modal.Header>
            <Form onSubmit={manejarGuardar} noValidate>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control name="nombre" value={formulario.nombre} onChange={manejarCambio} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Proveniencia</Form.Label>
                        <Form.Control name="proveniencia" value={formulario.proveniencia} onChange={manejarCambio} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Tipo de figura</Form.Label>
                        <Form.Select name="tipoFigura" value={formulario.tipoFigura} onChange={manejarCambio}>
                            {TIPOS_FIGURA.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-2">
                        <Form.Label>Imagen de portada (ruta)</Form.Label>
                        <div className="d-flex align-items-center gap-2">
                            <img src={formulario.imgPortada} alt="Vista previa"
                                 style={{ width: "50px", height: "65px", objectFit: "cover", borderRadius: "4px" }} />
                            <Form.Control name="imgPortada" value={formulario.imgPortada} onChange={manejarCambio} />
                        </div>
                    </Form.Group>

                    {error && <div className="text-danger small">{error}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={alCerrar}>Cancelar</Button>
                    <Button type="submit" disabled={guardando}>
                        {guardando ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default ModalEditarFigura;