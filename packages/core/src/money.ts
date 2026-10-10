/** Money helpers. All amounts are integers in the smallest currency unit. */

export function centsToBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents ?? 0) / 100);
}

export function brlToCents(value: string): number {
  const normalised = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const n = Number.parseFloat(normalised);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Round to the nearest cent, half away from zero. */
export function roundCents(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value) + Number.EPSILON);
}

/** Apply a percentage (0-100) to a cent amount, rounded to the nearest cent. */
export function percentOfCents(cents: number, percent: number): number {
  return roundCents((cents * percent) / 100);
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits).replace('.', ',')}%`;
}
