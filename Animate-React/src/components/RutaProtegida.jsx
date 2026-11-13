import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useAuth } from "../context/authContext";

function RutaProtegida({ children, soloAdmin = false}) {
    const { usuario, cargando, esAdmin } = useAuth();
    const location = useLocation();


    if (cargando) {
        return (
            <div className="d-flex justify-content-center align-items-center gap-2" style={{ minHeight: "60vh" }}>
                <Spinner animation="border" role="status"/>
                <span> Cargando sesion...</span>
            </div>
        );
    }

    if (!usuario) {
        return <Navigate to="/login" replace state={{ desde: location.pathname}}/>;
    }

    if (soloAdmin && !esAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default RutaProtegida;
