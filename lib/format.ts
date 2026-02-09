export const formatCurrency = (value: number, maxFraction = 0) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: maxFraction,
    minimumFractionDigits: maxFraction,
  }).format(value);
};

export const formatCompact = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatCurrencyInput = (raw: string) => {
  if (!raw) {
    return '$0';
  }

  const [intPartRaw, decPart] = raw.split('.');
  const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || '0';
  const intFormatted = Number(intPart).toLocaleString('en-US');

  if (decPart !== undefined) {
    return `$${intFormatted}.${decPart}`;
  }

  return `$${intFormatted}`;
};

export const parseCurrencyInput = (raw: string) => {
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatPercent = (value: number, digits = 2) => {
  return `${value.toFixed(digits)}%`;
};
