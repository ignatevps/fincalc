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
    // A prepayment of nothing is not an event. Letting it through would still
    // recompute the annuity, and since interest accrues by actual days while
    // that formula assumes even months, the payment would shift by a few rubles
    // without a ruble being paid.
    if (!(Number(pp.amount) > 0)) continue;

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
  issueDate,
) {
  const date = new Date(earlyDate);
  const start = new Date(issueDate);
  if (date < start) return null;

  const row = schedule.findLast((p) => p.date <= date);
  // Closing before the first payment is an ordinary case: a loan taken out and
  // repaid a fortnight later. Nothing has been paid, so the whole amount is
  // still owed and interest runs from the issue date.
  const since = row ? row.date : start;
  const balance = row ? row.balance : amount;

  const paidSoFar = schedule
    .filter((p) => p.date <= date)
    .reduce((sum, p) => sum + p.payment, 0);
  const prepaidBeforeEarly = prepaidLog
    .filter((p) => p.date <= date)
    .reduce((sum, p) => sum + p.amount, 0);
  const accruedInterest = calcInterestBetween(since, date, balance, rate);
  const total = paidSoFar + prepaidBeforeEarly + accruedInterest + balance;

  // Rounded up to the kopeck: this figure is transferred to close the loan, and
  // rounding it down would leave a few kopecks of debt still accruing interest.
  const payoff = Math.ceil((balance + accruedInterest) * 100) / 100;

  return {
    amount: payoff,
    total,
    overPayment: total - amount,
  };
}

export function calcUniformPayment(amount, rate, issueDate, earlyDate) {
  const end = new Date(earlyDate);
  const start = new Date(issueDate);
  let n =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  // Whole months, not calendar ones: a loan issued on the 8th has not run a
  // month by the 7th of the next. Issued on the 31st, February never reaches
  // the day at all, so the month does not count — better to say so than to
  // price a period that has not passed.
  if (end.getDate() < start.getDate()) n -= 1;

  // Fewer than one whole month leaves nothing to spread: the annuity would
  // divide by zero and report Infinity. A date before the issue makes n
  // negative. Neither has a monthly answer — only the lump sum does.
  if (n < 1) return null;

  const r = rate / 12 / 100;
  const f = (1 + r) ** n;
  const newPayment = r === 0 ? amount / n : (amount * r * f) / (f - 1);
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
  return { schedule, totalPrepaid, prepaidLog, baseAnnuity };
}
