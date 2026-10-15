import { obtenerUsuario, cerrarSesion, buscarUsuario, actualizarUsuario, obtenerTodosUsuarios, validarRegistro } from "../utils/usuarios";
import { obtenerTarjetas, obtenerSeleccionada, agregarTarjeta, eliminarTarjeta, seleccionarTarjeta, resumirTarjeta, textoTarjeta, cambiarCorreoTarjetas } from "../utils/tarjetas";
import FormularioTarjeta from "../components/FormularioTarjeta";
import { obtenerVentasDe, cambiarCorreoVentas } from "../utils/ventas";
import { formatearPrecio } from "../utils/formatoPrecio";
import { Container, Card, Row, Col, Button, Modal, Form, ListGroup, Table } from "react-bootstrap";
import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";

const titulos ={
    editar: "Editar perfil",
    historial: "Historial de compras",
    tarjetas: "Mis tarjetas",
    cerrar: "¿cerrar sesion?",
};

function Perfil()   {

    const usuario = obtenerUsuario();



    const [seccion, setSeccion] = useState(null);
    const [verificado, setVerificado] = useState(false);
    const [contraseniaIngresada, setContraseniaIngresada] = useState("");
    const [errorContrasenia, setErrorContrasenia] = useState("");
    const [datosEdit, setDatosEdit] = useState({ nombre: "", apellido: "", correo: "", contrasenia: "" });
    const [erroresEdit, setErroresEdit] = useState({});

    const [tarjetas, setTarjetas] = useState(() => usuario ? obtenerTarjetas(usuario.correo) : []);
    const [idSeleccionada, setIdSeleccionada] = useState(() => {
        const seleccionada = usuario ? obtenerSeleccionada(usuario.correo) : null;
        return seleccionada ? seleccionada.id : "";
    });

    const navigate = useNavigate();

    if (!usuario) return <Navigate to="/login" />;
    if (usuario.rol === "Admin") return <Navigate to="/perfil-admin" />;
    const misCompras = obtenerVentasDe(usuario.correo);
    const totalGastado = misCompras.reduce((suma, c) => suma + c.total, 0);

        function manejarCerrarSesion() {
            cerrarSesion();
            navigate("/login");
        }

    function verificarContrasenia(e){
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

            cambiarCorreoTarjetas(usuario.correo, limpios.correo);
                    cambiarCorreoVentas(usuario.correo, limpios.correo);
                    actualizarUsuario(usuario.correo, limpios);
                    cerrarModal();
            }

        function recargarTarjetas(){
            setTarjetas(obtenerTarjetas(usuario.correo));
            const seleccionada = obtenerSeleccionada(usuario.correo);
            setIdSeleccionada(seleccionada ? seleccionada.id : "");
        }

        function registrarTarjeta(datos){
            agregarTarjeta(usuario.correo, resumirTarjeta(datos));
            recargarTarjetas();
        }
        function quitarTarjeta(id){
                    eliminarTarjeta(usuario.correo, id);
                    recargarTarjetas();
        }

        function cambiarSeleccion(e){
            const id = Number(e.target.value);
            seleccionarTarjeta(usuario.correo, id);
            setIdSeleccionada(id);
        }

        function cerrarModal(){
            setSeccion(null);
            setVerificado(false);
            setContraseniaIngresada("");
            setErrorContrasenia("");
            setErroresEdit({});
        }




    return (
            <div className="fondo-perfil">
                <Container>
                    <Card className="perfil-card">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <Link to="/" title="Volver al inicio">
                                    <img src="/Imagenes/logo.jpg" alt="Volver al inicio" className="logo-perfil" />
                                </Link>
                                <h4 className="mb-0">Mi perfil</h4>
                                </div>
                            <Row>
                                <Col md={7}>
                                    <p>Nombre: {usuario.nombre}</p>
                                    <p>Apellido: {usuario.apellido}</p>
                                    <p>Correo: {usuario.correo}</p>
                                </Col>
                                <Col md={5}>
                                    <div className="d-grid gap-2">
                                        <Button onClick={() => setSeccion("editar")}>Editar perfil</Button>
                                        <Button onClick={() => setSeccion("historial")}>Ver historial de compras</Button>
                                        <Button onClick={() => setSeccion("tarjetas")}>Mis tarjetas</Button>

                                        <Form.Label className="mb-0 small">Tarjeta para pagar:</Form.Label>
                                        <Form.Select value={idSeleccionada} onChange={cambiarSeleccion}
                                                     disabled={tarjetas.length === 0}>
                                            {tarjetas.length === 0 ? (
                                                <option value="">Sin tarjetas registradas</option>
                                            ) : (
                                                tarjetas.map(t => (
                                                    <option key={t.id} value={t.id}>{textoTarjeta(t)}</option>
                                                ))
                                            )}
                                        </Form.Select>

                                        <Button onClick={() => setSeccion("cerrar")}>Cerrar sesión</Button>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Container>
                <Modal show={seccion !== null} onHide={cerrarModal} size={seccion === "cerrar" ? "sm" : "lg"}
                        centered scrollable contentClassName="perfil-modal">
                        <Modal.Header closeButton closeVariant="white">
                            <Modal.Title>{titulos[seccion]}</Modal.Title>
                        </Modal.Header>

                        <Modal.Body>
                            {seccion === "editar" &&(
                                !verificado ? (
                                    <Form onSubmit={verificarContrasenia} noValidate>
                                        <p>para editar su perfil ingrese su contraseña</p>
                                        <Form.Group className="mb-3">
                                            <Form.Control type="password" placeholder="ingresar contraseña"
                                                value={contraseniaIngresada}
                                                onChange={e => setContraseniaIngresada(e.target.value)} />
                                            {errorContrasenia && <span className="text-danger small d-block mt-1">{errorContrasenia}</span>}
                                        </Form.Group>

                                            <div className="d-flex justify-content-end gap-2">
                                                <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
                                                <Button type="submit">Verificar</Button>
                                            </div>
                                    </Form>
                                ):(
                                    <Form onSubmit={guardarCambios} noValidate>
                                        {[
                                            { campo: "nombre", etiqueta: "Nombre", tipo: "text" },
                                            { campo: "apellido", etiqueta: "Apellido", tipo: "text" },
                                            { campo: "correo", etiqueta: "Correo", tipo: "email" },
                                            { campo: "contrasenia", etiqueta: "Nueva contraseña", tipo: "password" },
                                        ].map(c => (
                                            <Form.Group className="mb-3" key={c.campo}>
                                                <Form.Label>{c.etiqueta}</Form.Label>
                                                <Form.Control type={c.tipo} name={c.campo}
                                                    value={datosEdit[c.campo]} onChange={cambiarCampo}
                                                    placeholder={c.campo === "contrasenia" ? "dejar vacio si no desea cambiar la contraseña" : ""} />
                                                {erroresEdit[c.campo] && <span className="text-danger small d-block mt-1">{erroresEdit[c.campo]}</span>}
                                            </Form.Group>
                                        ))}
                                        <div className="d-flex justify-content-end gap-2">
                                            <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
                                            <Button type="submit">Guardar cambios</Button>
                                        </div>
                                        </Form>
                                  )
                            )}

                            {seccion === "historial" && (
                                misCompras.length === 0 ?(
                                    <p>Todavia no has realizado compras</p>
                                ) : (
                                    <>
                                        <p>
                                            Compras realizadas: {misCompras.length} | Total gastado: {formatearPrecio(totalGastado)}
                                        </p>
                                        <Table striped bordered hover variant="dark" responsive>
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Productos</th>
                                                    <th>Tarjeta</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {misCompras.map(c => (
                                                    <tr key={c.id}>
                                                        <td>{c.fecha}</td>
                                                        <td>
                                                            {c.productos.map((p,i) => (
                                                                <div key={i}>
                                                                    {p.nombre} x{p.cantidad} ({formatearPrecio(p.precio * p.cantidad)})
                                                                </div>
                                                           ))}
                                                        </td>
                                                        <td>{c.tarjeta}</td>
                                                        <td>{formatearPrecio(c.total)}</td>
                                                    </tr>
                                               ))}
                                            </tbody>
                                        </Table>
                                    </>

                                )
                            )}

                        {seccion === "tarjetas" && (
                            <>
                                <h6>Tarjetas registradas</h6>
                                {tarjetas.length === 0 ? (
                                    <p>No tienes tarjetas registradas.</p>
                                ) : (
                                    <ListGroup className="mb-4">
                                        {tarjetas.map(t => (
                                            <ListGroup.Item key={t.id} variant="dark"
                                                className="d-flex justify-content-between align-items-center">
                                                <span>
                                                    {textoTarjeta(t)} {t.id === idSeleccionada && <strong>(seleccionada)</strong>}
                                                </span>
                                                <Button variant="outline-danger" size="sm" onClick={() => quitarTarjeta(t.id)}>
                                                    eliminar
                                                </Button>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                    )}
                                <h6>Registrar nueva tarjeta</h6>
                                        <FormularioTarjeta alGuardar={registrarTarjeta} />
                                    </>
                        )}
                        {seccion === "cerrar" && (
                            <>
                                <p> ¿seguro que quieres cerrar sesion? </p>
                                <div className="d-flex justify-content-end gap-2">
                                    <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
                                    <Button variant="danger" onClick={manejarCerrarSesion}>Cerrar sesión</Button>
                                </div>
                            </>
                        )}
                        </Modal.Body>
                    </Modal>
                </div>

    );
}

export default Perfil;