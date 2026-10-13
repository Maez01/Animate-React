import { formatearPrecio } from "../utils/formatoPrecio";

function TarjetaFigura ({figura}) {
    const sinStock = figura.stock ===0;

    return(
        <div className="col">
            <div className="card card-producto h-100 shadow border-0">
                <img src={figura.imgPortada} className="card-img-top" style={{height: "280px", objectFit: "cover"}} alt={figura.nombre}/>
                
            </div>
        </div>
    );
}