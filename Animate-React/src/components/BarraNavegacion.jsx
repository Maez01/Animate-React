import {Link} from "react-router-dom";
import {Navbar, Nav, NavDropdown, Container} from "react-bootstrap";
import {obtenerSesion} from "../utils/usuarios";
import { useCarrito } from "../context/carritoContext";

function BarraNavegacion(){
    const sesion = obtenerSesion();
    const esAdmin = sesion !== null && sesion.rol ==="Admin";

    const { cantidadTotal: cantidadCarrito } = useCarrito();

    return(
        <Navbar expand="lg" className="bg-body-tertiary">
            <Container fluid>
                <img src = "/Imagenes/Adobe Express - file.png" height="40" width="40" alt="Logo Animate"/>
                <Navbar.Brand as ={Link} to="/" className="dw-bold">Animate Ltda.</Navbar.Brand>

                <Navbar.Toggle aria-controls = "menu-principal"/>
                <Navbar.Collapse id="menu-principal">

                <Nav className="me-auto mb-2 mb-lg-0">
                    <NavDropdown title="Categorias">
                        <NavDropdown.Item as={Link} to="/mangas">Mangas</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/figuras">Figuras</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/merchandaising">Merchandaising</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/tecnologia">Tecnologia</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/preventas">Preventas</NavDropdown.Item>
                    </NavDropdown>
                    <Nav.Link href="#Contacto">Contactanos</Nav.Link>
                </Nav>
                <Nav className="align-items-lg-center">
                    <img src="/Iconos/user_circle.png" className="imagen35x35" alt=""/>
                    <Nav.Link as={Link} to="/login">Inicio sesion</Nav.Link>

                    <Nav.Link as={Link} to="/carrito" className="d-flex align-items-center gap-1">
                    <img src="/Iconos/share.png" className="imagen35x35" alt=""/>
                    Carrito <span className="badge bg-danger rounded-pill">{cantidadCarrito}</span>
                    </Nav.Link>

                    {esAdmin && (
                        <Nav.Link as={Link} to="/admin" className="fw-bold text-danger">Panel Admin</Nav.Link>
                    )}
                </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default BarraNavegacion;
