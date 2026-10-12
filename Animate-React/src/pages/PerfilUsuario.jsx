import { obtenerUsuario, cerrarSesion, buscarUsuario, actualizarUsuario, obtenerTodosUsuarios, validarRegistro } from "../utils/usuarios";
import { Container, Card, Row, Col, Button, Modal, Form } from "react-bootstrap";
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

    const [verificado, setVerificado] = useState(false);
    const [contraseniaIngresada, setContraseniaIngresada] = useState("");
    const [errorContrasenia, setErrorContrasenia] = useState("");
    const [datosEdit, setDatosEdit] = useState({ nombre: "", apellido: "", correo: "", contrasenia: "" });
    const [erroresEdit, setErroresEdit] = useState({});

    function verificarContasenia(e){
        e.preventDefault();

        if (contraseniaIngresada === ""){
            setErrorContrasenia("campo vacio, ingresar contraseña")
            return;
        }

        const encontrado = buscarUsuario(usuario.correo, contraseniaIngresada);
        if (!encontrado){
            setErrorContrasenia("Contraseña incorrecta");
            return;
        }

        setErrorContrasenia("");
        setVerificado(true);
        setDatosEdit({
                    nombre: encontrado.nombre,
                    apellido: encontrado.apellido,
                    correo: encontrado.correo,
                    contrasenia: "",
                });
        }

        function cambiarCampo(e) {
                setDatosEdit({ ...datosEdit, [e.target.name]: e.target.value });
            }

        function guardarCambios(e) {
                e.preventDefault();

            const limpios = {
                        nombre: datosEdit.nombre.trim(),
                        apellido: datosEdit.apellido.trim(),
                        correo: datosEdit.correo.trim(),
                        contrasenia: datosEdit.contrasenia === "" ? contraseniaIngresada : datosEdit.contrasenia,
                    };

            const otros = obtenerTodosUsuarios().filter(
                        u => u.correo.toLowerCase() !== usuario.correo.toLowerCase()
                    );

            const errores = validarRegistro(limpios, otros);
                    if (Object.keys(errores).length > 0) {
                        setErroresEdit(errores);
                        return;
                    }

            actualizarUsuario(usuario.correo, limpios);
                    cerrarModal();
        }

        function cerrarModal(){
            setSeccion(null);
            setVerificado(false);
            setContraseniaIngresada("");
            setErrorContrasenia("");
            setErroresEdit({});
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
                                                                      <Modal show={seccion !== null} onHide={cerrarModal} size="lg" centered contentClassName="perfil-modal">
                                                                          <Modal.Header closeButton closeVariant="white">
                                                                              <Modal.Title>
                                                                                  {seccion === "editar" ? "Editar perfil": seccion === "historial" ? "Historial de compras": "¿Cerrar sesión?"}
                                                                              </Modal.Title>
                                                                          </Modal.Header>

                                                                          <Modal.Body>
                                                                              {seccion === "editar" &&(
                                                                                  !verificado ?(
                                                                                      <Form onSubmit={verificarContasenia} noValidate>
                                                                                          <p>Para editar su perfil, ingrese su contraseña</p>
                                                                                          <Form.Group className="mb-3">
                                                                                              <Form.Control type="password" placeholder="ingresar contraseña"
                                                                                              value={contraseniaIngresada}
                                                                                              onChange={e => setContraseniaIngresada(e.target.value)} />
                                                                                              {errorContrasenia && <span className="error">{errorContrasenia}</span>}
                                                                                              </Form.Group>
                                                                                      <div className="d-flex justify-content-end gap-2">
                                                                                          <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
                                                                                          <Button type="submit">Verificar</Button>
                                                                                      </div>
                                                                                      </Form>
                                                                                  ):(
                                                                                      <Form onSubmit={guardarCambios} noValidate>
                                                                                          {[
                                                                                              {campo: "nombre", etiqueta: "Nombre", tipo: "text"},
                                                                                              {campo: "apellido", etiqueta: "Apellido", tipo: "text"},
                                                                                              {campo: "correo", etiqueta: "Correo", tipo: "email"},
                                                                                              {campo: "contrasenia", etiqueta: "Nueva contraseña", tipo: "password"},
                                                                                          ].map(c=>(
                                                                                              <Form.Group className="mb-3" key={c.campo}>
                                                                                                  <Form.Label> {c.etiqueta}</Form.Label>
                                                                                                  <Form.Control type={c.tipo} name={c.campo}
                                                                                                  value={datosEdit[c.campo]} onChange={cambiarCampo}
                                                                                                  placeholder={c.campo === "contrasenia" ? "dejar vacio si no desea cambiar la contraseña":""}
                                                                                                  />
                                                                                                  {erroresEdit[c.campo] && <span className="error">{erroresEdit[c.campo]}</span>}
                                                                                              </Form.Group>
                                                                                                   ))}
                                                                                               <div className="d-flex justify-content-end gap-2">
                                                                                                   <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
                                                                                                   <Button type="submit"> Guardar cambios</Button>
                                                                                               </div>
                                                                                      </Form>
                                                                                      )
                                                                                      )}

                                                                              {seccion === "historial" &&(
                                                                                  <p>Aquí va el contenido de editar perfil</p>
                                                                              )}
                                                                               {seccion === "cerrar" && (
                                                                                   <>
                                                                                       <p>¿Seguro que quieres cerrar sesión?</p>
                                                                                       <div className="d-flex justify-content-end gap-2">
                                                                                           <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
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