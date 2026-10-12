import { Link } from "react-router-dom";

function Footer(){
    return(
        <footer className="footerTienda">
            <div className="footerContenedor">
                <div className="footerColumna">
                    <h4>Animate Ltda</h4>
                    <p> Tu tienda de productos favorita, donde encontraras todo lo que buscas y mucho más</p>
                </div>

                <div className="footerColumna">
                    <h4>Enlaces</h4>
                    <ul>
                        <li><Link to ="/mangas">Mangas</Link></li>
                        <li><Link to ="/figuras">Figuras</Link></li>
                        <li><Link to ="/merchandaising">Merchandaising</Link></li>
                        <li><Link to ="/tecnologia">Tecnologia</Link></li>
                        <li><Link to ="/preventas">Preventas</Link></li>
                    </ul>
                </div>

                <div className="footerColumna" id="Contacto">
                    <h4>Contacto</h4>
                    <ul>
                        <li>Email: infoayuda@animate.cl</li>
                        <li>Whatsapp: +569-76405532</li>
                        <li>Ubicacion: Villa Alemana 1895</li>
                    </ul>
                </div>

                <div className="footerColumna">
                    <h4>Siguenos</h4>
                    <ul>
                        <li><a href="https://www.instagram.com/maesmaez96?stkn=MXBoMjkwODI4eHU1YQ==">Instagram</a></li>
                    </ul>
                </div>

                <div className="footerCopyRight">
                    <p>&copy; 2026 Tienda Animate Ltda. Todos los derechos reservados</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;