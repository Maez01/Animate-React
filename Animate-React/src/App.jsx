import { BrowserRouter, Routes, Route } from "react-router-dom";
import InicioSesion from "./pages/InicioSesion";
import Registro from "./pages/Registro";
import Perfil from "./pages/PerfilUsuario";
import Inicio from "./pages/Inicio";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Inicio/>} />
                <Route path="/login" element={<InicioSesion />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/admin" element={<h1>Panel admin (pendiente)</h1>} />
                <Route path="/perfil" element={<Perfil />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;