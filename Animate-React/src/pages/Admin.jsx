import { Tabs, Tab, Container } from "react-bootstrap";
import BarraAdmin from "../components/BarraAdmin";
import AdminFiguras from "../components/AdminFiguras";
import AdminMangas from "../components/AdminMangas";
import { useAuth } from "../context/authContext";

function Admin(){
    // RutaProtegida ya dejó pasar solo a ADMIN; aquí solo se lee el usuario para la barra
    const { usuario } = useAuth();

    return(
        <div style={{ backgroundColor: "darkgray", minHeight:"100vh"}}>
            <BarraAdmin sesion={usuario}/>

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