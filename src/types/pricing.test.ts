import { describe, it, expect } from 'vitest';
import { calcCostoPorUnidadReceta, calcCostoLinea } from './index';
import type { Ingrediente, RecetaIngrediente, Receta } from './index';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeIngrediente(overrides: Partial<Ingrediente> = {}): Ingrediente {
  return {
    id: 'ing-1', nombre: 'Harina', categoria: 'Harinas',
    precio_compra: 1500, cantidad_empaque: 1,
    unidad_medida_compra: 'Kg', unidad_medida_receta: 'Gramos',
    factor_conversion: 1000, merma_porcentaje: 0,
    created_at: '', updated_at: '',
    ...overrides,
  };
}

function makeLinea(ingrediente_id: string, cantidad_usada: number): RecetaIngrediente {
  return { id: 'li-1', receta_id: 'r-1', ingrediente_id, cantidad_usada };
}

function makeReceta(overrides: Partial<Receta> = {}): Receta {
  return {
    id: 'r-1', nombre: 'Cheesecake', rinde_porciones: 8,
    modo_venta: 'entero', tiempo_prep_minutos: 60,
    costo_packaging_fijo: 0, margen_ganancia_porcentaje: 100,
    created_at: '', updated_at: '',
    ...overrides,
  };
}

/** Reproduce la fórmula de RecetaBuilder/Dashboard exactamente */
function calcPrecioFinal(
  receta: Receta,
  lineas: RecetaIngrediente[],
  ingredientes: Ingrediente[],
  config: { valor_hora_trabajo: number; costo_fijo_por_hora: number },
) {
  const ingMap = Object.fromEntries(ingredientes.map(i => [i.id, i]));
  const costoIng = lineas.reduce((s, li) => {
    const ing = ingMap[li.ingrediente_id];
    return ing ? s + calcCostoLinea(li, ing) : s;
  }, 0);
  const h = receta.tiempo_prep_minutos / 60;
  const costoMO      = h * config.valor_hora_trabajo;
  const costoFijo    = h * config.costo_fijo_por_hora;
  const costoTotal   = costoIng + costoMO + costoFijo + receta.costo_packaging_fijo;
  const precioVenta  = costoTotal * (1 + receta.margen_ganancia_porcentaje / 100);
  const ganancia     = precioVenta - costoTotal;
  const unidades     = Math.max(receta.rinde_porciones, 1);
  const precioPorUnidad = precioVenta / unidades;
  return { costoIng, costoMO, costoFijo, costoTotal, precioVenta, ganancia, precioPorUnidad };
}

const CONFIG = { valor_hora_trabajo: 500, costo_fijo_por_hora: 100 };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Cálculo de precio de venta', () => {

  it('con margen 100%, el precio de venta es el doble del costo total', () => {
    const harina = makeIngrediente();                     // $1.5/g
    const linea  = makeLinea(harina.id, 500);             // 500g = $750
    const receta = makeReceta({ tiempo_prep_minutos: 0, costo_packaging_fijo: 0, margen_ganancia_porcentaje: 100 });
    const r = calcPrecioFinal(receta, [linea], [harina], { valor_hora_trabajo: 0, costo_fijo_por_hora: 0 });
    // costoTotal = $750, precioVenta = $750 * 2 = $1500
    expect(r.costoTotal).toBeCloseTo(750);
    expect(r.precioVenta).toBeCloseTo(1500);
    expect(r.ganancia).toBeCloseTo(750);
  });

  it('con margen 0%, el precio de venta es igual al costo total (sin ganancia)', () => {
    const harina = makeIngrediente();
    const linea  = makeLinea(harina.id, 200);             // 200g = $300
    const receta = makeReceta({ tiempo_prep_minutos: 0, costo_packaging_fijo: 0, margen_ganancia_porcentaje: 0 });
    const r = calcPrecioFinal(receta, [linea], [harina], { valor_hora_trabajo: 0, costo_fijo_por_hora: 0 });
    expect(r.precioVenta).toBeCloseTo(r.costoTotal);
    expect(r.ganancia).toBeCloseTo(0);
  });

  it('el costo de mano de obra se suma correctamente (60 min = 1 hora)', () => {
    const receta = makeReceta({ tiempo_prep_minutos: 60, costo_packaging_fijo: 0, margen_ganancia_porcentaje: 0 });
    const r = calcPrecioFinal(receta, [], [], CONFIG);
    // costoMO = 1h * $500 = $500, costoFijo = 1h * $100 = $100
    expect(r.costoMO).toBeCloseTo(500);
    expect(r.costoFijo).toBeCloseTo(100);
    expect(r.costoTotal).toBeCloseTo(600);
  });

  it('el empaque se suma al costo total', () => {
    const receta = makeReceta({ tiempo_prep_minutos: 0, costo_packaging_fijo: 250, margen_ganancia_porcentaje: 0 });
    const r = calcPrecioFinal(receta, [], [], { valor_hora_trabajo: 0, costo_fijo_por_hora: 0 });
    expect(r.costoTotal).toBeCloseTo(250);
  });

  it('receta con múltiples ingredientes suma todos los costos', () => {
    const harina   = makeIngrediente({ id: 'h', precio_compra: 1500, cantidad_empaque: 1, factor_conversion: 1000 }); // $1.5/g
    const manteca  = makeIngrediente({ id: 'm', precio_compra: 2000, cantidad_empaque: 1, factor_conversion: 1000 }); // $2/g
    const lineas   = [makeLinea('h', 250), makeLinea('m', 100)];  // $375 + $200 = $575
    const receta   = makeReceta({ tiempo_prep_minutos: 0, costo_packaging_fijo: 0, margen_ganancia_porcentaje: 0 });
    const r = calcPrecioFinal(receta, lineas, [harina, manteca], { valor_hora_trabajo: 0, costo_fijo_por_hora: 0 });
    expect(r.costoIng).toBeCloseTo(575);
    expect(r.costoTotal).toBeCloseTo(575);
  });

});

