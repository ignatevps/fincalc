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
