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
  const [prepayments, setPrepayments] = useState([]);

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

  const { schedule, totalPrepaid } = buildSchedule(
    amountNum,
    start,
    dates,
    baseAnnuity,
    rateNum,
    paymentType,
    prepayments,
  );

  const totalPayment = schedule.reduce((sum, p) => sum + p.payment, 0);
  const overPayment = totalPayment + totalPrepaid - amountNum;

  function addPrepayment() {
    setPrepayments([
      ...prepayments,
      {
        date: issueDate,
        amount: 0,
        type: "reduce_payment",
        repeat: false,
      },
    ]);
  }

  function updatePrepayment(index, field, value) {
    setPrepayments(
      prepayments.map((pp, i) =>
        i === index ? { ...pp, [field]: value } : pp,
      ),
    );
  }

  function removePrepayment(index) {
    setPrepayments(prepayments.filter((_, i) => i !== index));
  }

  return (
    <div className="calc-wrapper">
      <a href="/">Назад</a>
      <h1 className="calc-title">Кредитный калькулятор</h1>
      <div>
        <div className="field">
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
      <div className="prepayments">
        <button onClick={addPrepayment}>+ Добавить частичное погашение</button>
        {prepayments.map((pp, i) => (
          <div key={i} className="prepayment-row">
            <div className="field">
              <label>Сумма</label>
              <input
                type="number"
                value={pp.amount}
                onChange={(e) => updatePrepayment(i, "amount", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Дата</label>
              <input
                type="date"
                value={pp.date}
                onChange={(e) => updatePrepayment(i, "date", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Порядок погашения</label>
              <select
                value={pp.type}
                onChange={(e) => updatePrepayment(i, "type", e.target.value)}
              >
                <option value="reduce_payment">Уменьшить платёж</option>
                <option value="reduce_term">Уменьшить срок</option>
              </select>
            </div>
            <div>
              <input
                type="checkbox"
                checked={pp.repeat}
                onChange={(e) =>
                  updatePrepayment(i, "repeat", e.target.checked)
                }
              />{" "}
              <label>Повторять ежемесячно</label>{" "}
              <button onClick={() => removePrepayment(i)}>×</button>
            </div>
          </div>
        ))}
      </div>
      {n > 0 && schedule.length > 0 && (
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
            {(totalPayment + totalPrepaid).toLocaleString("ru-RU", {
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
      )}
    </div>
  );
}
