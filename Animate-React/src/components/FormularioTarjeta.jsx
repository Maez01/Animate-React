import { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { validarTarjeta } from "../utils/tarjetas";

const vacio = { numero: "", clave: "", propietario: "" };

function FormularioTarjeta({ alGuardar, alCancelar, textoBoton = "Guardar tarjeta" }) {
    const [datos, setDatos] = useState(vacio);
    const [errores, setErrores] = useState({});

    function cambiarCampo(e) {
        setDatos({ ...datos, [e.target.name]: e.target.value });
    }

    function manejarEnvio(e) {
        e.preventDefault();

        const nuevosErrores = validarTarjeta(datos);
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
            {[
                { campo: "numero", etiqueta: "Número de tarjeta", tipo: "text", max: 19, ejemplo: "1234 5678 9012 3456" },
                { campo: "clave", etiqueta: "Clave (CVV)", tipo: "password", max: 3, ejemplo: "123" },
                { campo: "propietario", etiqueta: "Propietario", tipo: "text", max: 50, ejemplo: "Nombre como aparece en la tarjeta" },
            ].map(c => (
                <Form.Group className="mb-3" key={c.campo}>
                    <Form.Label>{c.etiqueta}</Form.Label>
                    <Form.Control type={c.tipo} name={c.campo} maxLength={c.max} placeholder={c.ejemplo}
                        value={datos[c.campo]} onChange={cambiarCampo} />
                    {errores[c.campo] && <span className="text-danger small d-block mt-1">{errores[c.campo]}</span>}
                </Form.Group>
            ))}
            <div className="d-flex justify-content-end gap-2">
                {alCancelar && <Button variant="secondary" onClick={alCancelar}>Cancelar</Button>}
                <Button type="submit">{textoBoton}</Button>
            </div>
        </Form>
    );
}

export default FormularioTarjeta;