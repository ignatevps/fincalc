import { describe, it, expect } from "vitest";
import { averageInflation, presentValue } from "./inflation";
import buildSchedule, {
  calcEarlyRepayment,
  calcUniformPayment,
} from "./loanSchedule";

describe("buildSchedule", () => {
  const amount = 1_000_000;
  const start = new Date("2026-01-01");
  const rate = 12;
  const term = 12;
  const termUnit = "months";

  describe("annuity", () => {
    const { schedule } = buildSchedule(
      amount,
      start,
      rate,
      term,
      termUnit,
      "annuity",
    );
    const totalBody = schedule.reduce((sum, p) => sum + p.body, 0);

    it("balance is zero at end", () => {
      expect(schedule.at(-1).balance).toBeCloseTo(0, 0);
    });
    it("schedule length matches term", () => {
      expect(schedule.length).toBe(term);
    });
    it("total body equals amount", () => {
      expect(totalBody).toBeCloseTo(amount, 0);
    });
  });

  describe("differentiated", () => {
    const { schedule } = buildSchedule(
      amount,
      start,
      rate,
      term,
      termUnit,
      "differentiated",
    );
    const totalBody = schedule.reduce((sum, p) => sum + p.body, 0);

    it("balance is zero at end", () => {
      expect(schedule.at(-1).balance).toBeCloseTo(0, 0);
    });
    it("schedule length matches term", () => {
      expect(schedule.length).toBe(term);
    });
    it("total body equals amount", () => {
      expect(totalBody).toBeCloseTo(amount, 0);
    });
    it("firts payment bigger than last", () => {
      expect(schedule[0].payment).toBeGreaterThan(schedule.at(-1).payment);
    });
  });

  describe("rate 0%", () => {
    const { schedule } = buildSchedule(
      amount,
      start,
      0,
      term,
      termUnit,
      "annuity",
    );

    it("first payment equal last", () => {
      expect(schedule[0].payment).toBeCloseTo(schedule.at(-1).payment);
    });
    it("no NaN in payments", () => {
      expect(schedule[0].payment).not.toBeNaN();
    });
  });
});

describe("prepayments", () => {
  const amount = 500_000;
  const start = new Date("2026-09-09");
  const rate = 19;
  const plain = buildSchedule(amount, start, rate, 3, "years", "annuity");
  const plainTotal = plain.schedule.reduce((sum, p) => sum + p.payment, 0);

  it("ignores a prepayment of nothing", () => {
    for (const type of ["reduce_payment", "reduce_term"]) {
      const { schedule, totalPrepaid } = buildSchedule(
        amount,
        start,
        rate,
        3,
        "years",
        "annuity",
        [{ date: "2027-03-09", amount: 0, type, repeat: false }],
      );
      const total = schedule.reduce((sum, p) => sum + p.payment, 0);

      expect(totalPrepaid).toBe(0);
      expect(total).toBeCloseTo(plainTotal, 6);
    }
  });

  it("still applies a real one", () => {
    const { schedule, totalPrepaid } = buildSchedule(
      amount,
      start,
      rate,
      3,
      "years",
      "annuity",
      [
        {
          date: "2027-03-09",
          amount: 50_000,
          type: "reduce_payment",
          repeat: false,
        },
      ],
    );
    const total =
      schedule.reduce((sum, p) => sum + p.payment, 0) + totalPrepaid;

    expect(totalPrepaid).toBe(50_000);
    expect(total).toBeLessThan(plainTotal);
  });
});

describe("calcEarlyRepayment", () => {
  const amount = 1_000_000;
  const issueDate = "2026-09-08";
  const rate = 12;
  const { schedule, prepaidLog } = buildSchedule(
    amount,
    new Date(issueDate),
    rate,
    12,
    "months",
    "annuity",
  );

  it("closes the loan before the first payment falls due", () => {
    const result = calcEarlyRepayment(
      schedule,
      prepaidLog,
      "2026-09-22",
      amount,
      rate,
      issueDate,
    );

    // Fourteen days of interest on the whole amount, nothing repaid yet.
    const expectedInterest = ((amount * 0.12) / 365) * 14;
    expect(result).not.toBeNull();
    expect(result.amount).toBeCloseTo(amount + expectedInterest, 2);
    expect(result.overPayment).toBeCloseTo(expectedInterest, 2);
  });

  it("rounds the payoff up to the kopeck", () => {
    const result = calcEarlyRepayment(
      schedule,
      prepaidLog,
      "2026-09-22",
      amount,
      rate,
      issueDate,
    );
    const exact = amount + ((amount * 0.12) / 365) * 14;

    // Never below the true figure: a kopeck short leaves the loan open.
    expect(result.amount).toBeGreaterThanOrEqual(exact);
    expect(result.amount).toBeLessThan(exact + 0.01);
    expect(Math.round(result.amount * 100)).toBe(result.amount * 100);
  });

  it("returns nothing for a date before the loan was issued", () => {
    expect(
      calcEarlyRepayment(
        schedule,
        prepaidLog,
        "2026-09-01",
        amount,
        rate,
        issueDate,
      ),
    ).toBeNull();
  });

  it("still works once payments have been made", () => {
    const result = calcEarlyRepayment(
      schedule,
      prepaidLog,
      "2026-12-22",
      amount,
      rate,
      issueDate,
    );

    expect(result.amount).toBeGreaterThan(0);
    expect(result.amount).toBeLessThan(amount);
  });
});

