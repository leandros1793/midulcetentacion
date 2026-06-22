/**
 * Formatea un número como moneda ARS.
 * Centralizado aquí para no duplicar la lógica en cada componente.
 */
export function formatARS(n: number, decimals: 0 | 2 | 4 = 2): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: decimals,
  }).format(n);
}
