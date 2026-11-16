import {useState} from "react";

function FilaTomoAdmin({volumen, esUltimo, alGuardar, alEliminar}) {
    const [precio, setPrecio] = useState(volumen.precio);
    const [stock, setStock] = useState(volumen.stock);
    const [img, setImg] = useState(volumen.img);

    function manejarGuardar() {
        const nuevoPrecio = Number(precio);
        const nuevoStock = Number(stock);

        if (precio === "" || stock === "" || nuevoPrecio <= 0 || nuevoStock < 0 || !Number.isInteger(nuevoStock)) {
            alert("El precio debe ser mayor a 0 y el stock un número entero (0 o más).");
            return;
        }

        if (img.trim() === "") {
            alert("Indica la ruta de la imagen del tomo.");
            return;
        }

        alGuardar(volumen.tomo, {precio: nuevoPrecio, stock: nuevoStock, img: img.trim()});
    }

    return (
        <tr>
            <td>Vol. {volumen.tomo}</td>
            <td>
                <input type="number" min="0" className="form-control form-control-sm" style={{width: "100px"}}
                       value={precio} onChange={e => setPrecio(e.target.value)}/>
            </td>
            <td>
                <input type="number" min="0" className="form-control form-control-sm" style={{width: "90px"}}
                       value={stock} onChange={e => setStock(e.target.value)}/>
            </td>
            <td>
                <div className="d-flex align-items-center gap-2">
                    <img src={img} alt={`Vol. ${volumen.tomo}`}
                         style={{width: "35px", height: "50px", objectFit: "cover", borderRadius: "4px"}}/>
                    <input type="text" className="form-control form-control-sm" style={{width: "220px"}}
                           value={img} onChange={e => setImg(e.target.value)}/>
                </div>
            </td>
            <td className="text-nowrap">
                <button className="btn btn-outline-primary btn-sm me-1" onClick={manejarGuardar}>Guardar</button>
                {esUltimo && (
                    <button className="btn btn-outline-danger btn-sm"
                            onClick={() => alEliminar(volumen.tomo)}>Eliminar</button>
                )}
            </td>

        </tr>
    );
}

export default FilaTomoAdmin;