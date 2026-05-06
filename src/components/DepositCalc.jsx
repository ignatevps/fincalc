import { useState } from "react";

export default function Deposit() {
  const [amount, setAmount] = useState(100000);
  const [term, setTerm] = useState(1);
  const [termUnit, setTermUnit] = useState("years");
  const [rate, setRate] = useState(14);
  const [openDate, setOpenDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [withCapitalization, setWithCapitalization] = useState(false);
  const [frequency, setFrequency] = useState("monthly");

  const amountNum = Number(amount);
  const rateNum = Number(rate);
  const termNum = Number(term);
  const dates = [];
  const start = new Date(openDate);
  const years = termUnit === "years" ? termNum : termNum / 12;
  const n = { monthly: 12, quarterly: 4, yearly: 1, daily: 365 }[frequency];
  const periods = Math.floor(years * n);
  const byYear = {};

  for (let i = 1; i <= periods; i++) {
    const d = new Date(start);
    if (frequency === "daily") {
      d.setDate(d.getDate() + i);
    } else {
      d.setMonth(d.getMonth() + i * (12 / n));
    }
    dates.push(d);
  }

  const endDate = new Date(start);
  if (termUnit === "years") {
    endDate.setFullYear(endDate.getFullYear() + termNum);
  } else {
    endDate.setMonth(endDate.getMonth() + termNum);
  }
  const totalDays = Math.round((endDate - start) / (1000 * 60 * 60 * 24));

  function daysInYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
  }

  function calcInterest(i, year, balance) {
    const prevDate = i === 0 ? start : dates[i - 1];
    const days = Math.round((dates[i] - prevDate) / (1000 * 60 * 60 * 24));
    return ((balance * (rateNum / 100)) / daysInYear(year)) * days;
  }

  let balance = amountNum;
  if (withCapitalization) {
    for (let i = 0; i < dates.length; i++) {
      const year = dates[i].getFullYear();
      const interestThisPeriod = calcInterest(i, year, balance);
      balance += interestThisPeriod;
      byYear[year] = (byYear[year] || 0) + interestThisPeriod;
    }
  } else if (frequency === "end") {
    balance +=
      ((amountNum * (rateNum / 100)) / daysInYear(endDate.getFullYear())) *
      totalDays;
    byYear[endDate.getFullYear()] = balance - amountNum;
  } else {
    for (let i = 0; i < dates.length; i++) {
      const year = dates[i].getFullYear();
      const interestThisPeriod = calcInterest(i, year, amountNum);
      byYear[year] = (byYear[year] || 0) + interestThisPeriod;
    }
  }

  const interest = Object.values(byYear).reduce((sum, v) => sum + v, 0);
  const total = amountNum + interest;
  const effectiveRate = (interest / amountNum / (totalDays / 365.25)) * 100;

  return (
    <div className="calc-wrapper">
      <a href="/">Назад</a>
      <h1 className="calc-title">Калькулятор вклада</h1>
      <div>
        <div className="field">
          <label htmlFor="amount">Сумма вклада: </label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            id="amount"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="term">Срок вклада: </label>
          <div className="field-row">
            <input
              type="number"
              step="1"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              id="term"
              required
            />
            <select
              name="termUnit"
              value={termUnit}
              onChange={(e) => setTermUnit(e.target.value)}
            >
              <option value="years">Лет</option>
              <option value="months">Месяцев</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="rate">Процентная ставка, % годовых: </label>
          <input
            type="number"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            id="rate"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="openDate">Дата открытия: </label>
          <input
            type="date"
            value={openDate}
            onChange={(e) => setOpenDate(e.target.value)}
            id="openDate"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="withCapitalization">Капитализация процентов</label>
          <input
            type="checkbox"
            name="withCapitalization"
            checked={withCapitalization}
            id="withCapitalization"
            onChange={(e) => {
              setFrequency("monthly");
              setWithCapitalization(e.target.checked);
            }}
          />
        </div>
        <div className="field">
          <label>
            {withCapitalization
              ? "Периодичность капитализации:"
              : "Периодичность выплат:"}
          </label>
          <select
            name="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            {withCapitalization ? (
              <>
                <option value="daily">Ежедневно</option>
                <option value="monthly">Ежемесячно</option>
                <option value="quarterly">Ежеквартально</option>
                <option value="yearly">Ежегодно</option>
              </>
            ) : (
              <>
                <option value="monthly">Ежемесячно</option>
                <option value="quarterly">Ежеквартально</option>
                <option value="yearly">Ежегодно</option>
                <option value="end">В конце срока</option>
              </>
            )}
          </select>
        </div>
      </div>
      <div>
        <p>
          Сумма в конце срока:{" "}
          {total.toLocaleString("ru-RU", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          ₽
        </p>
        <p>
          Доход:{" "}
          {interest.toLocaleString("ru-RU", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          ₽
        </p>
        {withCapitalization && (
          <p>
            Эффективная ставка:{" "}
            {effectiveRate.toLocaleString("ru-RU", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            %
          </p>
        )}
        <div>
          <p>Доход по годам:</p>
          {Object.entries(byYear).map(([year, amount]) => (
            <p key={year}>
              {year}:{" "}
              {amount.toLocaleString("ru-RU", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ₽
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
