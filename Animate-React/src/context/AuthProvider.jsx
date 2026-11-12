import { useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import {
    iniciarSesion,
    renovarSesion,
    cerrarSesionApi,
    obtenerUsuarioActual,
    suscribirSesion,
} from "../services/api";


function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(obtenerUsuarioActual);
    const [cargando, setCargando] = useState(true);


    useEffect(() => {
        const dejarDeEscuchar = suscribirSesion(setUsuario);

        renovarSesion()
            .catch(() => {

                })
                .finally(() => setCargando(false));

            return dejarDeEscuchar;
        }, []);

    const valor = {
        usuario,
        cargando,
        esAdmin: usuario?.rol === "ADMIN",
        login: iniciarSesion,
        logout: cerrarSesionApi,
        refrescarSesion: renovarSesion,
    };
    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export default AuthProvider;