import { describe, it, expect, vi } from "vitest";
import { obtenerVentas, obtenerVentasDe, registrarVenta, cambiarCorreoVentas } from "./ventas";

const carrito = [
    { clave: "figura-1", nombre: "Lucia Crimson Abyss", cantidad: 2, precio: 127000, img: "/a.webp" },
];
const ana = { correo: "ana@email.com" };
const direccion = { calle: "Av. Libertad 1234", referencia: "Depto 502", comuna: "Viña del Mar", region: "Valparaíso" };
const tarjeta = { ultimos4: "1234" };

describe("ventas", () => {
    it("parte sin ventas", () => {
        expect(obtenerVentas()).toEqual([]);
    });

    it("registra una venta guardando solo lo necesario", () => {
        vi.spyOn(Date, "now").mockReturnValue(1000);

        registrarVenta(carrito, 254000, ana, tarjeta,direccion);

        expect(obtenerVentas()[0]).toMatchObject({
            id: 1000,
            comprador: "ana@email.com",
            tarjeta: "**** 1234",
            productos: [{ nombre: "Lucia Crimson Abyss", cantidad: 2, precio: 127000 }],
            total: 254000,
        });
        expect(typeof obtenerVentas()[0].fecha).toBe("string");
    });

    it("registra como Invitado una compra sin sesión", () => {
        registrarVenta(carrito, 254000, null, tarjeta,direccion);
        expect(obtenerVentas()[0].comprador).toBe("Invitado");
    });

    it("muestra las compras de un usuario de la más nueva a la más antigua", () => {
        registrarVenta(carrito, 1000, ana, tarjeta,direccion);
        registrarVenta(carrito, 2000, { correo: "otro@email.com" }, tarjeta,direccion);
        registrarVenta(carrito, 3000, ana, tarjeta,direccion);

        expect(obtenerVentasDe("ANA@email.com").map(v => v.total)).toEqual([3000, 1000]);
    });

    it("traspasa las compras al correo nuevo", () => {
        registrarVenta(carrito, 1000, ana, tarjeta,direccion);

        cambiarCorreoVentas("ana@email.com", "ana.nueva@email.com");

        expect(obtenerVentasDe("ana@email.com")).toHaveLength(0);
        expect(obtenerVentasDe("ana.nueva@email.com")).toHaveLength(1);
    });
});