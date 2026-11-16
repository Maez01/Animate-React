import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CarritoProvider from "../context/CarritoProvider";
import Carrito from "./Carrito";
import { AuthContext } from "../context/authContext";
import { registrarVenta } from "../utils/ventas";
import { obtenerSeleccionada } from "../utils/tarjetas";
import { obtenerDireccionSeleccionada } from "../utils/direcciones";
import { formatearPrecio } from "../utils/formatoPrecio";

// Se simulan solo las funciones que llaman al backend
vi.mock("../utils/ventas", async importOriginal => ({
    ...(await importOriginal()),
    registrarVenta: vi.fn(),
}));
vi.mock("../utils/tarjetas", async importOriginal => ({
    ...(await importOriginal()),
    obtenerSeleccionada: vi.fn(),
}));
vi.mock("../utils/direcciones", async importOriginal => ({
    ...(await importOriginal()),
    obtenerDireccionSeleccionada: vi.fn(),
}));

const carlos = { id: 2, nombre: "Carlos", apellido: "Calderon", correo: "carlos@email.com", rol: "USUARIO" };
const tarjetaCarlos = { id: 1, ultimos4: "4242", propietario: "Carlos", seleccionada: true };
const direccionCarlos = {
    id: 1, calle: "Av. Libertad 1234", referencia: "", comuna: "Viña del Mar", region: "Valparaíso", seleccionada: true,
};

const itemFigura = (cantidad = 1) => ({
    clave: "figura-1", tipo: "figura", productoId: 1, nombre: "Lucia Crimson Abyss",
    precio: 127000, stock: 2, img: "/lucia.webp", cantidad,
});
const itemTomo = {
    clave: "manga-1-1", tipo: "manga", productoId: 1, tomo: 1, nombre: "BOCCHI THE ROCK - Tomo 1",
    precio: 14990, stock: 8, img: "/b1.jpg", cantidad: 2,
};

const GRACIAS = total => `¡Gracias por tu compra! Total: ${formatearPrecio(total)}`;

beforeEach(() => {
    vi.clearAllMocks();
    registrarVenta.mockResolvedValue({ id: "p1", total: 127000 });
    obtenerSeleccionada.mockResolvedValue(null);
    obtenerDireccionSeleccionada.mockResolvedValue(null);
});

// Deja productos en el carrito guardado y muestra la página, con o sin sesión
function renderCarrito(productos = [], usuario = null) {
    localStorage.setItem("carritoAnimate", JSON.stringify(productos));
    const sesion = {
        usuario, cargando: false, esAdmin: false,
        login: vi.fn(), logout: vi.fn(), refrescarSesion: vi.fn(),
    };
    render(
        <AuthContext.Provider value={sesion}>
            <MemoryRouter>
                <CarritoProvider>
                    <Carrito />
                </CarritoProvider>
            </MemoryRouter>
        </AuthContext.Provider>
    );
    return userEvent.setup();
}

const silenciarAlertas = () => vi.spyOn(window, "alert").mockImplementation(() => {});
const itemDe = nombre => within(screen.getByText(nombre).closest(".border-bottom"));

describe("contenido del carrito", () => {
    it("vacío muestra el aviso, total $0 y no deja finalizar", async () => {
        const alerta = silenciarAlertas();
        const user = renderCarrito();

        expect(screen.getByText("Tu carrito está vacío.")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: `Total: ${formatearPrecio(0)}` })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));
        expect(alerta).toHaveBeenCalledWith("Tu carrito está vacío.");
    });

    it("muestra cada producto y el total", () => {
        renderCarrito([itemFigura(), itemTomo]);

        expect(screen.getByText("Lucia Crimson Abyss")).toBeInTheDocument();
        expect(screen.getByText("BOCCHI THE ROCK - Tomo 1")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: `Total: ${formatearPrecio(127000 + 14990 * 2)}` })).toBeInTheDocument();
    });

    it("los botones + y − cambian la cantidad, y en cero quitan el producto", async () => {
        const user = renderCarrito([itemFigura()]);

        await user.click(itemDe("Lucia Crimson Abyss").getByRole("button", { name: "+" }));
        expect(itemDe("Lucia Crimson Abyss").getByText("2")).toBeInTheDocument();

        await user.click(itemDe("Lucia Crimson Abyss").getByRole("button", { name: "−" }));
        await user.click(itemDe("Lucia Crimson Abyss").getByRole("button", { name: "−" }));
        expect(screen.getByText("Tu carrito está vacío.")).toBeInTheDocument();
    });

    it("no deja sumar más unidades que el stock que trajo el producto", async () => {
        const alerta = silenciarAlertas();
        const user = renderCarrito([itemFigura(2)]); // stock 2

        await user.click(itemDe("Lucia Crimson Abyss").getByRole("button", { name: "+" }));

        expect(alerta).toHaveBeenCalledWith("No quedan más unidades de este producto.");
        expect(itemDe("Lucia Crimson Abyss").getByText("2")).toBeInTheDocument();
    });

    it("Eliminar quita el producto", async () => {
        const user = renderCarrito([itemFigura(), itemTomo]);

        await user.click(itemDe("Lucia Crimson Abyss").getByRole("button", { name: "Eliminar" }));

        expect(screen.queryByText("Lucia Crimson Abyss")).toBeNull();
        expect(screen.getByText("BOCCHI THE ROCK - Tomo 1")).toBeInTheDocument();
    });
});

