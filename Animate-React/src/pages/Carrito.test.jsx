import { describe, it, expect, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CarritoProvider from "../context/CarritoProvider";
import Carrito from "./Carrito";
import { baseDatosFiguras } from "../data/figuras";
import { baseDatosMangas } from "../data/mangas";
import { obtenerFigura } from "../utils/catalogoFiguras";
import { obtenerVentas } from "../utils/ventas";
import { guardarSesion, obtenerTodosUsuarios } from "../utils/usuarios";
import { agregarTarjeta } from "../utils/tarjetas";
import { agregarDireccion } from "../utils/direcciones";
import { formatearPrecio } from "../utils/formatoPrecio";

const figura = baseDatosFiguras[0];
const manga = baseDatosMangas[0];

const itemFigura = (cantidad = 1) => ({
    clave: `figura-${figura.id}`,
    tipo: "figura",
    productoId: figura.id,
    nombre: figura.nombre,
    precio: figura.precio,
    img: figura.imgPortada,
    cantidad,
});

const itemTomo = {
    clave: `manga-${manga.id}-1`,
    tipo: "manga",
    productoId: manga.id,
    tomo: 1,
    nombre: `${manga.titulo} - Tomo 1`,
    precio: manga.volumenes[0].precio,
    img: manga.volumenes[0].img,
    cantidad: 2,
};
const direccionCarlos = { id: 1, calle: "Av. Libertad 1234", referencia: "", comuna: "Viña del Mar", region: "Valparaíso" };

function renderCarrito(productos = []) {
    localStorage.setItem("carritoAnimate", JSON.stringify(productos));
    return render(
        <MemoryRouter>
            <CarritoProvider>
                <Carrito />
            </CarritoProvider>
        </MemoryRouter>
    );
}

function zonaCarrito() {
    return within(screen.getByRole("heading", { name: "Tu Carrito de Compras" }).parentElement);
}

function silenciarAlertas() {
    return vi.spyOn(window, "alert").mockImplementation(() => {});
}

describe("contenido del carrito", () => {
    it("vacío muestra el aviso y no deja finalizar", async () => {
        const alerta = silenciarAlertas();
        const user = userEvent.setup();
        renderCarrito();

        expect(screen.getByText("Tu carrito está vacío.")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Total: $0" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));
        expect(alerta).toHaveBeenCalledWith("Tu carrito está vacío.");
    });

    it("muestra cada producto y el total", () => {
        renderCarrito([itemFigura(), itemTomo]);

        expect(screen.getByText(figura.nombre)).toBeInTheDocument();
        expect(screen.getByText(itemTomo.nombre)).toBeInTheDocument();

        const total = figura.precio + itemTomo.precio * 2;
        expect(screen.getByRole("heading", { name: `Total: ${formatearPrecio(total)}` })).toBeInTheDocument();
    });

    it("los botones + y − cambian la cantidad, y en cero quitan el producto", async () => {
        const user = userEvent.setup();
        renderCarrito([itemFigura()]);

        await user.click(screen.getByRole("button", { name: "+" }));
        expect(zonaCarrito().getByText("2")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "−" }));
        await user.click(screen.getByRole("button", { name: "−" }));
        expect(screen.getByText("Tu carrito está vacío.")).toBeInTheDocument();
    });

    it("no deja sumar más unidades que el stock", async () => {
        const alerta = silenciarAlertas();
        const user = userEvent.setup();
        renderCarrito([itemFigura(figura.stock)]);

        await user.click(screen.getByRole("button", { name: "+" }));

        expect(alerta).toHaveBeenCalledWith("No quedan más unidades de este producto.");
        expect(zonaCarrito().getByText(String(figura.stock))).toBeInTheDocument();
    });

    it("Eliminar quita el producto", async () => {
        const user = userEvent.setup();
        renderCarrito([itemFigura()]);

        await user.click(screen.getByRole("button", { name: "Eliminar" }));

        expect(screen.getByText("Tu carrito está vacío.")).toBeInTheDocument();
    });
});

