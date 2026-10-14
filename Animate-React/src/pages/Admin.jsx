import { Navigate } from "react-router-dom";
import { Tabs, Tab, Container } from "react-bootstrap";
import BarraAdmin from "../components/BarraAdmin";
import AdminFiguras from "../components/AdminFiguras";
import AdminMangas from "../components/AdminMangas";
import { obtenerSesion } from "../utils/usuarios";

function Admin(){
    const sesion = obtenerSesion();

    if (sesion===null || sesion.rol !=="Admin"){
        return <Navigate to ="/login" replace/>
    }

    return(
        <div style={{ backgroundColor: "darkgray", minHeight:"100vh"}}>
            <BarraAdmin sesion={sesion}/>

            <Container className="pb-5">
                <h2 className="fw-bold text-white mb-4"> Panel de Administracion</h2>

                <Tabs defaultActiveKey="mangas" className="mb-4">
                    <Tab eventKey="mangas" title="Mangas">
                        <AdminMangas />
                    </Tab> 
                    <Tab eventKey="figuras" title="Figuras">
                        <AdminFiguras/>
                    </Tab>
                </Tabs>
            </Container>
        </div>
    );
}

export default Admin;