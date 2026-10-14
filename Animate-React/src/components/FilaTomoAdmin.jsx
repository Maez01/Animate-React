import { useState } from "react";

function FilaTomoAdmin({ volumen, alGuardar, alEliminar }) {
    const [precio, setPrecio] = useState(volumen.precio);
    const [stock, setStock] = useState(volumen.stock);

    function manejarGuardar() {
        const nuevoPrecio = Number(precio);
        const nuevoStock = Number(stock);

        if (precio === "" || stock === "" || nuevoPrecio < 0 || nuevoStock < 0 || !Number.isInteger(nuevoStock)) {
            alert("Precio y stock deben ser números válidos (0 o más).");
            return;
        }

        alGuardar(volumen.tomo, nuevoPrecio, nuevoStock);
    }

    return (
        <tr>
            <td>Vol. {volumen.tomo}</td>
            <td>
                <input type="number" min="0" className="form-control form-control-sm" style={{ width: "100px" }}
                    value={precio} onChange={e => setPrecio(e.target.value)} />
            </td>
            <td>
                <input type="number" min="0" className="form-control form-control-sm" style={{ width: "90px" }}
                    value={stock} onChange={e => setStock(e.target.value)} />
            </td>
            <td className="text-nowrap">
                <button className="btn btn-outline-primary btn-sm me-1" onClick={manejarGuardar}>Guardar</button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => alEliminar(volumen.tomo)}>Eliminar</button>
            </td>
        </tr>
    );
}

export default FilaTomoAdmin;