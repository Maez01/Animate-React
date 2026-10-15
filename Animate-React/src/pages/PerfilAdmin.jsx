import { obtenerUsuario, cerrarSesion, buscarUsuario, actualizarUsuario, obtenerTodosUsuarios, validarRegistro } from "../utils/usuarios";
import { obtenerVentas } from "../utils/ventas";
import { formatearPrecio } from "../utils/formatoPrecio";
import { Container, Card, Row, Col, Button, Modal, Form, Table } from "react-bootstrap";
import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";

function PerfilAdmin() {

    const usuario = obtenerUsuario();
    const ventas = obtenerVentas();

    const [seccion, setSeccion] = useState(null);
    const [verificado, setVerificado] = useState(false);
    const [contraseniaIngresada, setContraseniaIngresada] = useState("");
    const [errorContrasenia, setErrorContrasenia] = useState("");
    const [datosEdit, setDatosEdit] = useState({ nombre: "", apellido: "", correo: "", contrasenia: "" });
    const [erroresEdit, setErroresEdit] = useState({});

    const navigate = useNavigate();

    // Sin sesión -> al login; si no es admin -> a su perfil normal
    if (!usuario) return <Navigate to="/login" />;
    if (usuario.rol !== "Admin") return <Navigate to="/perfil" />;

    const totalVendido = ventas.reduce((suma, v) => suma + v.total, 0);

    function manejarCerrarSesion() {
        cerrarSesion();
        navigate("/login");
    }

    function verificarContrasenia(e) {
        e.preventDefault();

        if (contraseniaIngresada === "") {
            setErrorContrasenia("campo vacio, ingresar contraseña");
            return;
        }

        const encontrado = buscarUsuario(usuario.correo, contraseniaIngresada);
        if (!encontrado) {
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

    function cerrarModal() {
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
                                <h4 className="mb-0">Perfil de administrador</h4>
                        </div>
                        <Row>
                            <Col md={7}>
                                <p>Nombre: {usuario.nombre}</p>
                                <p>Apellido: {usuario.apellido}</p>
                                <p>Correo: {usuario.correo}</p>
                                <p>Rol: {usuario.rol}</p>
                            </Col>
                            <Col md={5}>
                                <div className="d-grid gap-2">
                                    <Button onClick={() => setSeccion("editar")}>Editar perfil</Button>
                                    <Button onClick={() => setSeccion("ventas")}>Ver ventas realizadas</Button>
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
                    <Modal.Title>
                        {seccion === "editar" ? "Editar perfil"
                            : seccion === "ventas" ? "Ventas realizadas"
                            : "¿Cerrar sesión?"}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {seccion === "editar" && (
                        !verificado ? (
                            <Form onSubmit={verificarContrasenia} noValidate>
                                <p>Para editar su perfil, ingrese su contraseña</p>
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
                        ) : (
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

                    {seccion === "ventas" && (
                        ventas.length === 0 ? (
                            <p>Todavía no hay ventas registradas.</p>
                        ) : (
                            <>
                                <p>
                                    Ventas realizadas: {ventas.length} | Total vendido: {formatearPrecio(totalVendido)}
                                </p>
                                <Table striped bordered hover variant="dark" responsive>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Comprador</th>
                                            <th>Productos</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ventas.map(v => (
                                            <tr key={v.id}>
                                                <td>{v.fecha}</td>
                                                <td>{v.comprador}</td>
                                                <td>{v.productos.map(p => `${p.nombre} x${p.cantidad}`).join(", ")}</td>
                                                <td>{formatearPrecio(v.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </>
                        )
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
    );
}

export default PerfilAdmin;