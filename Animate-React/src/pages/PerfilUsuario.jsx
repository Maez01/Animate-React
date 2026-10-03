import { Container, Card, Row, Col, Button } from "react-bootstrap";
import { obtenerUsuario } from "../utils/usuarios";

function Perfil()   {

    const usuario = obtenerUsuario();

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
                                                                      <Button>Editar perfil</Button>
                                                                      <Button> boton2</Button>
                                                                      <Button>Cerrar sesión</Button>
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