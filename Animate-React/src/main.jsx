import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/estilos.css'
import './styles/formularios.css'
import App from './App.jsx'
import CarritoProvider from './context/CarritoProvider.jsx'
import AuthProvider from './context/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
            <AuthProvider>
                <CarritoProvider>
                    <App />
                </CarritoProvider>
            </AuthProvider>
        </StrictMode>,
)