describe("calcUniformPayment", () => {
  const amount = 1_000_000;

  it("returns nothing when the date is less than a month away", () => {
    expect(
      calcUniformPayment(amount, 12, "2026-09-08", "2026-09-22"),
    ).toBeNull();
  });

  it("returns nothing for a date before the loan was issued", () => {
    expect(
      calcUniformPayment(amount, 12, "2026-09-08", "2026-08-22"),
    ).toBeNull();
  });

  it("counts whole months, not calendar ones", () => {
    // The 7th of the next month is a day short of a month.
    expect(
      calcUniformPayment(amount, 12, "2026-09-08", "2026-10-07"),
    ).toBeNull();
    expect(
      calcUniformPayment(amount, 12, "2026-09-08", "2026-10-08"),
    ).not.toBeNull();
  });

  it("spreads a year over twelve payments, not thirteen", () => {
    const result = calcUniformPayment(amount, 12, "2026-09-08", "2027-09-08");
    expect(result.total).toBeCloseTo(result.amount * 12, 6);
  });

  it("spreads the debt over whole months", () => {
    const result = calcUniformPayment(amount, 12, "2026-09-08", "2027-09-08");

    expect(Number.isFinite(result.amount)).toBe(true);
    expect(result.total).toBeCloseTo(result.amount * 12, 6);
    expect(result.overPayment).toBeGreaterThan(0);
  });

  it("splits the amount evenly at a zero rate", () => {
    const result = calcUniformPayment(amount, 0, "2026-09-08", "2027-09-08");

    expect(result.amount).toBeCloseTo(amount / 12, 6);
    expect(result.overPayment).toBeCloseTo(0, 6);
  });
});

describe("inflation", () => {
  it("averages the monthly indices geometrically", () => {
    const twenty = averageInflation(20);

    // A plausible long-run figure for the data at hand, not a placeholder.
    expect(twenty).toBeGreaterThan(4);
    expect(twenty).toBeLessThan(12);
  });

  it("leaves a payment made today alone", () => {
    const start = new Date("2026-01-01");
    const pv = presentValue([{ date: start, amount: 1000 }], start, 10);

    expect(pv).toBeCloseTo(1000, 6);
  });

  it("discounts a payment a year out by one year of inflation", () => {
    const start = new Date("2026-01-01");
    const later = new Date(start.getTime() + 365.25 * 24 * 60 * 60 * 1000);
    const pv = presentValue([{ date: later, amount: 1100 }], start, 10);

    expect(pv).toBeCloseTo(1000, 6);
  });

  it("makes a long loan cost visibly less in today's money", () => {
    const amount = 6_000_000;
    const start = new Date("2026-01-01");
    const { schedule } = buildSchedule(
      amount,
      start,
      18,
      20,
      "years",
      "annuity",
    );
    const nominal = schedule.reduce((sum, p) => sum + p.payment, 0) - amount;
    const real =
      presentValue(
        schedule.map((p) => ({ date: p.date, amount: p.payment })),
        start,
        9,
      ) - amount;

    expect(real).toBeGreaterThan(0);
    expect(real).toBeLessThan(nominal / 3);
  });

  it("wipes out the overpayment when inflation catches the rate", () => {
    const amount = 6_000_000;
    const start = new Date("2026-01-01");
    const { schedule } = buildSchedule(
      amount,
      start,
      18,
      20,
      "years",
      "annuity",
    );
    const real =
      presentValue(
        schedule.map((p) => ({ date: p.date, amount: p.payment })),
        start,
        19.6,
      ) - amount;

    expect(Math.abs(real)).toBeLessThan(amount * 0.01);
  });
});
