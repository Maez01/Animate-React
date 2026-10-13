import { Modal, Row, Col } from "react-bootstrap";
import TarjetaTomo from "./TarjetaTomo";

function ModalVolumenes({ manga, alCerrar, alComprar }) {
    return (
        <Modal show={manga !== null} onHide={alCerrar} size="lg" centered contentClassName="bg-dark text-white">
            {manga && (
                <>
                    <Modal.Header closeButton closeVariant="white" className="border-secondary">
                        <Modal.Title className="fw-bold">{manga.titulo}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p className="text-light opacity-75 mb-4">{manga.sinopsis}</p>
                        <h5 className="fw-bold mb-3">Tomos Disponibles:</h5>
                        <Row xs={2} sm={3} md={4} className="g-3" id="contenedor-tomos">
                            {manga.volumenes.map(vol => (
                                <Col key={vol.tomo}>
                                    <TarjetaTomo volumen={vol} alComprar={v => alComprar(manga, v)} />
                                </Col>
                            ))}
                        </Row>
                    </Modal.Body>
                </>
            )}
        </Modal>
    );
}

export default ModalVolumenes;