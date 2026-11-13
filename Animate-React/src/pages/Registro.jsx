import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CampoFormulario from "../components/CampoFormulario";
import {validarRegistro, registrarUsuario } from "../utils/usuarios";

function Registro() {
    const navigate = useNavigate();

    const [datos, setDatos] = useState({ nombre: "", apellido: "", correo: "", contrasenia: "" });
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState("");
    const [enviando, setEnviando] = useState(false);

    function manejarCambio(e) {
        const { name, value } = e.target;
        setDatos({ ...datos, [name]: value });
    }

        async function manejarEnvio(e) {
            e.preventDefault();
            setErrorGeneral("");

            const limpios = {
                nombre: datos.nombre.trim(),
                apellido: datos.apellido.trim(),
                correo: datos.correo.trim(),
                contrasenia: datos.contrasenia,
            };

            const nuevosErrores = validarRegistro(limpios);
            setErrores(nuevosErrores);
            if (Object.keys(nuevosErrores).length > 0) return;

            setEnviando(true);
            try {
                await registrarUsuario(limpios);
                alert("Usuario registrado con éxito");
                navigate("/login");
            } catch (error) {
                if (error.status === 409) {
                    setErrores({ correo: error.message });
                } else if (Object.keys(error.campos).length > 0) {
                    setErrores(error.campos);
                } else {
                    setErrorGeneral(error.message);
                }
            } finally {
                setEnviando(false);
            }
        }

    return (
        <div className="fondo-login">
            <form onSubmit={manejarEnvio} noValidate>
                <section className="form-register">
                    <h4>Registro</h4>

                    <CampoFormulario nombre="nombre" placeholder="ingrese su nombre"
                        valor={datos.nombre} alCambiar={manejarCambio} error={errores.nombre} />

                    <CampoFormulario nombre="apellido" placeholder="ingrese su apellido"
                        valor={datos.apellido} alCambiar={manejarCambio} error={errores.apellido} />

                    <CampoFormulario tipo="email" nombre="correo" placeholder="ingrese su correo"
                        valor={datos.correo} alCambiar={manejarCambio} error={errores.correo} />

                    <CampoFormulario tipo="password" nombre="contrasenia" placeholder="ingrese su contraseña"
                        valor={datos.contrasenia} alCambiar={manejarCambio} error={errores.contrasenia} />

                    {errorGeneral && <span className="error">{errorGeneral}</span>}
                    <button className="button" type="submit" disabled={enviando}>
                    {enviando ? "Registrando..." : "Registrarse"}
                    </button>
                    <p><Link to="/login">Ya tengo cuenta</Link></p>
                </section>
            </form>
        </div>
    );
}

export default Registro;
