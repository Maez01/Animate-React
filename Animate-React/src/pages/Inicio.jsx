import BarraNavegacion from "../components/BarraNavegacion";
import CarruselInicio from "../components/CarruselInicio";
import BarraBusqueda from "../components/BarraBusqueda";
import FilaCategoria from "../components/FilaCategoria";
import Footer from "../components/Footer";
import { categoriasInicio, preventas } from "../data/inicio";

function Inicio(){
    return(
        <div style={{backgroundColor: "darkgray"}}>
            <BarraNavegacion/>
            <CarruselInicio/>
            <BarraBusqueda/>

            <section id="productos_disponibles">
                <h3 className="descripcionCategoria" style={{textAlign: "center"}}>
                    Productos disponibles en la tienda
                </h3>
                {categoriasInicio.map(categoria => (
                    <FilaCategoria
                    key = {categoria.titulo}
                    titulo = {categoria.titulo}
                    ruta = {categoria.ruta}
                    productos = {categoria.productos}
                    />
                ))}
            </section>

            <section id="Preventa">
                <FilaCategoria titulo={preventas.titulo} ruta={preventas.ruta} productos={preventas.productos}/>
            </section>
            <Footer />
        </div>
    );
}

export default Inicio;