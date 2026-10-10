export const theme = {
  colors: {
    bg: '#07070c',
    panel: '#12121f',
    panel2: '#17172a',
    border: '#262640',
    text: '#f4f4fb',
    muted: '#9a9ab5',
    brand: '#7c3aed',
    brand2: '#ec4899',
    accent: '#22d3ee',
    green: '#22c55e',
    red: '#ef4444',
    yellow: '#f59e0b',
    white: '#ffffff',
  },
  radius: { sm: 10, md: 16, lg: 22, pill: 999 },
  space: (n: number) => n * 4,
} as const;

export const storeLabel = (m: string) =>
  m === 'mercadolivre' ? 'Mercado Livre' : m === 'shopee' ? 'Shopee' : 'Amazon';

export const storeColor = (m: string) =>
  m === 'mercadolivre' ? '#ffe600' : m === 'shopee' ? '#ee4d2d' : '#ff9900';
