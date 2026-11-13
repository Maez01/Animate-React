import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import CampoFormulario from "../components/CampoFormulario";
import { useAuth } from "../context/authContext";

// Ruta a la imagen dentro de public/ (Vite la sirve desde la raíz "/")
const logoCircular = "/Imagenes/logo.jpg";

function InicioSesion() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [correo, setCorreo] = useState("");
    const [contrasenia, setContrasenia] = useState("");
    const [errorLogin, setErrorLogin] = useState("");
    const [enviando, setEnviando] = useState(false);

        async function manejarEnvio(e) {
            e.preventDefault();
            setErrorLogin("");

            if (correo.trim() === "" || contrasenia === "") {
                setErrorLogin("Complete correo y contraseña");
                return;
            }

            setEnviando(true);
            try {
                const usuario = await login(correo.trim(), contrasenia);
                const destino = location.state?.desde || (usuario.rol === "ADMIN" ? "/admin" : "/");
                navigate(destino, { replace: true });
            } catch (error) {
                setErrorLogin(error.message);
            } finally {
                setEnviando(false);
            }
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

                    <button className="button" type="submit" disabled={enviando}>
                        {enviando ? "Ingresando..." : "Iniciar sesión"}
                    </button>
                </form>

                <p><Link to="/registro">No tengo cuenta</Link></p>
            </section>
        </div>
    );
}

export default InicioSesion;
