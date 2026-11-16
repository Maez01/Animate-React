import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "../services/api";
import {
    registrarVenta,
    obtenerMisCompras,
    obtenerVentas,
    formatearFecha,
    cambiarEstadoPedido,
    SIGUIENTE_ESTADO,
} from "./ventas";

// Se reemplaza la conexión real con el backend por una función simulada:
// cada prueba decide qué "responde el backend" y revisa con qué datos se llamó.
vi.mock("../services/api", () => ({ api: vi.fn() }));

const carrito = [
    { clave: "manga-1-2", tipo: "manga", productoId: 1, tomo: 2, nombre: "Bocchi - Tomo 2", precio: 14990, cantidad: 2 },
    { clave: "figura-3", tipo: "figura", productoId: 3, nombre: "Lucia", precio: 127000, cantidad: 1 },
];
const tarjeta = { ultimos4: "3456", propietario: "Carlos Calderon" };
const direccion = { calle: "Av. Libertad 123", referencia: "Depto 4", comuna: "Viña del Mar", region: "Valparaíso" };

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

beforeEach(() => {
    api.mockReset();
    api.mockResolvedValue({});
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("registrarVenta", () => {
    it("con sesión envía a /pedidos solo los ids, tomos y cantidades", async () => {
        api.mockResolvedValue({ id: "abc", total: 156980 });

        const pedido = await registrarVenta(carrito, tarjeta, direccion, true);

        expect(pedido.total).toBe(156980);
        const [ruta, opciones] = api.mock.calls[0];
        expect(ruta).toBe("/pedidos");
        expect(opciones.metodo).toBe("POST");
        expect(opciones.cuerpo).toEqual({
            items: [
                { tipo: "MANGA", productoId: 1, tomo: 2, cantidad: 2 },
                { tipo: "FIGURA", productoId: 3, tomo: null, cantidad: 1 },
            ],
            direccion: "Av. Libertad 123, Depto 4, Viña del Mar, Valparaíso",
            tarjetaUltimos4: "3456",
        });
    });

    it("no envía precios: el total lo calcula el backend", async () => {
        await registrarVenta(carrito, tarjeta, direccion, true);

        const { cuerpo } = api.mock.calls[0][1];
        cuerpo.items.forEach(item => expect(item).not.toHaveProperty("precio"));
        expect(cuerpo).not.toHaveProperty("total");
    });

    it("sin sesión usa la ruta de compra como invitado", async () => {
        await registrarVenta(carrito, tarjeta, direccion, false);

        expect(api.mock.calls[0][0]).toBe("/pedidos/invitado");
    });

    it("cada compra lleva una Idempotency-Key distinta con formato UUID", async () => {
        await registrarVenta(carrito, tarjeta, direccion, true);
        await registrarVenta(carrito, tarjeta, direccion, true);

        const clave1 = api.mock.calls[0][1].cabeceras["Idempotency-Key"];
        const clave2 = api.mock.calls[1][1].cabeceras["Idempotency-Key"];
        expect(clave1).toMatch(FORMATO_UUID);
        expect(clave2).toMatch(FORMATO_UUID);
        expect(clave1).not.toBe(clave2);
    });

    it("genera la clave aunque el navegador no tenga crypto.randomUUID (página sin HTTPS)", async () => {
        const cryptoReal = globalThis.crypto;
        vi.stubGlobal("crypto", { getRandomValues: arreglo => cryptoReal.getRandomValues(arreglo) });

        await registrarVenta(carrito, tarjeta, direccion, true);

        expect(api.mock.calls[0][1].cabeceras["Idempotency-Key"]).toMatch(FORMATO_UUID);
    });

    it("si el backend rechaza la compra, el error llega a quien la pidió", async () => {
        api.mockRejectedValue(new Error("Stock insuficiente de Lucia."));

        await expect(registrarVenta(carrito, tarjeta, direccion, true)).rejects.toThrow("Stock insuficiente de Lucia.");
    });
});

describe("consultas de pedidos", () => {
    it("obtenerMisCompras pide las compras del usuario con sesión", async () => {
        api.mockResolvedValue([{ id: "a" }]);

        expect(await obtenerMisCompras()).toEqual([{ id: "a" }]);
        expect(api).toHaveBeenCalledWith("/pedidos/mios");
    });

    it("obtenerVentas pide todas las ventas (solo ADMIN)", async () => {
        api.mockResolvedValue([{ id: "a" }, { id: "b" }]);

        expect(await obtenerVentas()).toHaveLength(2);
        expect(api).toHaveBeenCalledWith("/pedidos");
    });
});

describe("estado de los pedidos", () => {
    it("solo CONFIRMADO y ENVIADO pueden avanzar", () => {
        expect(SIGUIENTE_ESTADO.CONFIRMADO).toBe("ENVIADO");
        expect(SIGUIENTE_ESTADO.ENVIADO).toBe("ENTREGADO");
        // ENTREGADO, RECHAZADO y PENDIENTE no tienen siguiente estado
        expect(Object.keys(SIGUIENTE_ESTADO)).toEqual(["CONFIRMADO", "ENVIADO"]);
    });

    it("cambiarEstadoPedido envía el nuevo estado con PUT", async () => {
        await cambiarEstadoPedido("abc", "ENVIADO");

        expect(api).toHaveBeenCalledWith("/pedidos/abc/estado", { metodo: "PUT", cuerpo: { estado: "ENVIADO" } });
    });
});

describe("formatearFecha", () => {
    it("convierte la fecha ISO del backend al formato chileno", () => {
        const fechaIso = "2026-11-15T03:44:00Z";

        expect(formatearFecha(fechaIso)).toBe(new Date(fechaIso).toLocaleString("es-CL"));
    });
});