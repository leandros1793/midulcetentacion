import { describe, it, expect } from 'vitest';
import { calcCostoPorUnidadReceta, calcCostoLinea } from './index';
import type { Ingrediente, RecetaIngrediente } from './index';

// ── Helpers para construir fixtures ──────────────────────────────────────────

function makeIngrediente(overrides: Partial<Ingrediente> = {}): Ingrediente {
  return {
    id: 'test-id',
    nombre: 'Harina 0000',
    categoria: 'Harinas',
    precio_compra: 1500,        // $1500 el paquete
    cantidad_empaque: 1,        // 1 Kg
    unidad_medida_compra: 'Kg',
    unidad_medida_receta: 'Gramos',
    factor_conversion: 1000,    // 1 Kg = 1000 g
    merma_porcentaje: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function makeLinea(overrides: Partial<RecetaIngrediente> = {}): RecetaIngrediente {
  return {
    id: 'linea-id',
    receta_id: 'receta-id',
    ingrediente_id: 'test-id',
    cantidad_usada: 250,        // 250 g
    ...overrides,
  };
}

// ── calcCostoPorUnidadReceta ──────────────────────────────────────────────────

describe('calcCostoPorUnidadReceta', () => {

  it('calcula correctamente sin merma — caso base (harina $1500/kg)', () => {
    const ing = makeIngrediente();
    // $1500 / (1 * 1000g) = $1.5 por gramo
    expect(calcCostoPorUnidadReceta(ing)).toBeCloseTo(1.5);
  });

  it('aplica el factor de merma correctamente', () => {
    const ing = makeIngrediente({ merma_porcentaje: 10 }); // 10% de desperdicio
    // $1.5/g base * 1.10 = $1.65/g
    expect(calcCostoPorUnidadReceta(ing)).toBeCloseTo(1.65);
  });

  it('maneja merma = 0 igual que sin merma', () => {
    const sinMerma = makeIngrediente({ merma_porcentaje: 0 });
    const conMermaCero = makeIngrediente({ merma_porcentaje: 0 });
    expect(calcCostoPorUnidadReceta(sinMerma)).toBeCloseTo(calcCostoPorUnidadReceta(conMermaCero));
  });

  it('calcula correctamente para litros (leche $600/litro)', () => {
    const leche = makeIngrediente({
      nombre: 'Leche entera',
      precio_compra: 600,
      cantidad_empaque: 1,
      unidad_medida_compra: 'Litro',
      unidad_medida_receta: 'Mililitros',
      factor_conversion: 1000,  // 1L = 1000ml
      merma_porcentaje: 0,
    });
    // $600 / 1000ml = $0.60 por ml
    expect(calcCostoPorUnidadReceta(leche)).toBeCloseTo(0.6);
  });

  it('calcula correctamente para unidades (huevo $200 c/u)', () => {
    const huevo = makeIngrediente({
      nombre: 'Huevo',
      precio_compra: 2400,      // docena
      cantidad_empaque: 12,     // 12 unidades en el paquete
      unidad_medida_compra: 'Unidad',
      unidad_medida_receta: 'Unidad',
      factor_conversion: 1,     // 1 a 1
      merma_porcentaje: 0,
    });
    // $2400 / (12 * 1) = $200 por huevo
    expect(calcCostoPorUnidadReceta(huevo)).toBeCloseTo(200);
  });

  it('merma del 5% en huevo aumenta el costo unitario', () => {
    const huevo = makeIngrediente({
      precio_compra: 2400,
      cantidad_empaque: 12,
      factor_conversion: 1,
      merma_porcentaje: 5,     // 5% de cascara/desperdicio
    });
    // $200 * 1.05 = $210
    expect(calcCostoPorUnidadReceta(huevo)).toBeCloseTo(210);
  });

  it('maneja precio de compra cero sin romperse', () => {
    const ing = makeIngrediente({ precio_compra: 0 });
    expect(calcCostoPorUnidadReceta(ing)).toBe(0);
  });

  it('maneja paquetes de más de 1 kg correctamente (azúcar 5kg $3500)', () => {
    const azucar = makeIngrediente({
      nombre: 'Azúcar',
      precio_compra: 3500,
      cantidad_empaque: 5,      // bolsa de 5 Kg
      factor_conversion: 1000,
      merma_porcentaje: 0,
    });
    // $3500 / (5 * 1000g) = $0.70 por gramo
    expect(calcCostoPorUnidadReceta(azucar)).toBeCloseTo(0.7);
  });

});

// ── calcCostoLinea ────────────────────────────────────────────────────────────

describe('calcCostoLinea', () => {

  it('calcula el costo de 250g de harina', () => {
    const harina = makeIngrediente();  // $1.5/g
    const linea  = makeLinea({ cantidad_usada: 250 });
    // 250g * $1.5/g = $375
    expect(calcCostoLinea(linea, harina)).toBeCloseTo(375);
  });

  it('calcula el costo de 0g (línea vacía) como cero', () => {
    const harina = makeIngrediente();
    const linea  = makeLinea({ cantidad_usada: 0 });
    expect(calcCostoLinea(linea, harina)).toBe(0);
  });

  it('calcula correctamente para 3 huevos', () => {
    const huevo = makeIngrediente({
      precio_compra: 2400,
      cantidad_empaque: 12,
      factor_conversion: 1,
      merma_porcentaje: 0,
    });
    const linea = makeLinea({ cantidad_usada: 3 });
    // 3 huevos * $200/huevo = $600
    expect(calcCostoLinea(linea, huevo)).toBeCloseTo(600);
  });

  it('el costo de línea con merma es mayor al costo sin merma', () => {
    const sinMerma  = makeIngrediente({ merma_porcentaje: 0 });
    const conMerma  = makeIngrediente({ merma_porcentaje: 20 });
    const linea     = makeLinea({ cantidad_usada: 100 });
    expect(calcCostoLinea(linea, conMerma)).toBeGreaterThan(calcCostoLinea(linea, sinMerma));
  });

  it('escala linealmente con la cantidad usada', () => {
    const harina  = makeIngrediente(); // $1.5/g
    const linea100 = makeLinea({ cantidad_usada: 100 });
    const linea200 = makeLinea({ cantidad_usada: 200 });
    expect(calcCostoLinea(linea200, harina)).toBeCloseTo(calcCostoLinea(linea100, harina) * 2);
  });

});
