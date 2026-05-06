export default function buildSchedule(
  amount,
  start,
  dates,
  baseAnnuity,
  rate,
  paymentType,
  prepayments = [],
) {
  function expandPrepayments(prepayments) {
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

  function daysInYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
  }

  function calcInterestBetween(from, to, balance) {
    const days = Math.round((to - from) / (1000 * 60 * 60 * 24));
    return ((balance * (rate / 100)) / daysInYear(to.getFullYear())) * days;
  }

  let balance = amount;
  const schedule = [];
  const allPrepayments = expandPrepayments(prepayments);
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
      interest += calcInterestBetween(periodStart, pp.date, balance);
      const ppAmount = Number(pp.amount);
      const actualAmount = Math.min(ppAmount, balance);
      balance -= actualAmount;
      totalPrepaid += actualAmount;
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

    interest += calcInterestBetween(periodStart, dates[i], balance);

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
  return { schedule, totalPrepaid };
}
