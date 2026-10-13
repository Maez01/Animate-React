import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import BarraNavegacion from "../components/BarraNavegacion";
import Footer from "../components/Footer";
import FiltrosCatalogo from "../components/FiltrosCatalogo";
import TarjetaManga from "../components/TarjetaManga";
import { obtenerCatalogoCompleto } from "../utils/catalogo";
import { filtrarMangas } from "../utils/filtrarMangas";

function Mangas() {
    const [parametros] = useSearchParams();
    const [catalogo] = useState(obtenerCatalogoCompleto);

    const [filtros, setFiltros] = useState({
        busqueda: parametros.get("buscar") ?? "",
        genero: "todos",
        orden: "predeterminado",
    });

    function cambiarFiltro(campo, valor) {
        setFiltros(anterior => ({ ...anterior, [campo]: valor }));
    }

    const mangasVisibles = filtrarMangas(catalogo, filtros);

    return (
        <div style={{ backgroundColor: "darkgray" }}>
            <BarraNavegacion />

            <h1 className="tituloCategoria text-center py-4">Mangas</h1>

            <FiltrosCatalogo filtros={filtros} alCambiar={cambiarFiltro} />

            <Container className="mb-5">
                {mangasVisibles.length === 0 ? (
                    <p className="text-center my-5 text-muted fs-5">
                        No existen registros que coincidan con la búsqueda.
                    </p>
                ) : (
                    <Row xs={1} md={3} lg={4} className="g-4">
                        {mangasVisibles.map(manga => (
                            <Col key={manga.id}>
                                <TarjetaManga
                                    manga={manga}
                                    alVerVolumenes={m => console.log("Ver volúmenes de:", m.titulo)}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>

            <Footer />
        </div>
    );
}

export default Mangas;