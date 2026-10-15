import { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import { validarDireccion, regiones } from "../utils/direcciones";

const vacio = { calle: "", referencia: "", comuna: "", region: "" };

function FormularioDireccion({ alGuardar, alCancelar, textoBoton = "Guardar dirección" }) {
    const [datos, setDatos] = useState(vacio);
    const [errores, setErrores] = useState({});

    function cambiarCampo(e) {
        setDatos({ ...datos, [e.target.name]: e.target.value });
    }

    function manejarEnvio(e) {
        e.preventDefault();

        const nuevosErrores = validarDireccion(datos);
        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores);
            return;
        }

        alGuardar(datos);
        setDatos(vacio);
        setErrores({});
    }

    return (
        <Form onSubmit={manejarEnvio} noValidate>
            <Form.Group className="mb-3">
                <Form.Label>Calle y número</Form.Label>
                <Form.Control name="calle" maxLength={60} placeholder="Ej: Av. Libertad 1234"
                    value={datos.calle} onChange={cambiarCampo} />
                {errores.calle && <span className="text-danger small d-block mt-1">{errores.calle}</span>}
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Depto, casa o referencia (opcional)</Form.Label>
                <Form.Control name="referencia" maxLength={60} placeholder="Ej: Depto 502"
                    value={datos.referencia} onChange={cambiarCampo} />
            </Form.Group>

            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Comuna</Form.Label>
                        <Form.Control name="comuna" maxLength={40} placeholder="Ej: Viña del Mar"
                            value={datos.comuna} onChange={cambiarCampo} />
                        {errores.comuna && <span className="text-danger small d-block mt-1">{errores.comuna}</span>}
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Región</Form.Label>
                        <Form.Select name="region" value={datos.region} onChange={cambiarCampo}>
                            <option value="">Seleccione una región</option>
                            {regiones.map(r => <option key={r} value={r}>{r}</option>)}
                        </Form.Select>
                        {errores.region && <span className="text-danger small d-block mt-1">{errores.region}</span>}
                    </Form.Group>
                </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2">
                {alCancelar && <Button variant="secondary" onClick={alCancelar}>Cancelar</Button>}
                <Button type="submit">{textoBoton}</Button>
            </div>
        </Form>
    );
}

export default FormularioDireccion;