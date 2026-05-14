import { useState } from "react";
import { createPortal } from "react-dom";
import buildSchedule, {
  calcEarlyRepayment,
  calcUniformPayment,
} from "../utils/loanSchedule";
import { formatNumber, formatCurrency } from "../utils/formatters";
import PaymentSchedule from "./PaymentSchedule";

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
  const [showEarlyRepayment, setShowEarlyRepayment] = useState(false);
  const [earlyRepaymentDate, setEarlyRepaymentDate] = useState("");
  const [earlyRepaymentType, setEarlyRepaymentType] = useState("lump_sum");
  const [showSchedule, setShowSchedule] = useState(false);

  const amountNum = Number(amount);
  const rateNum = Number(rate);
  const termNum = Number(term);
  const start = new Date(issueDate);
  const dates = [];
  const r = rateNum / 12 / 100;
  const n = termUnit === "years" ? termNum * 12 : termNum;
  const factor = (1 + r) ** n;
  const baseAnnuity =
    r === 0 ? amountNum / n : (amountNum * r * factor) / (factor - 1);

  for (let i = 1; i <= n; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    dates.push(d);
  }

  const { schedule, totalPrepaid, prepaidLog } = buildSchedule(
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
  const earlyRepaymentResult = (() => {
    if (!showEarlyRepayment || !earlyRepaymentDate) return null;

    if (earlyRepaymentType === "lump_sum") {
      return calcEarlyRepayment(
        schedule,
        prepaidLog,
        earlyRepaymentDate,
        amountNum,
        rateNum,
      );
    } else {
      return calcUniformPayment(
        amountNum,
        rateNum,
        issueDate,
        earlyRepaymentDate,
      );
    }
  })();

  function addPrepayment() {
    const d = new Date(issueDate);
    d.setMonth(d.getMonth() + 1);
    setPrepayments([
      ...prepayments,
      {
        date: d.toISOString().slice(0, 10),
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
      <div className="calc-form">
        <div className="field">
          <label htmlFor="amount">Сумма кредита/займа: </label>
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
        {prepayments.length > 0 && (
          <h4 className="prepayment-title">Частичное погашение</h4>
        )}
        {prepayments.map((pp, i) => (
          <div key={i} className="prepayment-row">
            <button
              className="button-right"
              onClick={() => removePrepayment(i)}
            >
              ×
            </button>
            <div className="calc-form">
              <div className="field">
                <label>Сумма</label>
                <input
                  type="text"
                  value={formatNumber(pp.amount)}
                  onChange={(e) =>
                    updatePrepayment(
                      i,
                      "amount",
                      Number(e.target.value.replace(/\D/g, "")),
                    )
                  }
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
              <div className="field field--radio field--full">
                <input
                  type="checkbox"
                  checked={pp.repeat}
                  onChange={(e) =>
                    updatePrepayment(i, "repeat", e.target.checked)
                  }
                />
                <label>Повторять ежемесячно</label>
              </div>
            </div>
          </div>
        ))}
        <button className="btn-add" onClick={addPrepayment}>
          + Добавить частичное погашение
        </button>
      </div>
      <div className="repayment">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={showEarlyRepayment}
            onChange={(e) => setShowEarlyRepayment(e.target.checked)}
          />
          Досрочное погашение
        </label>
        {showEarlyRepayment && (
          <div className="calc-form">
            <div className="field">
              <label htmlFor="earlyRepaymentDate">
                Дата досрочного погашения
              </label>
              <input
                type="date"
                value={earlyRepaymentDate}
                onChange={(e) => setEarlyRepaymentDate(e.target.value)}
                name="earlyRepaymentDate"
                id="earlyRepaymentDate"
                required
              />
            </div>
            <div className="field field--span2">
              <label htmlFor="earlyRepaymentType">
                Порядок досрочного погашения
              </label>
              <select
                name="earlyRepaymentType"
                value={prepayments.length > 0 ? "lump_sum" : earlyRepaymentType}
                disabled={prepayments.length > 0}
                onChange={(e) => setEarlyRepaymentType(e.target.value)}
              >
                <option value="uniform">
                  Равномерно по ежемесячным платежам
                </option>
                <option value="lump_sum">
                  Необходимая сумма на дату досрочного платежа
                </option>
              </select>
            </div>
          </div>
        )}
      </div>
      {n > 0 && schedule.length > 0 && (
        <div className="result">
          <div className="result-item">
            <span className="result-label">Ежемесячный платёж</span>
            <span className="result-value">
              {paymentType === "annuity" ? (
                formatCurrency(baseAnnuity)
              ) : (
                <>
                  <span className="result-label">от</span>{" "}
                  {formatCurrency(schedule[0].payment)}{" "}
                  <span className="result-label">до</span>{" "}
                  {formatCurrency(schedule[schedule.length - 1].payment)}
                </>
              )}
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">Всего выплат</span>
            <span className="result-value">
              {formatCurrency(totalPayment + totalPrepaid)}
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">Переплата</span>
            <span className="result-value">{formatCurrency(overPayment)}</span>
          </div>
          <button
            className="btn-schedule"
            onClick={() => setShowSchedule(!showSchedule)}
          >
            {showSchedule ? "Скрыть" : "График платежей"}
          </button>
          {showSchedule &&
            createPortal(
              <div
                className="modal-overlay"
                onClick={() => setShowSchedule(false)}
              >
                <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="modal-close"
                    onClick={() => setShowSchedule(false)}
                  >
                    ×
                  </button>
                  <PaymentSchedule
                    schedule={schedule}
                    prepaidLog={prepaidLog}
                    earlyRepayment={
                      earlyRepaymentResult
                        ? {
                            date: new Date(earlyRepaymentDate),
                            amount: earlyRepaymentResult.amount,
                          }
                        : null
                    }
                  />
                </div>
              </div>,
              document.body,
            )}
        </div>
      )}
      {earlyRepaymentResult !== null && (
        <div className="result">
          <div className="result-item">
            <span className="result-label">
              {earlyRepaymentType === "uniform"
                ? "Новый ежемесячный платёж"
                : `Сумма для закрытия на ${earlyRepaymentDate}`}
            </span>
            <span className="result-value">
              {formatCurrency(earlyRepaymentResult.amount)}
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">Всего выплат</span>
            <span className="result-value">
              {formatCurrency(earlyRepaymentResult.total)}
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">Переплата</span>
            <span className="result-value">
              {formatCurrency(earlyRepaymentResult.overPayment)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
