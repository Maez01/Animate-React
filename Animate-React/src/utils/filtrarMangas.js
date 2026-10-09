export function filtrarMangas(lista, { busqueda, genero, orden }) {
    const texto = busqueda.trim().toLowerCase();

    const resultado = lista.filter(manga => {
        const cumpleGenero = genero === "todos" || manga.genero.toLowerCase() === genero;
        const cumpleBusqueda = manga.titulo.toLowerCase().includes(texto);
        return cumpleGenero && cumpleBusqueda;
    });

    if (orden === "mas-vistos") {
        resultado.sort((a, b) => b.vistas - a.vistas);
    } else if (orden === "recientes") {
        resultado.sort((a, b) => new Date(b.fechaAgregado) - new Date(a.fechaAgregado));
    }

    return resultado;
}