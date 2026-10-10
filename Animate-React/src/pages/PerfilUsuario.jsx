import { obtenerUsuario, cerrarSesion } from "../utils/usuarios";
import { Container, Card, Row, Col, Button, Modal } from "react-bootstrap";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Perfil()   {

    const usuario = obtenerUsuario();

    const [seccion, setSeccion] = useState(null);

    const navigate = useNavigate();

        function manejarCerrarSesion() {
            cerrarSesion();
            navigate("/login");
        }

    return(
                                      <div className="fondo-perfil">
                                          <Container>
                                              <Card className="perfil-card">
                                                  <Card.Body>
                                                      <h4 className="mb-4">Mi perfil</h4>
                                                      {usuario ? (
                                                          <Row>
                                                              <Col md={7}>
                                                              <p>Nombre: {usuario.nombre}</p>
                                                              <p>Apellido: {usuario.apellido}</p>
                                                              <p>Correo: {usuario.correo}</p>
                                                              </Col>
                                                              <Col md={5}>
                                                                  <div className="d-grid gap-2">
                                                                      <Button onClick={() => setSeccion("editar")}>Editar perfil</Button>
                                                                      <Button onClick={() => setSeccion("historial")}>ver historial de compras</Button>
                                                                      <Button onClick={() => setSeccion("cerrar")}>Cerrar sesión</Button>
                                                                      <Modal show={seccion !==null}onHide={()=> setSeccion(null)}size="lg" centered contentClassName="perfil-modal">
                                                                          <Modal.Header closeButton closeVariant="white">
                                                                              <Modal.Title>
                                                                                  {seccion === "editar" ? "Editar perfil": seccion === "historial" ? "Historial de compras": "¿Cerrar sesión?"}
                                                                              </Modal.Title>
                                                                          </Modal.Header>

                                                                          <Modal.Body>
                                                                              {seccion === "editar" &&(
                                                                                  <p>Aquí va el contenido de editar perfil</p>
                                                                                  )}

                                                                              {seccion === "historial" &&(
                                                                                  <p>Aquí va el contenido de editar perfil</p>
                                                                              )}
                                                                               {seccion === "cerrar" && (
                                                                                   <>
                                                                                       <p>¿Seguro que quieres cerrar sesión?</p>
                                                                                       <div className="d-flex justify-content-end gap-2">
                                                                                           <Button variant="secondary" onClick={() => setSeccion(null)}>Cancelar</Button>
                                                                                           <Button variant="danger" onClick={manejarCerrarSesion}>Cerrar sesión</Button>
                                                                                       </div>
                                                                                   </>
                                                                               )}
                                                                          </Modal.Body>
                                                                      </Modal>
                                                                  </div>
                                                              </Col>
                                                          </Row>
                                                               ) : (
                                                                   <p>sesion no iniciada, borrar esto despues</p>
                                                               )}

                                                  </Card.Body>
                                              </Card>
                                          </Container>
                                      </div>
                                  );

}

export default Perfil;