describe('modo_venta: entero vs por_unidad', () => {

  const harina  = makeIngrediente();                   // $1.5/g
  const linea   = makeLinea(harina.id, 1000);          // 1000g = $1500
  const noConfig = { valor_hora_trabajo: 0, costo_fijo_por_hora: 0 };

  it('modo entero: precioPorUnidad = precioVenta / rinde_porciones', () => {
    const receta = makeReceta({
      modo_venta: 'entero',
      rinde_porciones: 8,
      tiempo_prep_minutos: 0,
      margen_ganancia_porcentaje: 100,
    });
    const r = calcPrecioFinal(receta, [linea], [harina], noConfig);
    // costoTotal = $1500, precioVenta = $3000, precioPorUnidad = $3000/8 = $375
    expect(r.precioVenta).toBeCloseTo(3000);
    expect(r.precioPorUnidad).toBeCloseTo(375);
  });

  it('modo por_unidad: precioPorUnidad es el precio que se cobra por cada pieza', () => {
    const receta = makeReceta({
      modo_venta: 'por_unidad',
      rinde_porciones: 3,                              // 3 lemon pies
      tiempo_prep_minutos: 0,
      margen_ganancia_porcentaje: 100,
    });
    const r = calcPrecioFinal(receta, [linea], [harina], noConfig);
    // costoTotal = $1500, precioVenta lote = $3000, por pie = $1000
    expect(r.precioVenta).toBeCloseTo(3000);
    expect(r.precioPorUnidad).toBeCloseTo(1000);
  });

  it('con rinde_porciones = 1, precioPorUnidad == precioVenta', () => {
    const receta = makeReceta({ rinde_porciones: 1, tiempo_prep_minutos: 0, margen_ganancia_porcentaje: 0 });
    const r = calcPrecioFinal(receta, [linea], [harina], noConfig);
    expect(r.precioPorUnidad).toBeCloseTo(r.precioVenta);
  });

  it('un lote de por_unidad tiene el mismo costoTotal que un entero con los mismos ingredientes', () => {
    const recetaEntero    = makeReceta({ modo_venta: 'entero',     rinde_porciones: 6, tiempo_prep_minutos: 0, margen_ganancia_porcentaje: 0 });
    const recetaPorUnidad = makeReceta({ modo_venta: 'por_unidad', rinde_porciones: 6, tiempo_prep_minutos: 0, margen_ganancia_porcentaje: 0 });
    const rE = calcPrecioFinal(recetaEntero,    [linea], [harina], noConfig);
    const rU = calcPrecioFinal(recetaPorUnidad, [linea], [harina], noConfig);
    // El costo de producción es el mismo en ambos modos — solo cambia cómo se presenta el precio
    expect(rE.costoTotal).toBeCloseTo(rU.costoTotal);
  });

});

describe('Margen de ganancia', () => {

  const config = { valor_hora_trabajo: 0, costo_fijo_por_hora: 0 };
  const harina = makeIngrediente();
  const linea  = makeLinea(harina.id, 1000); // costoIng = $1500

  it('margen 50%: precio = costo * 1.5', () => {
    const receta = makeReceta({ tiempo_prep_minutos: 0, costo_packaging_fijo: 0, margen_ganancia_porcentaje: 50 });
    const r = calcPrecioFinal(receta, [linea], [harina], config);
    expect(r.precioVenta).toBeCloseTo(2250); // $1500 * 1.5
  });

  it('margen 150%: precio = costo * 2.5', () => {
    const receta = makeReceta({ tiempo_prep_minutos: 0, costo_packaging_fijo: 0, margen_ganancia_porcentaje: 150 });
    const r = calcPrecioFinal(receta, [linea], [harina], config);
    expect(r.precioVenta).toBeCloseTo(3750); // $1500 * 2.5
  });

  it('la ganancia aumenta proporcionalmente con el margen', () => {
    const r100 = calcPrecioFinal(makeReceta({ tiempo_prep_minutos: 0, margen_ganancia_porcentaje: 100 }), [linea], [harina], config);
    const r200 = calcPrecioFinal(makeReceta({ tiempo_prep_minutos: 0, margen_ganancia_porcentaje: 200 }), [linea], [harina], config);
    expect(r200.ganancia).toBeGreaterThan(r100.ganancia);
  });

  it('receta sin ingredientes ni tiempo tiene costo cero', () => {
    const receta = makeReceta({ tiempo_prep_minutos: 0, costo_packaging_fijo: 0 });
    const r = calcPrecioFinal(receta, [], [], config);
    expect(r.costoTotal).toBe(0);
    expect(r.precioVenta).toBe(0);
  });

});
