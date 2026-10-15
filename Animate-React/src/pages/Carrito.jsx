import { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Button, Modal } from "react-bootstrap";
import BarraNavegacion from "../components/BarraNavegacion";
import Footer from "../components/Footer";
import ItemCarrito from "../components/ItemCarrito";
import { useCarrito } from "../context/carritoContext";
import { formatearPrecio } from "../utils/formatoPrecio";
import FormularioTarjeta from "../components/FormularioTarjeta";
import { obtenerSesion } from "../utils/usuarios";
import { obtenerSeleccionada, resumirTarjeta, textoTarjeta } from "../utils/tarjetas";
import FormularioDireccion from "../components/FormularioDireccion";
import { obtenerDireccionSeleccionada, crearDireccion, textoDireccion } from "../utils/direcciones";

function Carrito() {
    const { carrito, total, cambiarCantidad, eliminar, finalizarCompra } = useCarrito();
    const [pedirTarjeta, setPedirTarjeta] = useState(false);
    const [direccionInvitado, setDireccionInvitado] = useState(null);

        const sesion = obtenerSesion();
        const tarjetaSeleccionada = sesion ? obtenerSeleccionada(sesion.correo) : null;
        const direccionSeleccionada = sesion ? obtenerDireccionSeleccionada(sesion.correo) : null;

        function manejarFinalizar() {
            if (carrito.length === 0) {
                alert("Tu carrito está vacío.");
                return;
            }
            if (sesion) {
                finalizarCompra();
            } else {
                setPedirTarjeta(true);
            }
        }

        function guardarDireccionInvitado(datos) {
                    setDireccionInvitado(crearDireccion(datos));
                }

                function pagarComoInvitado(datos) {
                    const listo = finalizarCompra(resumirTarjeta(datos), direccionInvitado);
                    if (listo) cerrarModalInvitado();
                }

                function cerrarModalInvitado() {
                    setPedirTarjeta(false);
                    setDireccionInvitado(null);
                }
    return (
        <div style={{ backgroundColor: "darkgray" }}>
            <BarraNavegacion />

            <Container className="py-5">
                <div className="bg-white rounded shadow-sm p-4">
                    <h2 className="fw-bold mb-4">Tu Carrito de Compras</h2>

                    {carrito.length === 0 ? (
                        <p className="text-center opacity-75">Tu carrito está vacío.</p>
                    ) : (
                        carrito.map(item => (
                            <ItemCarrito
                                key={item.clave}
                                item={item}
                                alSumar={() => cambiarCantidad(item.clave, 1)}
                                alRestar={() => cambiarCantidad(item.clave, -1)}
                                alEliminar={() => eliminar(item.clave)}
                            />
                        ))
                    )}

                    <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-3">
                        <div>
                            {sesion && (
                                <>
                                    {tarjetaSeleccionada ? (
                                        <small className="opacity-75 d-block">Se pagará con {textoTarjeta(tarjetaSeleccionada)}</small>
                                            ) : (
                                                <small className="text-danger d-block">
                                                    No tienes una tarjeta seleccionada. <Link to="/perfil">Ir a mi perfil</Link>
                                                </small>
                                                )}
                                                {direccionSeleccionada ? (
                                                    <small className="opacity-75 d-block">Se enviará a {textoDireccion(direccionSeleccionada)}</small>
                                                    ) : (
                                                    <small className="text-danger d-block">
                                                        No tienes una dirección seleccionada. <Link to="/perfil">Ir a mi perfil</Link>
                                                    </small>
                                                )}
                                </>
                            )}
                                   </div>
                                   <Button variant="success" className="fw-bold" onClick={manejarFinalizar}>
                                       Finalizar compra
                                   </Button>
                        </div>
                    </div>
            </Container>

            <Footer />
            <Modal show={pedirTarjeta} onHide={cerrarModalInvitado} centered>
                            <Modal.Header closeButton>
                                <Modal.Title>{direccionInvitado ? "Datos de pago" : "Dirección de envío"}</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                {!direccionInvitado ? (
                                    <>
                                        <p>Estás comprando como invitado. Primero ingresa la dirección a la que llegará tu pedido.</p>
                                        <FormularioDireccion
                                            alGuardar={guardarDireccionInvitado}
                                            alCancelar={cerrarModalInvitado}
                                            textoBoton="Continuar"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <p className="mb-1">Se enviará a: <strong>{textoDireccion(direccionInvitado)}</strong></p>
                                        <Button variant="link" className="p-0 mb-3" onClick={() => setDireccionInvitado(null)}>
                                            Cambiar dirección
                                        </Button>
                                        <p>
                                            Ahora ingresa los datos de tu tarjeta.
                                            Total a pagar: <strong>{formatearPrecio(total)}</strong>
                                        </p>
                                        <FormularioTarjeta
                                            alGuardar={pagarComoInvitado}
                                            alCancelar={cerrarModalInvitado}
                                            textoBoton="Pagar"
                                        />
                                    </>
                                )}
                            </Modal.Body>
                        </Modal>
        </div>
    );
}

export default Carrito;