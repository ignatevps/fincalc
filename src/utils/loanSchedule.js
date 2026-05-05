export default function buildSchedule(
  amount,
  start,
  dates,
  baseAnnuity,
  rate,
  paymentType,
) {
  let balance = amount;
  const schedule = [];

  for (let i = 0; i < dates.length; i++) {
    const prevDate = i === 0 ? start : dates[i - 1];
    const days = Math.round((dates[i] - prevDate) / (1000 * 60 * 60 * 24));
    const interest = ((balance * (rate / 100)) / 365) * days;

    if (paymentType === "annuity") {
      let body, payment;
      if (i === dates.length - 1) {
        body = balance;
        payment = body + interest;
      } else {
        payment = baseAnnuity;
        body = payment - interest;
      }

      balance -= body;
      schedule.push({ date: dates[i], payment, interest, body, balance });
    } else {
      const body = amount / dates.length;
      let payment = body + interest;

      balance -= body;
      schedule.push({ date: dates[i], payment, interest, body, balance });
    }
  }
  return schedule;
}
