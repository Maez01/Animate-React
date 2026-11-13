import { createContext, useContext } from "react";
import { iniciarSesion, cerrarSesionApi, renovarSesion } from "../services/api";

// Valor cuando no hay <AuthProvider> (por ejemplo, en las pruebas de una página suelta):
// se comporta como un visitante sin sesión, en vez de romper la página.
const SIN_SESION = {
    usuario: null,
    cargando: false,
    esAdmin: false,
    login: iniciarSesion,
    logout: cerrarSesionApi,
    refrescarSesion: renovarSesion,
};

export const AuthContext = createContext(SIN_SESION);

export function useAuth() {
    return useContext(AuthContext);
}