import { Link } from "react-router-dom";

function FilaCategoria({titulo, ruta, productos}) {
    return(
        <>
        <div className="filaCategoria">
            <h2 className="tituloCatCuerpo">{titulo}</h2>
            <button className="button"><Link to={ruta}>Ver mas</Link></button>
        </div>
        <div className="contenedorProductos">
            {productos.map(producto => (
                <Link key={producto.imagen} to={producto.enlace || ruta}>
                    <img src={producto.imagen} className="imagenpequena my-4" alt={titulo}/>
                </Link>
            ))}
        </div>
        </>
    )
}

export default FilaCategoria;