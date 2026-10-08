function CampoFormulario({tipo = "text", nombre, placeholder, valor, alCambiar, error}){
    return(
        <>
            <input
                className ="controls"
                type={tipo}
                name={nombre}
                id={nombre}
                placeholder={placeholder}
                value={valor}
                onChange={alCambiar}
            />
            {error && <span className="error">{error}</span>}
        </>
        );
    }

export default CampoFormulario;