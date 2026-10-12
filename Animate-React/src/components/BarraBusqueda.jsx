import { useState } from "react";
import { useNavigate } from "react-router-dom";

function BarraBusqueda(){
    const [termino, setTermino] = useState("");
    const navigate = useNavigate();

    function manejarEnvio(e){
        e.preventDefault();
        const texto = termino.trim();
        if(texto){
            navigate(`/buscar?q=${encodeURIComponent(texto)}`)
        }
    }
    return (
        <section id="barra_de_busqueda" className="container my-4">
            <form className="d-flex" role="search" onSubmit={manejarEnvio}>
                <input
                className="form-control me-2"
                type="search"
                placeholder="Buscar productos"
                aria-label="Buscar"
                value={termino}
                onChange={e=> setTermino(e.target.value)}
                />
            </form>
        </section>
    )
}

export default BarraBusqueda;