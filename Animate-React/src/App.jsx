import { BrowserRouter, Routes, Route } from "react-router-dom";
import InicioSesion from "./pages/InicioSesion";
import Registro from "./pages/Registro";
import Perfil from "./pages/PerfilUsuario";
import Inicio from "./pages/Inicio";
import Figuras from "./pages/Figuras";
import Merchandaising from "./pages/Merchandaising";
import Tecnologia from "./pages/Tecnologia";
import Preventas from "./pages/Preventas";
import Mangas from "./pages/Mangas";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Inicio/>} />
                <Route path="/mangas" element={<Mangas/>} />
                <Route path="/figuras" element={<Figuras/>} />
                <Route path="/merchandaising" element={<Merchandaising/>} />
                <Route path="/tecnologia" element={<Tecnologia/>} />
                <Route path="/preventas" element={<Preventas/>} />
                <Route path="/login" element={<InicioSesion />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/admin" element={<h1>Panel admin (pendiente)</h1>} />
                <Route path="/perfil" element={<Perfil />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;