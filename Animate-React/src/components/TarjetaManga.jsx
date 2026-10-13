import { Card, Badge, Button } from "react-bootstrap";

function TarjetaManga({ manga, alVerVolumenes }) {
    return (
        <Card className="card-manga h-100 shadow border-0">
            <Card.Img
                variant="top"
                src={manga.imgPortada}
                alt={manga.titulo}
                style={{ height: 280, objectFit: "cover" }}
            />
            <Card.Body className="d-flex flex-column">
                <Badge bg="secondary" className="align-self-start mb-2 text-uppercase">
                    {manga.genero}
                </Badge>
                <Card.Title className="fw-bold text-dark">{manga.titulo}</Card.Title>
                <Card.Text className="text-muted small">
                    {manga.volumenes.length} tomos registrados
                </Card.Text>
                <Button className="mt-auto w-100 fw-bold" onClick={() => alVerVolumenes(manga)}>
                    Ver Volúmenes
                </Button>
            </Card.Body>
        </Card>
    );
}

export default TarjetaManga;