describe("compra como invitado", () => {
    it("ingresa dirección y tarjeta, y el backend confirma la compra", async () => {
        const alerta = silenciarAlertas();
        const user = renderCarrito([itemFigura()]);

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

        // Solo viajan los últimos 4 dígitos de la tarjeta; false = compra sin sesión
        expect(registrarVenta).toHaveBeenCalledWith(
            [itemFigura()],
            expect.objectContaining({ ultimos4: "4242", propietario: "Ana Gonzales" }),
            expect.objectContaining({ calle: "Av. Libertad 1234", comuna: "Viña del Mar", region: "Valparaíso" }),
            false
        );
        expect(registrarVenta.mock.calls[0][1]).not.toHaveProperty("numero");
        await waitFor(() => expect(alerta).toHaveBeenCalledWith(GRACIAS(127000)));
        expect(await screen.findByText("Tu carrito está vacío.")).toBeInTheDocument();
    });

    it("puede cancelar el pago sin perder el carrito", async () => {
        const user = renderCarrito([itemFigura()]);

        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));
        const ventana = await screen.findByRole("dialog");
        await user.click(within(ventana).getByRole("button", { name: "Cancelar" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.getByText("Lucia Crimson Abyss")).toBeInTheDocument();
    });

    it("si el backend rechaza la compra (sin stock), avisa y conserva el carrito", async () => {
        const alerta = silenciarAlertas();
        registrarVenta.mockRejectedValueOnce(new Error("No fue posible confirmar los productos o el stock. Revisa tu carrito."));
        const user = renderCarrito([itemFigura()]);

        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));
        const ventana = await screen.findByRole("dialog");
        await user.type(within(ventana).getByPlaceholderText("Ej: Av. Libertad 1234"), "Av. Libertad 1234");
        await user.type(within(ventana).getByPlaceholderText("Ej: Viña del Mar"), "Viña del Mar");
        await user.selectOptions(within(ventana).getByRole("combobox"), "Valparaíso");
        await user.click(within(ventana).getByRole("button", { name: "Continuar" }));
        await user.type(within(ventana).getByPlaceholderText("1234 5678 9012 3456"), "4242 4242 4242 4242");
        await user.type(within(ventana).getByPlaceholderText("123"), "123");
        await user.type(within(ventana).getByPlaceholderText("Nombre como aparece en la tarjeta"), "Ana Gonzales");
        await user.click(within(ventana).getByRole("button", { name: "Pagar" }));

        await waitFor(() => expect(alerta).toHaveBeenCalledWith("No fue posible confirmar los productos o el stock. Revisa tu carrito."));
        expect(screen.getAllByText("Lucia Crimson Abyss").length).toBeGreaterThan(0);
    });
});

describe("compra con sesión", () => {
    it("sin tarjeta ni dirección seleccionadas avisa, enlaza al perfil y no compra", async () => {
        const alerta = silenciarAlertas();
        const user = renderCarrito([itemFigura()], carlos);

        expect(await screen.findByText("No tienes una tarjeta seleccionada.")).toBeInTheDocument();
        expect(screen.getByText("No tienes una dirección seleccionada.")).toBeInTheDocument();
        screen.getAllByRole("link", { name: "Ir a mi perfil" }).forEach(enlace => {
            expect(enlace).toHaveAttribute("href", "/perfil");
        });

        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));

        expect(alerta).toHaveBeenCalledWith("Selecciona o registra una tarjeta en tu perfil antes de comprar.");
        expect(registrarVenta).not.toHaveBeenCalled();
    });

    it("con tarjeta y dirección del perfil compra directo, con sesión", async () => {
        const alerta = silenciarAlertas();
        obtenerSeleccionada.mockResolvedValue(tarjetaCarlos);
        obtenerDireccionSeleccionada.mockResolvedValue(direccionCarlos);
        const user = renderCarrito([itemFigura()], carlos);

        expect(await screen.findByText("Se pagará con **** **** **** 4242 (Carlos)")).toBeInTheDocument();
        expect(screen.getByText("Se enviará a Av. Libertad 1234, Viña del Mar, Valparaíso")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));

        expect(registrarVenta).toHaveBeenCalledWith([itemFigura()], tarjetaCarlos, direccionCarlos, true);
        await waitFor(() => expect(alerta).toHaveBeenCalledWith(GRACIAS(127000)));
        expect(await screen.findByText("Tu carrito está vacío.")).toBeInTheDocument();
    });

    it("con tarjeta pero sin dirección avisa y no compra", async () => {
        const alerta = silenciarAlertas();
        obtenerSeleccionada.mockResolvedValue(tarjetaCarlos);
        const user = renderCarrito([itemFigura()], carlos);
        await screen.findByText("Se pagará con **** **** **** 4242 (Carlos)");

        await user.click(screen.getByRole("button", { name: "Finalizar compra" }));

        expect(alerta).toHaveBeenCalledWith("Selecciona o registra una dirección de envío en tu perfil antes de comprar.");
        expect(registrarVenta).not.toHaveBeenCalled();
    });
});