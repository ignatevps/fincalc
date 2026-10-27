import { useState } from "react";
import { createPortal } from "react-dom";
import AmountInput from "./AmountInput";
import buildSchedule, {
  calcEarlyRepayment,
  calcUniformPayment,
} from "../utils/loanSchedule";
import {
  formatCurrency,
  formatExactCurrency,
} from "../utils/formatters";
import PaymentSchedule from "./PaymentSchedule";
import { averageInflation, presentValue } from "../utils/inflation";

// A long window rather than a short one: a few years would lean on whichever
// part of the cycle they happened to cover.
const DEFAULT_INFLATION = averageInflation(20).toFixed(2);

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
  const [useInflation, setUseInflation] = useState(false);
  const [inflationRate, setInflationRate] = useState(DEFAULT_INFLATION);
  const [showSchedule, setShowSchedule] = useState(false);

  const amountNum = Number(amount);
  const rateNum = Number(rate);
  const termNum = Number(term);
  const start = new Date(issueDate);

  const { schedule, totalPrepaid, prepaidLog, baseAnnuity } = buildSchedule(
    amountNum,
    start,
    rateNum,
    termNum,
    termUnit,
    paymentType,
    prepayments,
  );

  const totalPayment = schedule.reduce((sum, p) => sum + p.payment, 0);
  const overPayment = totalPayment + totalPrepaid - amountNum;

  // Both the scheduled payments and any prepayments leave the pocket, so both
  // are discounted back to the issue date.
  const realOverPayment = useInflation
    ? presentValue(
        [
          ...schedule.map((p) => ({ date: p.date, amount: p.payment })),
          ...prepaidLog,
        ],
        start,
        Number(inflationRate),
      ) - amountNum
    : null;
  const earlyRepaymentResult = (() => {
    if (!showEarlyRepayment || !earlyRepaymentDate) return null;

    if (earlyRepaymentType === "lump_sum") {
      return calcEarlyRepayment(
        schedule,
        prepaidLog,
        earlyRepaymentDate,
        amountNum,
        rateNum,
        issueDate,
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
          <label htmlFor="amount">Сумма кредита</label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            name="amount"
            id="amount"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="rate">Ставка, % годовых</label>
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
          <label htmlFor="term">Срок</label>
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
          <label htmlFor="issueDate">Дата выдачи</label>
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
          <label htmlFor="paymentType">Порядок погашения</label>
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
        {prepayments.map((pp, i) => (
          <div key={i} className="prepayment-row">
            {/* The heading belongs to its own block, so the button that removes
                that block sits on the same line as its name. */}
            <div className="prepayment-header">
              <h4 className="prepayment-title">
                Частичное погашение{prepayments.length > 1 ? ` ${i + 1}` : ""}
              </h4>
              <button
                type="button"
                className="button-right"
                aria-label="Удалить погашение"
                onClick={() => removePrepayment(i)}
              >
                ×
              </button>
            </div>
            <div className="calc-form">
              <div className="field">
                <label htmlFor={`pp-amount-${i}`}>Сумма</label>
                <AmountInput
                  id={`pp-amount-${i}`}
                  value={pp.amount}
                  onChange={(next) => updatePrepayment(i, "amount", next)}
                />
              </div>
              <div className="field">
                <label htmlFor={`pp-date-${i}`}>Дата</label>
                <input
                  id={`pp-date-${i}`}
                  type="date"
                  value={pp.date}
                  onChange={(e) => updatePrepayment(i, "date", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`pp-type-${i}`}>Порядок погашения</label>
                <select
                  id={`pp-type-${i}`}
                  value={pp.type}
                  onChange={(e) => updatePrepayment(i, "type", e.target.value)}
                >
                  <option value="reduce_payment">Уменьшить платёж</option>
                  <option value="reduce_term">Уменьшить срок</option>
                </select>
              </div>
              <div className="field field--radio field--full">
                <input
                  id={`pp-repeat-${i}`}
                  type="checkbox"
                  checked={pp.repeat}
                  onChange={(e) =>
                    updatePrepayment(i, "repeat", e.target.checked)
                  }
                />
                <label htmlFor={`pp-repeat-${i}`}>Повторять ежемесячно</label>
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
            checked={useInflation}
            onChange={(e) => setUseInflation(e.target.checked)}
          />
          Учитывать инфляцию
        </label>
        {useInflation && (
          <div className="calc-form">
            <div className="field field--span2">
              <label htmlFor="inflationRate">Ожидаемая инфляция, % в год</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inflationRate}
                onChange={(e) => setInflationRate(e.target.value)}
                id="inflationRate"
              />
              <p className="field-hint">
                Предположение о будущем, его можно изменить. Средняя за
                последние 20 лет — {DEFAULT_INFLATION}%.
              </p>
            </div>
          </div>
        )}
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
      {schedule.length > 0 && (
        <div className="result">
          <div className="result-item result-item--primary">
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
          {realOverPayment !== null && (
            <div className="result-item">
              <span className="result-label">
                Переплата в сегодняшних деньгах
              </span>
              <span className="result-value">
                {formatCurrency(realOverPayment)}
              </span>
            </div>
          )}
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
      {showEarlyRepayment &&
        earlyRepaymentDate &&
        earlyRepaymentResult === null && (
          <div className="result">
            <p className="result-note">
              До этой даты нет ни одного платежа. Выберите дату не раньше чем
              через месяц после выдачи — или режим «Погасить одной суммой».
            </p>
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
              {/* The payoff is transferred as shown, so it keeps its kopecks;
                  every other figure here is an estimate and stays rounded. */}
              {earlyRepaymentType === "uniform"
                ? formatCurrency(earlyRepaymentResult.amount)
                : formatExactCurrency(earlyRepaymentResult.amount)}
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
