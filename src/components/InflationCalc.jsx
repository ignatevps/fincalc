import cpiData from "../data/cpi.json";
import { useState } from "react";
import { formatNumber, formatCurrency } from "../utils/formatters";

// Keys are YYYY-MM with a padded month, so sorting them as strings is already
// chronological. Computed once here rather than per render: the data is static,
// and the bounds move on their own whenever cpi.json is topped up.
const months = Object.keys(cpiData).sort();
const firstMonth = months[0];
const lastMonth = months[months.length - 1];

// The lists are built from the data itself, so a period without figures behind
// it cannot be picked at all. A native date input would only have restrained
// its own picker, and an out-of-range period counted as zero inflation without
// saying so.
const years = [...new Set(months.map((key) => key.slice(0, 4)))];

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

// Months available in a given year: the first and last years are partial.
function monthsIn(year) {
  return MONTH_NAMES.map((name, i) => ({
    name,
    value: String(i + 1).padStart(2, "0"),
  })).filter(({ value }) => cpiData[`${year}-${value}`]);
}

// Keeps the pair valid when a year changes under a month that it lacks.
function clampToData(year, month) {
  const available = monthsIn(year);
  if (available.some((m) => m.value === month)) return `${year}-${month}`;
  return `${year}-${available[available.length - 1].value}`;
}

export default function Inflation() {
  const [amount, setAmount] = useState(100000);
  const [periodFrom, setPeriodFrom] = useState("2020-01");
  const [periodTo, setPeriodTo] = useState(lastMonth);
  const [mode, setMode] = useState("salary");

  const numAmount = parseFloat(amount);
  const [fromYear, fromMonth] = periodFrom.split("-").map(Number);
  const [toYear, toMonth] = periodTo.split("-").map(Number);

  let factor = 1;
  let year = fromYear;
  let month = fromMonth;

  while (year < toYear || (year === toYear && month <= toMonth)) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    if (cpiData[key]) {
      factor *= cpiData[key] / 100;
    }
    month++;
    if (month === 13) {
      month = 1;
      year++;
    }
  }

  const calculated =
    mode === "salary" ? numAmount * factor : numAmount / factor;
  const result = {
    amount: numAmount,
    calculated: Math.round(calculated * 100) / 100,
    inflation: Math.round((factor - 1) * 100 * 100) / 100,
    periodFrom,
    periodTo,
    mode,
  };

  return (
    <div className="calc-wrapper">
      <div className="calc-form">
        <div className="field">
          <label htmlFor="amount">Сумма</label>
          <input
            type="text"
            step="any"
            value={formatNumber(amount)}
            onChange={(e) =>
              setAmount(Number(e.target.value.replace(/\D/g, "")))
            }
            name="amount"
            id="amount"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="from_month">Начало периода</label>
          <div className="field-row">
            <select
              id="from_month"
              value={periodFrom.slice(5)}
              onChange={(e) =>
                setPeriodFrom(`${periodFrom.slice(0, 4)}-${e.target.value}`)
              }
            >
              {monthsIn(periodFrom.slice(0, 4)).map(({ name, value }) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className="field-year"
              aria-label="Год начала периода"
              value={periodFrom.slice(0, 4)}
              onChange={(e) =>
                setPeriodFrom(clampToData(e.target.value, periodFrom.slice(5)))
              }
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="to_month">Конец периода</label>
          <div className="field-row">
            <select
              id="to_month"
              value={periodTo.slice(5)}
              onChange={(e) =>
                setPeriodTo(`${periodTo.slice(0, 4)}-${e.target.value}`)
              }
            >
              {monthsIn(periodTo.slice(0, 4)).map(({ name, value }) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className="field-year"
              aria-label="Год конца периода"
              value={periodTo.slice(0, 4)}
              onChange={(e) =>
                setPeriodTo(clampToData(e.target.value, periodTo.slice(5)))
              }
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field--full">
          <label className="radio-option">
            <input
              type="radio"
              name="mode"
              value="salary"
              onChange={(e) => setMode(e.target.value)}
              checked={mode === "salary"}
            />
            Изменение зарплаты / цен
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="mode"
              value="savings"
              onChange={(e) => setMode(e.target.value)}
              checked={mode === "savings"}
            />
            Обесценивание сбережений
          </label>
        </div>
      </div>
      <div className="result">
        <div className="result-item result-item--primary">
          <span className="result-label">Инфляция за период</span>
          <span className="result-value">{result.inflation} %</span>
        </div>
        <div className="result-item">
          <span className="result-label">
            {result.periodFrom.split("-").reverse().join("-")}
          </span>
          <span className="result-value">{formatCurrency(result.amount)}</span>
        </div>
        <span className="result-arrow"></span>
        <div className="result-item">
          <span className="result-label">
            {result.periodTo.split("-").reverse().join("-")}
          </span>
          <span className="result-value">
            {formatCurrency(result.calculated)}
          </span>
        </div>
      </div>
    </div>
  );
}
