import { Link, useNavigate } from "react-router-dom";
import {Navbar, Nav, Container, Button} from "react-bootstrap";
import { cerrarSesion } from "../utils/usuarios";

function BarraAdmin({sesion}){
    const navigate = useNavigate();

    function manejarCerrarSesion(){
        cerrarSesion();
        navigate("/login");
    }

    return(
        <Navbar expand="lg" className="bg-body-tertiary mb-4">
            <Container fluid>
                <img src="/Imagenes/Adobe Express - file.png" height="40" width="40" alt="Logo Animate"/>
                <Navbar.Brand as = {Link} to="/" className="fw-bold">Animate Ltda.</Navbar.Brand>

                <Navbar.Toggle aria-controls="menu-admin" />
                <Navbar.Collapse id="menu-admin">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/mangas">Ver mangas</Nav.Link>
                        <Nav.Link as={Link} to="/figuras">Ver figuras</Nav.Link>
                    </Nav>
                    <Nav className="align-items-lg-center gap-2">
                        <Navbar.Text>{sesion.nombre} ({sesion.rol})</Navbar.Text>
                            <Button as={Link} to="/perfil-admin" variant="outline-primary" size="sm">
                                       Mi perfil
                            </Button>
                        <Button variant="outline-danger" size="sm" onClick={manejarCerrarSesion}>
                            Cerrar sesion
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default BarraAdmin;