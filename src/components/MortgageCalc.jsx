import { useState } from "react";
import buildSchedule, {
  calcEarlyRepayment,
  calcUniformPayment,
} from "../utils/loanSchedule";
import { formatNumber, formatCurrency } from "../utils/formatters";

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
  const [prepayments, setPrepayments] = useState([]);
  const [showEarlyRepayment, setShowEarlyRepayment] = useState(false);
  const [earlyRepaymentDate, setEarlyRepaymentDate] = useState("");
  const [earlyRepaymentType, setEarlyRepaymentType] = useState("uniform");

  const rateNum = Number(rate);
  const termNum = Number(term);
  const start = new Date(issueDate);
  const loanAmount =
    propertyPrice -
    (downPaymentUnit === "rub"
      ? downPayment
      : propertyPrice * (downPayment / 100));

  const { schedule, totalPrepaid, prepaidLog, baseAnnuity } = buildSchedule(
    loanAmount,
    start,
    rateNum,
    termNum,
    termUnit,
    paymentType,
    prepayments,
  );

  const totalPayment = schedule.reduce((sum, p) => sum + p.payment, 0);
  const overPayment = totalPayment + totalPrepaid - loanAmount;
  const earlyRepaymentResult = (() => {
    if (!showEarlyRepayment || !earlyRepaymentDate) return null;

    if (earlyRepaymentType === "lump_sum") {
      return calcEarlyRepayment(
        schedule,
        prepaidLog,
        earlyRepaymentDate,
        loanAmount,
        rateNum,
      );
    } else {
      return calcUniformPayment(
        loanAmount,
        rateNum,
        issueDate,
        earlyRepaymentDate,
      );
    }
  })();

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
      <div className="calc-form">
        <div className="field">
          <label htmlFor="propertyPrice">Стоимость недвижимости: </label>
          <input
            type="text"
            step="any"
            value={formatNumber(propertyPrice)}
            onChange={(e) =>
              setPropertyPrice(Number(e.target.value.replace(/\D/g, "")))
            }
            name="propertyPrice"
            id="propertyPrice"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="downPayment">Первоначальный взнос: </label>
          <div className="field-row">
            <input
              type={downPaymentUnit === "rub" ? "text" : "number"}
              step="any"
              value={
                downPaymentUnit === "rub"
                  ? formatNumber(downPayment)
                  : downPayment
              }
              onChange={(e) =>
                setDownPayment(
                  downPaymentUnit === "rub"
                    ? Number(e.target.value.replace(/\D/g, ""))
                    : Number(e.target.value),
                )
              }
              name="downPayment"
              id="downPayment"
              required
            />
            <select
              name="downPaymentUnit"
              value={downPaymentUnit}
              onChange={(e) => {
                setDownPaymentUnit(e.target.value);
                setDownPayment(e.target.value === "percent" ? 20 : 1200000);
              }}
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
      {schedule.length > 0 && (
        <div className="result">
          <div className="result-item">
            <span className="result-label">Сумма кредита</span>
            <span className="result-value">
              {loanAmount.toLocaleString("ru-RU", {
                maximumFractionDigits: 0,
              })}{" "}
              ₽
            </span>
          </div>
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