describe("finalizar la compra", () => {
        it("un invitado ingresa dirección y tarjeta, y la compra descuenta el stock", async () => {
        const alerta = silenciarAlertas();
        const user = userEvent.setup();
        renderCarrito([itemFigura()]);

        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));
        const ventana = await screen.findByRole("dialog");

        await user.click(within(ventana).getByRole("button", { name: "Continuar" }));
        expect(within(ventana).getByText("La calle es obligatoria")).toBeInTheDocument();

        await user.type(within(ventana).getByPlaceholderText("Ej: Av. Libertad 1234"), "Av. Libertad 1234");
        await user.type(within(ventana).getByPlaceholderText("Ej: Viña del Mar"), "Viña del Mar");
        await user.selectOptions(within(ventana).getByRole("combobox"), "Valparaíso");
        await user.click(within(ventana).getByRole("button", { name: "Continuar" }));
        expect(within(ventana).getByText("Av. Libertad 1234, Viña del Mar, Valparaíso")).toBeInTheDocument();

        await user.click(within(ventana).getByRole("button", { name: "Pagar" }));
        expect(within(ventana).getByText("El número debe tener 16 dígitos")).toBeInTheDocument();

        await user.type(within(ventana).getByPlaceholderText("1234 5678 9012 3456"), "4242 4242 4242 4242");
        await user.type(within(ventana).getByPlaceholderText("123"), "123");
        await user.type(within(ventana).getByPlaceholderText("Nombre como aparece en la tarjeta"), "Ana Gonzales");
        await user.click(within(ventana).getByRole("button", { name: "Pagar" }));

        expect(alerta).toHaveBeenCalledWith(`¡Gracias por tu compra! Total: ${formatearPrecio(figura.precio)}`);
        expect(screen.getByText("Tu carrito está vacío.")).toBeInTheDocument();
        expect(obtenerFigura(figura.id).stock).toBe(figura.stock - 1);
        expect(obtenerVentas()[0]).toMatchObject({
            comprador: "Invitado",
            tarjeta: "**** 4242",
            direccion: "Av. Libertad 1234, Viña del Mar, Valparaíso",
        });
    });

    it("el invitado puede cancelar el pago sin perder el carrito", async () => {
        const user = userEvent.setup();
        renderCarrito([itemFigura()]);

        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));
        const ventana = await screen.findByRole("dialog");
        await user.click(within(ventana).getByRole("button", { name: "Cancelar" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.getByText(figura.nombre)).toBeInTheDocument();
    });

    it("con sesión pero sin tarjeta avisa y no compra", async () => {
        const alerta = silenciarAlertas();
        guardarSesion(obtenerTodosUsuarios()[1]);
        const user = userEvent.setup();
        renderCarrito([itemFigura()]);

        expect(screen.getByText("No tienes una tarjeta seleccionada.")).toBeInTheDocument();
        expect(screen.getByText("No tienes una dirección seleccionada.")).toBeInTheDocument();
        screen.getAllByRole("link", { name: "Ir a mi perfil" }).forEach(enlace => {
            expect(enlace).toHaveAttribute("href", "/perfil");
        });
        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));

        expect(alerta).toHaveBeenCalledWith("Selecciona o registra una tarjeta en tu perfil antes de comprar.");
        expect(obtenerVentas()).toHaveLength(0);
    });

    it("con sesión y tarjeta guardada compra directo y registra la venta a su nombre", async () => {
        const alerta = silenciarAlertas();
        const carlos = obtenerTodosUsuarios()[1];
        guardarSesion(carlos);
        agregarTarjeta(carlos.correo, { id: 1, ultimos4: "4242", propietario: "Carlos" });
        agregarDireccion(carlos.correo, direccionCarlos);
        const user = userEvent.setup();
        renderCarrito([itemFigura()]);

        expect(screen.getByText("Se pagará con **** **** **** 4242 (Carlos)")).toBeInTheDocument();
        expect(screen.getByText("Se enviará a Av. Libertad 1234, Viña del Mar, Valparaíso")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));

        expect(alerta).toHaveBeenCalledWith(`¡Gracias por tu compra! Total: ${formatearPrecio(figura.precio)}`);
        expect(obtenerVentas()[0]).toMatchObject({ comprador: carlos.correo, tarjeta: "**** 4242" });
        expect(screen.getByText("Tu carrito está vacío.")).toBeInTheDocument();
    });
    
    it("con tarjeta pero sin dirección avisa y no compra", async () => {
        const alerta = silenciarAlertas();
        const carlos = obtenerTodosUsuarios()[1];
        guardarSesion(carlos);
        agregarTarjeta(carlos.correo, { id: 1, ultimos4: "4242", propietario: "Carlos" });
        const user = userEvent.setup();
        renderCarrito([itemFigura()]);

        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));

        expect(alerta).toHaveBeenCalledWith("Selecciona o registra una dirección de envío en tu perfil antes de comprar.");
        expect(obtenerVentas()).toHaveLength(0);
    });
});