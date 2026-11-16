import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { editarManga } from "../utils/catalogoMangas";
import { GENEROS_MANGA } from "../utils/generosManga";

// Formulario para corregir los datos generales de un manga (los tomos se editan en "Gestionar tomos").
// AdminMangas lo monta con key={manga.id}, así cada manga abre con sus propios datos.
function ModalEditarManga({ manga, alCerrar, alGuardar }) {
    const [formulario, setFormulario] = useState({
        titulo: manga.titulo,
        genero: manga.genero.toLowerCase(),
        sinopsis: manga.sinopsis,
        imgPortada: manga.imgPortada,
    });
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);

    function manejarCambio(e) {
        setFormulario({ ...formulario, [e.target.name]: e.target.value });
    }

    async function manejarGuardar(e) {
        e.preventDefault();

        const datos = {
            titulo: formulario.titulo.trim(),
            genero: formulario.genero,
            sinopsis: formulario.sinopsis.trim(),
            imgPortada: formulario.imgPortada.trim(),
        };

        if (!datos.titulo || !datos.sinopsis || !datos.imgPortada) {
            setError("Completa todos los campos.");
            return;
        }

        setGuardando(true);
        try {
            await editarManga(manga.id, datos);
            alGuardar();
        } catch (err) {
            setError(err.message);
            setGuardando(false);
        }
    }

    return (
        <Modal show onHide={alCerrar} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fw-bold">Editar manga</Modal.Title>
            </Modal.Header>
            <Form onSubmit={manejarGuardar} noValidate>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Título</Form.Label>
                        <Form.Control name="titulo" value={formulario.titulo} onChange={manejarCambio} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Género</Form.Label>
                        <Form.Select name="genero" value={formulario.genero} onChange={manejarCambio}>
                            {GENEROS_MANGA.map(g => (
                                <option key={g.valor} value={g.valor}>{g.texto}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Sinopsis</Form.Label>
                        <Form.Control as="textarea" rows={3} name="sinopsis"
                                      value={formulario.sinopsis} onChange={manejarCambio} />
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

export default ModalEditarManga;