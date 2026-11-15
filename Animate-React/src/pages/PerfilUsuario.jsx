import { validarRegistro, confirmarContrasenia, editarMiPerfil } from "../utils/usuarios";
import { obtenerTarjetas, agregarTarjeta, eliminarTarjeta, seleccionarTarjeta, textoTarjeta } from "../utils/tarjetas";
import { obtenerDirecciones, agregarDireccion, eliminarDireccion, seleccionarDireccion, textoDireccion } from "../utils/direcciones";
import { obtenerMisCompras, formatearFecha } from "../utils/ventas";
import { useAuth } from "../context/authContext";
import { formatearPrecio } from "../utils/formatoPrecio";
import FormularioTarjeta from "../components/FormularioTarjeta";
import FormularioDireccion from "../components/FormularioDireccion";
import { Container, Card, Row, Col, Button, Modal, Form, ListGroup, Table } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";

const titulos = {
    editar: "Editar perfil",
    historial: "Historial de compras",
    tarjetas: "Mis tarjetas",
    direcciones: "Mis direcciones",
    cerrar: "¿Cerrar sesión?",
};

function Perfil() {

        const { usuario, logout, refrescarSesion } = useAuth();

        const [seccion, setSeccion] = useState(null);
        const [verificado, setVerificado] = useState(false);
        const [contraseniaIngresada, setContraseniaIngresada] = useState("");
        const [errorContrasenia, setErrorContrasenia] = useState("");
        const [datosEdit, setDatosEdit] = useState({ nombre: "", apellido: "", correo: "", contrasenia: "" });
        const [erroresEdit, setErroresEdit] = useState({});

        const [tarjetas, setTarjetas] = useState([]);
        const [direcciones, setDirecciones] = useState([]);
        const [misCompras, setMisCompras] = useState([]);
        const [errorCarga, setErrorCarga] = useState("");

        const navigate = useNavigate();

        // Al entrar al perfil se cargan tarjetas, direcciones y compras desde el backend
        useEffect(() => {
            Promise.all([obtenerTarjetas(), obtenerDirecciones(), obtenerMisCompras()])
                .then(([listaTarjetas, listaDirecciones, compras]) => {
                    setTarjetas(listaTarjetas);
                    setDirecciones(listaDirecciones);
                    setMisCompras(compras);
                })
                .catch(error => setErrorCarga(error.message));
        }, []);

        // RutaProtegida ya exige sesión; el administrador tiene su propio perfil
        if (usuario?.rol === "ADMIN") return <Navigate to="/perfil-admin" />;

        // La seleccionada viene marcada desde el backend (seleccionada: true)
        const idSeleccionada = tarjetas.find(t => t.seleccionada)?.id ?? "";
        const idDireccion = direcciones.find(d => d.seleccionada)?.id ?? "";
        const totalGastado = misCompras.reduce((suma, c) => suma + c.total, 0);

        async function manejarCerrarSesion() {
            await logout();
            navigate("/login");
        }

        // Muestra el error en un aviso si una acción con el backend falla
        async function ejecutar(accion) {
            try {
                await accion();
            } catch (error) {
                alert(error.message);
            }
        }

        // ---------- Editar perfil ----------
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

        // ---------- Tarjetas ----------
        async function recargarTarjetas() {
            setTarjetas(await obtenerTarjetas());
        }

        async function registrarTarjeta(datos) {
            await agregarTarjeta(datos);
            await recargarTarjetas();
        }

        function quitarTarjeta(id) {
            ejecutar(async () => {
                await eliminarTarjeta(id);
                await recargarTarjetas();
            });
        }

        function cambiarSeleccion(e) {
            const id = Number(e.target.value);
            ejecutar(async () => {
                await seleccionarTarjeta(id);
                await recargarTarjetas();
            });
        }

        // ---------- Direcciones ----------
        async function recargarDirecciones() {
            setDirecciones(await obtenerDirecciones());
        }

        async function registrarDireccion(datos) {
            await agregarDireccion(datos);
            await recargarDirecciones();
        }

        function quitarDireccion(id) {
            ejecutar(async () => {
                await eliminarDireccion(id);
                await recargarDirecciones();
            });
        }

        function cambiarDireccion(e) {
            const id = Number(e.target.value);
            ejecutar(async () => {
                await seleccionarDireccion(id);
                await recargarDirecciones();
            });
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
                            <h4 className="mb-0">Mi perfil</h4>
                        </div>
                        <Row>
                            <Col md={7}>
                                <p>Nombre: {usuario.nombre}</p>
                                <p>Apellido: {usuario.apellido}</p>
                                <p>Correo: {usuario.correo}</p>
                                {errorCarga && <p className="text-danger">{errorCarga}</p>}
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

                                    <Button onClick={() => setSeccion("direcciones")}>Mis direcciones</Button>
                                    <Form.Label className="mb-0 small">Dirección de envío:</Form.Label>
                                    <Form.Select value={idDireccion} onChange={cambiarDireccion}
                                                 disabled={direcciones.length === 0}>
                                        {direcciones.length === 0 ? (
                                            <option value="">Sin direcciones registradas</option>
                                        ) : (
                                            direcciones.map(d => (
                                                <option key={d.id} value={d.id}>{textoDireccion(d)}</option>
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

                    {seccion === "historial" && (
                        misCompras.length === 0 ? (
                            <p>Todavía no has realizado compras.</p>
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
                                            <th>Envío</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {misCompras.map(c => (
                                            <tr key={c.id}>
                                                <td>{c.fecha}</td><td>{formatearFecha(c.fecha)}</td>
                                                <td>
                                                    {c.productos.map((p, i) => (
                                                        <div key={i}>
                                                            {p.nombre} x{p.cantidad} ({formatearPrecio(p.precio * p.cantidad)})
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>{c.tarjeta}</td>
                                                <td>{c.direccion || "-"}</td>
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
                                                Eliminar
                                            </Button>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}

                            <h6>Registrar nueva tarjeta</h6>
                            <FormularioTarjeta alGuardar={registrarTarjeta} />
                        </>
                    )}

                    {seccion === "direcciones" && (
                        <>
                            <h6>Direcciones registradas</h6>
                            {direcciones.length === 0 ? (
                                <p>No tienes direcciones registradas.</p>
                            ) : (
                                <ListGroup className="mb-4">
                                    {direcciones.map(d => (
                                        <ListGroup.Item key={d.id} variant="dark"
                                            className="d-flex justify-content-between align-items-center gap-2">
                                            <span>
                                                {textoDireccion(d)} {d.id === idDireccion && <strong>(seleccionada)</strong>}
                                            </span>
                                            <Button variant="outline-danger" size="sm" onClick={() => quitarDireccion(d.id)}>
                                                Eliminar
                                            </Button>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}

                            <h6>Registrar nueva dirección</h6>
                            <FormularioDireccion alGuardar={registrarDireccion} />
                        </>
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

export default Perfil;