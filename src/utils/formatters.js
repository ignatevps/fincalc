export function formatNumber(number) {
  return number.toLocaleString("ru-RU", { maximumFractionDigits: 0 });
}

export function formatCurrency(number) {
  return number.toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

// For a sum that is paid exactly, not estimated: the amount that closes a loan.
// Kopecks are kept, and the value is expected to be rounded up beforehand —
// a ruble short leaves the debt open and interest still running on it.
export function formatExactCurrency(number) {
  return number.toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
