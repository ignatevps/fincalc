import cpiData from "../data/cpi.json";
import { useState } from "react";

export default function Inflation() {
  const [amount, setAmount] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [mode, setMode] = useState("salary");
  const [result, setResult] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
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
    setResult({
      amount: numAmount,
      calculated: Math.round(calculated * 100) / 100,
      inflation: Math.round((factor - 1) * 100 * 100) / 100,
      periodFrom,
      periodTo,
      mode,
    });
  }

  return (
    <div className="calc-wrapper">
      <a href="/">Назад</a>
      <h1 className="calc-title">Калькулятор инфляции</h1>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Рассчитать</button>
      </form>
      {result !== null && (
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
      )}
    </div>
  );
}
