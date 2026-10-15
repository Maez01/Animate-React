import { useState } from "react";

function FilaFiguraAdmin({figura, alGuardar, alEliminar, alVerGaleria}){
    const [precio, setPrecio] = useState(figura.precio);
    const [stock, setStock] = useState(figura.stock);

    function manejarGuardar(){
        const nuevoPrecio = Number(precio);
        const nuevoStock = Number(stock);

        if(precio === "" || stock === "" || nuevoPrecio < 0 || nuevoStock < 0 || !Number.isInteger(nuevoStock)){
            alert("Precio y Stock no pueden estar vacios, ser 0 ni decimales");
            return;
        }

        alGuardar(figura.id, nuevoPrecio, nuevoStock);
    }

    return(
        <tr>
            <td>
                <img src={figura.imgPortada} alt={figura.nombre} style={{width:"50px", height: "65px", objectFit: "cover", borderRadius: "4px"}}/>  
            </td>
            <td>{figura.nombre}</td>
            <td>{figura.tipoFigura}</td>
            <td>
                <input type="number" min="0" className="form-control form-control-sm" style={{width: "110px"}}
                    value={precio} onChange={e => setPrecio(e.target.value)}/>
            </td>
            <td>
                <input type="number" min="0" className="form-control form-control-sm" style={{width: "90px"}}
                    value={stock} onChange={e => setStock(e.target.value)}/>
            </td>
            <td className="text-nowrap">
                <button className="btn btn-outline-success btn-sm me-1" onClick={manejarGuardar}>Guardar</button>
                <button className="btn btn-outline-primary btn-sm me-1" onClick={() => alVerGaleria(figura)}>Galería</button>
                <button className="btn btn-outline-danger btn-sm" onClick={()=> alEliminar(figura)}>Eliminar</button>
            </td>
        </tr>
    )
}

export default FilaFiguraAdmin;