import { Container, Row, Col, Form } from "react-bootstrap";

const GENEROS = [
    { valor: "todos", texto: "Todos los géneros" },
    { valor: "shonen", texto: "Shonen" },
    { valor: "seinen", texto: "Seinen" },
    { valor: "shojo", texto: "Shojo" },
    { valor: "slice of life", texto: "Slice of Life" },
    { valor: "fantasia", texto: "Fantasía" },
    { valor: "terror", texto: "Terror" },
    { valor: "josei", texto: "Josei" },
    { valor: "isekai", texto: "Isekai" },
];

function FiltrosCatalogo({ filtros, alCambiar }) {
    return (
        <Container className="bg-white p-4 rounded shadow-sm mb-4">
            <Row className="g-3 align-items-center">
                <Col md={4}>
                    <Form.Control
                        type="text"
                        placeholder="Buscar por título..."
                        value={filtros.busqueda}
                        onChange={e => alCambiar("busqueda", e.target.value)}
                    />
                </Col>
                <Col md={4}>
                    <Form.Select
                        value={filtros.genero}
                        onChange={e => alCambiar("genero", e.target.value)}
                    >
                        {GENEROS.map(g => (
                            <option key={g.valor} value={g.valor}>{g.texto}</option>
                        ))}
                    </Form.Select>
                </Col>
                <Col md={4}>
                    <Form.Select
                        value={filtros.orden}
                        onChange={e => alCambiar("orden", e.target.value)}
                    >
                        <option value="predeterminado">Ordenar por...</option>
                        <option value="mas-vistos">Más vistos</option>
                        <option value="recientes">Más recientes</option>
                    </Form.Select>
                </Col>
            </Row>
        </Container>
    );
}

export default FiltrosCatalogo;