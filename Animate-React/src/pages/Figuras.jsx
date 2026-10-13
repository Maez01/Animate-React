import BarraNavegacion from "../components/BarraNavegacion";
import Footer from "../components/Footer";
import { useState } from "react";
import TarjetaFigura from "../components/TarjetaFiguras";
import { baseDatosFiguras } from "../data/figuras";

function Figuras(){
    const [busqueda, setBusqueda] = useState("");
    const [tipo, setTipo] = useState("todos");
    const [orden, setOrden] = useState("predeterminado");
    const filtradas = baseDatosFiguras.filter(figura => {
        const cumpleTipo = tipo === "todos" || figura.tipoFigura === tipo;
        const cumpleBusqueda = figura.nombre.toLowerCase().includes(busqueda.toLowerCase());
        return cumpleTipo && cumpleBusqueda;
    });

    if (orden === "más-vistos"){
        filtradas.sort((a,b) => b.vistas - a.vistas);
    }else if (orden === "recientes"){
        filtradas.sort((a,b) => new Date(b.fechaAgregado) - new Date(a.fechaAgregado));
    }else if (orden === "precio-menor"){
        filtradas.sort((a,b)=> a.precio - b.precio);
    }else if (orden === "precio-mayor"){
        filtradas.sort((a,b)=> b.precio - a.precio)
    }

    return(
        <div style={{backgroundColor: "darkgray"}}>
            <BarraNavegacion/>

            <h1 style={{textAlign:"center"}} className="tituloCategoria">Figuras</h1>

            <div className="container bg-white p-4 rounded shadow-sm mb-4">
                <div className="row g-3 align-items-center">
                    <div className="col-md-4">
                        <input type="text" className="form-control" placeholder="Buscar por nombre..."
                        value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                    </div>
                    <div className="col-md-4">
                        <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
                            <option value = "todos">Todos los tipos</option>
                            <option value = "Figura a escala">Figura a escala</option>
                            <option value = "Nendoroid">Nendoroid</option>
                        </select>
                    </div>
                    <div className="col-md-4">
                        <select className="form-select" value={orden} onChange={e => setOrden(e.target.value)}>
                            <option value ="predeterminado">Ordenar por...</option>
                            <option value ="más-vistos">Más vistos</option>
                            <option value ="recientes">Más recientes</option>
                            <option value ="precio-menor">Precio: menor a mayor</option>
                            <option value ="precio-mayor">Precio: mayor a menor</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="container pb-5">
            <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
                {filtradas.length === 0 &&(
                    <p className="text-center col-12 my-5 text-muted fs-5">
                        Busqueda sin resultados 
                    </p>
                )}
                {filtradas.map(figura => (
                    <TarjetaFigura key={figura.id} figura={figura} />
                ))}
            </div>
        </div>    
        <Footer/>
        </div>
    );
}
export default Figuras;