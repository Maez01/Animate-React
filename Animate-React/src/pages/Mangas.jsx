import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import BarraNavegacion from "../components/BarraNavegacion";
import Footer from "../components/Footer";
import FiltrosMangas from "../components/FiltrosMangas";
import TarjetaManga from "../components/TarjetaManga";
import ModalVolumenes from "../components/ModalVolumenes";
import { obtenerCatalogoCompleto } from "../utils/catalogoMangas";
import { filtrarMangas } from "../utils/filtrarMangas";
import { useCarrito } from "../context/carritoContext";
import { crearClave } from "../utils/carrito";

function Mangas() {
    const [parametros] = useSearchParams();
    const [catalogo] = useState(obtenerCatalogoCompleto);

    const [filtros, setFiltros] = useState({
        busqueda: parametros.get("buscar") ?? "",
        genero: "todos",
        orden: "predeterminado",
    });

    // Si la URL trae ?manga=4, el modal parte abierto con ese manga
    const [mangaSeleccionado, setMangaSeleccionado] = useState(() => {
        const id = Number(parametros.get("manga"));
        return catalogo.find(m => m.id === id) ?? null;
    });

    function cambiarFiltro(campo, valor) {
        setFiltros(anterior => ({ ...anterior, [campo]: valor }));
    }

    const { agregar } = useCarrito();

    function comprarTomo(manga, volumen) {
        return agregar({
            clave: crearClave("manga", manga.id, volumen.tomo),
            tipo: "manga",
            productoId: manga.id,
            tomo: volumen.tomo,
            nombre: `${manga.titulo} - Tomo ${volumen.tomo}`,
            precio: volumen.precio,
            img: volumen.img,
        });
    }

    const mangasVisibles = filtrarMangas(catalogo, filtros);

    return (
        <div style={{ backgroundColor: "darkgray" }}>
            <BarraNavegacion />

            <h1 className="tituloCategoria text-center py-4">Mangas</h1>

            <FiltrosMangas filtros={filtros} alCambiar={cambiarFiltro} />

            <Container className="mb-5">
                {mangasVisibles.length === 0 ? (
                    <p className="text-center my-5 text-muted fs-5">
                        No existen registros que coincidan con la búsqueda.
                    </p>
                ) : (
                    <Row xs={1} md={3} lg={4} className="g-4">
                        {mangasVisibles.map(manga => (
                            <Col key={manga.id}>
                                <TarjetaManga manga={manga} alVerVolumenes={setMangaSeleccionado} />
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>

            <ModalVolumenes
                manga={mangaSeleccionado}
                alCerrar={() => setMangaSeleccionado(null)}
                alComprar={comprarTomo}
            />

            <Footer />
        </div>
    );
}

export default Mangas;