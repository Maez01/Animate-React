import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CampoFormulario from "../components/CampoFormulario";
import { obtenerTodosUsuarios, validarRegistro, registrarUsuario } from "../utils/usuarios";

function Registro() {
    const navigate = useNavigate();

    const [datos, setDatos] = useState({ nombre: "", apellido: "", correo: "", contrasenia: "" });
    const [errores, setErrores] = useState({});

    function manejarCambio(e) {
        const { name, value } = e.target;
        setDatos({ ...datos, [name]: value });
    }

    function manejarEnvio(e) {
        e.preventDefault();

        const limpios = {
            nombre: datos.nombre.trim(),
            apellido: datos.apellido.trim(),
            correo: datos.correo.trim(),
            contrasenia: datos.contrasenia,
        };

        const nuevosErrores = validarRegistro(limpios, obtenerTodosUsuarios());
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        registrarUsuario(limpios);
        alert("Usuario registrado con éxito");
        navigate("/login");
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

                    <button className="button" type="submit">Registrarse</button>
                    <p><Link to="/login">Ya tengo cuenta</Link></p>
                </section>
            </form>
        </div>
    );
}

export default Registro;