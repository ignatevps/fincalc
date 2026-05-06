import { useState } from "react";
import buildSchedule from "../utils/loanSchedule";

export default function Mortgage() {
  const [propertyPrice, setPropertyPrice] = useState(6000000);
  const [downPayment, setDownPayment] = useState(1200000);
  const [downPaymentUnit, setDownPaymentUnit] = useState("rub");
  const [rate, setRate] = useState(18);
  const [term, setTerm] = useState(20);
  const [termUnit, setTermUnit] = useState("years");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [paymentType, setPaymentType] = useState("annuity");

  const rateNum = Number(rate);
  const termNum = Number(term);
  const start = new Date(issueDate);
  const dates = [];
  const loanAmount =
    propertyPrice -
    (downPaymentUnit === "rub"
      ? downPayment
      : propertyPrice * (downPayment / 100));
  const r = rateNum / 12 / 100;
  const n = termUnit === "years" ? termNum * 12 : termNum;
  const factor = (1 + r) ** n;
  const baseAnnuity = (loanAmount * r * factor) / (factor - 1);

  for (let i = 1; i <= n; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    dates.push(d);
  }

  const schedule = buildSchedule(
    loanAmount,
    start,
    dates,
    baseAnnuity,
    rateNum,
    paymentType,
  );

  const totalPayment = schedule.reduce((sum, p) => sum + p.payment, 0);
  const overPayment = totalPayment - loanAmount;

  return (
    <div className="calc-wrapper">
      <a href="/">Назад</a>
      <h1 className="calc-title">Калькулятор ипотеки</h1>
      <div>
        <div className="field">
          <label htmlFor="propertyPrice">Стоимость недвижимости: </label>
          <input
            type="number"
            step="any"
            value={propertyPrice}
            onChange={(e) => setPropertyPrice(e.target.value)}
            name="propertyPrice"
            id="propertyPrice"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="downPayment">Первоначальный взнос: </label>
          <div className="field-row">
            <input
              type="number"
              step="any"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              name="downPayment"
              id="downPayment"
              required
            />
            <select
              name="downPaymentUnit"
              value={downPaymentUnit}
              onChange={(e) => setDownPaymentUnit(e.target.value)}
            >
              <option value="rub">₽</option>
              <option value="percent">%</option>
            </select>
          </div>
        </div>
        <div className="field">
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
        </div>
        <div className="field">
          <label>Сумма кредита: </label>
          <span>
            {loanAmount.toLocaleString("ru-RU", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ₽
          </span>
        </div>
        <div className="field">
          <label htmlFor="term">Срок кредита/займа: </label>
          <div className="field-row">
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
          </div>
        </div>
        <div className="field">
          <label htmlFor="issueDate">Дата выдачи: </label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            name="issueDate"
            id="issueDate"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="paymentType">Порядок погашения: </label>
          <select
            name="paymentType"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
          >
            <option value="annuity">Аннуитетный</option>
            <option value="differentiated">Дифференцированный</option>
          </select>
        </div>
      </div>
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
