import { useState } from "react";
import buildSchedule from "../utils/loanSchedule";

export default function Credit() {
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(19);
  const [term, setTerm] = useState(3);
  const [termUnit, setTermUnit] = useState("years");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [paymentType, setPaymentType] = useState("annuity");

  const amountNum = Number(amount);
  const rateNum = Number(rate);
  const termNum = Number(term);
  const start = new Date(issueDate);
  const dates = [];
  const r = rateNum / 12 / 100;
  const n = termUnit === "years" ? termNum * 12 : termNum;
  const factor = (1 + r) ** n;
  const baseAnnuity = (amountNum * r * factor) / (factor - 1);

  for (let i = 1; i <= n; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    dates.push(d);
  }

  const schedule = buildSchedule(
    amountNum,
    start,
    dates,
    baseAnnuity,
    rateNum,
    paymentType,
  );

  const totalPayment = schedule.reduce((sum, p) => sum + p.payment, 0);
  const overPayment = totalPayment - amountNum;

  return (
    <div className="calc-wrapper">
      <a href="/">Назад</a>
      <h1 className="calc-title">Кредитный калькулятор</h1>
      <form>
        <label htmlFor="amount">Сумма кредита/займа: </label>
        <input
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          name="amount"
          id="amount"
          required
        />
        <label htmlFor="rate">Процентная ставка, % годовых: </label>
        <input
          type="number"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          name="rate"
          id="rate"
          required
        />
        <label htmlFor="term">Срок кредита/займа: </label>
        <input
          type="number"
          step="1"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          name="term"
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
        <label htmlFor="issueDate">Дата выдачи: </label>
        <input
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
          name="issueDate"
          id="issueDate"
          required
        />
        <label htmlFor="paymentType">Порядок погашения: </label>
        <select
          name="paymentType"
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
        >
          <option value="annuity">Аннуитетный</option>
          <option value="differentiated">Дифференцированный</option>
        </select>
      </form>
      <div>
        {paymentType === "annuity" ? (
          <p>
            Ежемесячный платеж:{" "}
            {baseAnnuity.toLocaleString("ru-RU", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ₽
          </p>
        ) : (
          <p>
            Ежемесячный платеж: от{" "}
            {schedule[0].payment.toLocaleString("ru-RU", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ₽ до{" "}
            {schedule[schedule.length - 1].payment.toLocaleString("ru-RU", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ₽
          </p>
        )}
        <p>
          Всего выплат:{" "}
          {totalPayment.toLocaleString("ru-RU", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          ₽
        </p>
        <p>
          Переплата:{" "}
          {overPayment.toLocaleString("ru-RU", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          ₽
        </p>
      </div>
    </div>
  );
}
