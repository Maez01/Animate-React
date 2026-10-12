import { Carousel } from "react-bootstrap";
import { slideCarrusel } from "../data/inicio";

function CarruselInicio(){
    return(
        <section id="carrusel">
            <Carousel>
                {slideCarrusel.map(slide=>(
                    <Carousel.Item key={slide.titulo} interval={3000}>
                        <img src={slide.imagen} className="imagenMediana d-block w-100" alt={slide.titulo}/>
                        <Carousel.Caption className="d-none d-md-block">
                            <h5 className="tituloCategoria">{slide.titulo}</h5>
                            <p className="descripcionCategoria">{slide.descripcion}</p>
                        </Carousel.Caption>
                    </Carousel.Item> 
                ))}
            </Carousel>
        </section>
    )
}

export default CarruselInicio;