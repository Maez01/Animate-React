import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CampoFormulario from "../components/CampoFormulario";
import { buscarUsuario, guardarSesion } from "../utils/usuarios";

// Ruta a la imagen dentro de public/ (Vite la sirve desde la raíz "/")
const logoCircular = "/Imagenes/logo.jpg";

function InicioSesion() {
    const navigate = useNavigate();

    const [correo, setCorreo] = useState("");
    const [contrasenia, setContrasenia] = useState("");
    const [errorLogin, setErrorLogin] = useState("");

    function manejarEnvio(e) {
        e.preventDefault();
        setErrorLogin("");

        if (correo.trim() === "" || contrasenia === "") {
            setErrorLogin("Complete correo y contraseña");
            return;
        }

        const usuario = buscarUsuario(correo.trim(), contrasenia);
        if (!usuario) {
            setErrorLogin("Correo o contraseña incorrectos");
            return;
        }

        guardarSesion(usuario);
        navigate(usuario.rol === "Admin" ? "/admin" : "/");
    }

    return (
        <div className="fondo-login">
            <section className="form-register">
                <Link to="/" title="Volver al inicio">
                    <img src={logoCircular} alt="Animate Ltda." className="logo-circular" />
                </Link>

                <h4>Iniciar sesión</h4>

                <form onSubmit={manejarEnvio} noValidate>
                    <CampoFormulario tipo="email" nombre="correo" placeholder="ingrese su correo"
                        valor={correo} alCambiar={e => setCorreo(e.target.value)} />

                    <CampoFormulario tipo="password" nombre="contrasenia" placeholder="ingrese su contraseña"
                        valor={contrasenia} alCambiar={e => setContrasenia(e.target.value)} />

                    {errorLogin && <span className="error">{errorLogin}</span>}

                    <button className="button" type="submit">Iniciar sesión</button>
                </form>

                <p><Link to="/registro">No tengo cuenta</Link></p>
            </section>
        </div>
    );
}

export default InicioSesion;