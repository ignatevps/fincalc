import cpiData from "../data/cpi.json";
import { useState } from "react";

export default function Inflation() {
  const [amount, setAmount] = useState(100000);
  const [periodFrom, setPeriodFrom] = useState("2020-01");
  const [periodTo, setPeriodTo] = useState("2026-03");
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
      <a href="/">Назад</a>
      <h1 className="calc-title">Калькулятор инфляции</h1>
      <div>
        <div className="field">
          <label htmlFor="amount">Сумма: </label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            name="amount"
            id="amount"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="period_from">Начало периода: </label>
          <input
            type="month"
            name="period_from"
            value={periodFrom}
            min="1991-01"
            max="2026-03"
            id="period_from"
            onChange={(e) => {
              if (e.target.value > periodTo) setPeriodTo("");
              setPeriodFrom(e.target.value);
            }}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="period_to">Конец периода: </label>
          <input
            type="month"
            name="period_to"
            value={periodTo}
            min={periodFrom}
            max="2026-03"
            id="period_to"
            onChange={(e) => setPeriodTo(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <input
            type="radio"
            name="mode"
            value="salary"
            id="salary"
            onChange={(e) => setMode(e.target.value)}
            checked={mode === "salary"}
          />
          <label htmlFor="salary">Изменение зарплаты / цен</label>
          <input
            type="radio"
            name="mode"
            value="savings"
            id="savings"
            onChange={(e) => setMode(e.target.value)}
            checked={mode === "savings"}
          />
          <label htmlFor="savings">Обесценивание сбережений</label>
        </div>
      </div>
      <div className="result">
        <p>Инфляция за период: {result.inflation} %</p>
        <p>
          {result.mode === "salary" ? "Зарплата/цена:" : "Сбережения:"}{" "}
          {result.amount.toLocaleString("ru-RU", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          ₽ ({result.periodFrom}) →{" "}
          {result.calculated.toLocaleString("ru-RU", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          ₽ ({result.periodTo})
        </p>
      </div>
    </div>
  );
}
