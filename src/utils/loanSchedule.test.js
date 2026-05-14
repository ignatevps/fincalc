import { describe, it, expect } from "vitest";
import buildSchedule from "./loanSchedule";

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
