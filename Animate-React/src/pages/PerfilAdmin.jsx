import { validarRegistro, confirmarContrasenia, editarMiPerfil } from "../utils/usuarios";
import { obtenerVentas, formatearFecha } from "../utils/ventas";
import { formatearPrecio } from "../utils/formatoPrecio";
import { Container, Card, Row, Col, Button, Modal, Form, Table } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

function PerfilAdmin() {

        const { usuario, logout, refrescarSesion } = useAuth();
        const [ventas, setVentas] = useState([]);
        const [errorVentas, setErrorVentas] = useState("");

        const [seccion, setSeccion] = useState(null);
        const [verificado, setVerificado] = useState(false);
        const [contraseniaIngresada, setContraseniaIngresada] = useState("");
        const [errorContrasenia, setErrorContrasenia] = useState("");
        const [datosEdit, setDatosEdit] = useState({ nombre: "", apellido: "", correo: "", contrasenia: "" });
        const [erroresEdit, setErroresEdit] = useState({});

        const navigate = useNavigate();

        // Las ventas vienen del microservicio de Pedidos (GET /api/pedidos, solo ADMIN)
        useEffect(() => {
            obtenerVentas()
                .then(setVentas)
                .catch(error => setErrorVentas(error.message));
        }, []);

        // RutaProtegida ya deja entrar solo a ADMIN; los pedidos rechazados no suman al total
        const totalVendido = ventas
            .filter(v => v.estado !== "RECHAZADO")
            .reduce((suma, v) => suma + v.total, 0);

    async function manejarCerrarSesion() {
        await logout();
        navigate("/login");
    }

    async function verificarContrasenia(e) {
        e.preventDefault();

        if (contraseniaIngresada === "") {
            setErrorContrasenia("campo vacio, ingresar contraseña");
            return;
        }

        try {
            await confirmarContrasenia(usuario.correo, contraseniaIngresada);
        } catch (error) {
            setErrorContrasenia(error.status === 401 ? "Contraseña incorrecta" : error.message);
        return;
        }

        setErrorContrasenia("");
        setVerificado(true);
        setDatosEdit({
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            contrasenia: "",
            });
    }


    function cambiarCampo(e) {
        setDatosEdit({ ...datosEdit, [e.target.name]: e.target.value });
    }

    async function guardarCambios(e) {
                e.preventDefault();

                const limpios = {
                    nombre: datosEdit.nombre.trim(),
                    apellido: datosEdit.apellido.trim(),
                    correo: datosEdit.correo.trim(),
                    contrasenia: datosEdit.contrasenia === "" ? contraseniaIngresada : datosEdit.contrasenia,
                };

                const errores = validarRegistro(limpios);
                if (Object.keys(errores).length > 0) {
                    setErroresEdit(errores);
                    return;
                }

                try {
                    await editarMiPerfil({
                        nombre: limpios.nombre,
                        apellido: limpios.apellido,
                        correo: limpios.correo,
                        contraseniaActual: contraseniaIngresada,
                        contraseniaNueva: datosEdit.contrasenia === "" ? null : datosEdit.contrasenia,
                    });
                    // Pide un token nuevo para que la sesión muestre el nombre y el correo actualizados
                    await refrescarSesion();
                    cerrarModal();
                } catch (error) {
                    setErroresEdit(error.status === 409 ? { correo: error.message } : { general: error.message });
                }
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
                                {erroresEdit.general && <span className="text-danger small d-block mb-2">{erroresEdit.general}</span>}
                                <div className="d-flex justify-content-end gap-2">
                                    <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
                                    <Button type="submit">Guardar cambios</Button>
                                </div>
                            </Form>
                        )
                    )}

                    {seccion === "ventas" && (
                       errorVentas ? (
                           <p className="text-danger">{errorVentas}</p>
                                ) : ventas.length === 0 ? (
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
                                            <th>Estado</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ventas.map(v => (
                                            <tr key={v.id}>
                                                <td>{formatearFecha(v.fecha)}</td>
                                                <td>{v.comprador}</td>
                                                <td>{v.productos.map(p => `${p.nombre} x${p.cantidad}`).join(", ")}</td>
                                                <td>{v.estado}</td>
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