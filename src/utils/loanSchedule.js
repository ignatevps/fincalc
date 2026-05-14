function daysInYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
}

export function calcInterestBetween(from, to, balance, rate) {
  const days = Math.round((to - from) / (1000 * 60 * 60 * 24));
  return ((balance * (rate / 100)) / daysInYear(to.getFullYear())) * days;
}

function expandPrepayments(prepayments, dates) {
  const lastDate = dates[dates.length - 1];
  const result = [];

  for (const pp of prepayments) {
    if (!pp.repeat) {
      result.push({ ...pp, date: new Date(pp.date) });
    } else {
      let d = new Date(pp.date);
      while (d <= lastDate) {
        result.push({ ...pp, date: new Date(d) });
        d.setMonth(d.getMonth() + 1);
      }
    }
  }
  return result.sort((a, b) => a.date - b.date);
}

export function calcEarlyRepayment(
  schedule,
  prepaidLog,
  earlyDate,
  amount,
  rate,
) {
  const row = schedule.findLast((p) => p.date <= new Date(earlyDate));
  if (!row) return null;
  const paidSoFar = schedule
    .filter((p) => p.date <= new Date(earlyDate))
    .reduce((sum, p) => sum + p.payment, 0);
  const prepaidBeforeEarly = prepaidLog
    .filter((p) => p.date <= new Date(earlyDate))
    .reduce((sum, p) => sum + p.amount, 0);
  const accruedInterest = calcInterestBetween(
    row.date,
    new Date(earlyDate),
    row.balance,
    rate,
  );
  return {
    amount: row.balance + accruedInterest,
    total: paidSoFar + prepaidBeforeEarly + accruedInterest + row.balance,
    overPayment:
      paidSoFar + prepaidBeforeEarly + accruedInterest + row.balance - amount,
  };
}

export function calcUniformPayment(amount, rate, issueDate, earlyDate) {
  const end = new Date(earlyDate);
  const start = new Date(issueDate);
  const n =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  const r = rate / 12 / 100;
  const f = (1 + r) ** n;
  const newPayment = (amount * r * f) / (f - 1);
  return {
    amount: newPayment,
    total: newPayment * n,
    overPayment: newPayment * n - amount,
  };
}

export default function buildSchedule(
  amount,
  start,
  rate,
  term,
  termUnit,
  paymentType,
  prepayments = [],
) {
  const dates = [];
  const r = rate / 12 / 100;
  const n = termUnit === "years" ? term * 12 : term;
  const factor = (1 + r) ** n;
  const baseAnnuity =
    r === 0 ? amount / n : (amount * r * factor) / (factor - 1);

  for (let i = 1; i <= n; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    dates.push(d);
  }
  const schedule = [];
  const prepaidLog = [];
  const allPrepayments = expandPrepayments(prepayments, dates);
  let balance = amount;
  let prepIdx = 0;
  let currentAnnuity = baseAnnuity;
  let totalPrepaid = 0;
  let prepaymentMode = "reduce_term";

  for (let i = 0; i < dates.length; i++) {
    const prevDate = i === 0 ? start : dates[i - 1];
    let periodStart = prevDate;
    let interest = 0;

    while (
      prepIdx < allPrepayments.length &&
      allPrepayments[prepIdx].date < dates[i]
    ) {
      const pp = allPrepayments[prepIdx];
      interest += calcInterestBetween(periodStart, pp.date, balance, rate);
      const ppAmount = Number(pp.amount);
      const actualAmount = Math.min(ppAmount, balance);
      balance -= actualAmount;
      totalPrepaid += actualAmount;
      prepaidLog.push({ date: pp.date, amount: actualAmount });
      if (balance <= 0) {
        balance = 0;
        break;
      }
      prepaymentMode = pp.type;
      if (pp.type === "reduce_payment") {
        const remaining = dates.length - i;
        const r = rate / 12 / 100;
        const f = (1 + r) ** remaining;
        currentAnnuity = (balance * r * f) / (f - 1);
      }
      periodStart = pp.date;
      prepIdx++;
    }

    if (balance <= 0) break;

    interest += calcInterestBetween(periodStart, dates[i], balance, rate);

    if (paymentType === "annuity") {
      let body, payment;
      if (i === dates.length - 1) {
        body = balance;
        payment = body + interest;
      } else {
        payment = currentAnnuity;
        body = payment - interest;
        if (body >= balance) {
          body = balance;
          payment = body + interest;
        }
      }

      balance -= body;
      schedule.push({ date: dates[i], payment, interest, body, balance });
    } else {
      const body =
        prepaymentMode === "reduce_payment"
          ? balance / (dates.length - i)
          : Math.min(amount / dates.length, balance);
      const payment = body + interest;

      balance -= body;
      schedule.push({ date: dates[i], payment, interest, body, balance });
    }
  }
  return { schedule, totalPrepaid, prepaidLog };
}
