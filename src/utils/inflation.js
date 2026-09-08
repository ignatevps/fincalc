import cpiData from "../data/cpi.json";

// Monthly indices compound, so the average of a stretch of them is geometric:
// averaging the percentages arithmetically would overstate the figure.
export function averageInflation(years) {
  const keys = Object.keys(cpiData).sort();
  const window = keys.slice(-years * 12);
  if (window.length === 0) return 0;

  const product = window.reduce((acc, key) => acc * (cpiData[key] / 100), 1);
  return (product ** (1 / (window.length / 12)) - 1) * 100;
}

// What a stream of future payments is worth in today's money. A payment made
// twenty years from now is made in much cheaper rubles, so comparing the raw
// sum of payments against the amount borrowed today overstates the cost.
export function presentValue(entries, start, inflationRate) {
  const from = new Date(start);
  const factor = 1 + inflationRate / 100;
  const yearMs = 365.25 * 24 * 60 * 60 * 1000;

  return entries.reduce((sum, { date, amount }) => {
    const years = (new Date(date) - from) / yearMs;
    return sum + amount / factor ** years;
  }, 0);
}

// Cumulative change over a range of whole years, from a table of yearly indices
// stated as a percentage of the previous year. Indices compound, so they are
// multiplied rather than added — the same reason the monthly ones are.
export function cumulative(indices, from, to) {
  let product = 1;
  for (let year = from; year <= to; year++) {
    const index = indices[year];
    if (index) product *= index / 100;
  }
  return (product - 1) * 100;
}

// Inflation over the same range of whole years, from the monthly CPI.
export function inflationOver(from, to) {
  const keys = Object.keys(cpiData).filter((key) => {
    const year = Number(key.slice(0, 4));
    return year >= from && year <= to;
  });
  const product = keys.reduce((acc, key) => acc * (cpiData[key] / 100), 1);
  return (product - 1) * 100;
}

// How much a price outran inflation: growth of 50% against inflation of 30%
// leaves about 15% of real gain, not 20 — the two compound against each other.
export function realChange(nominalPercent, inflationPercent) {
  return ((1 + nominalPercent / 100) / (1 + inflationPercent / 100) - 1) * 100;
}
