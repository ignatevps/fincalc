import { readFileSync, appendFileSync } from "node:fs";

// Rosstat publishes a month's index between the 12th and the 15th of the next
// month. So what counts as up to date depends on the day, not only the month:
// before the 15th of September the newest published figure is still July's.
const PUBLISH_DAY = 15;

const cpi = JSON.parse(readFileSync("src/data/cpi.json", "utf8"));

// Keys are YYYY-MM with a padded month, so sorting them as strings is already
// chronological, and so is comparing two of them.
const last = Object.keys(cpi).sort().at(-1);

const now = new Date();
const monthsBack = now.getUTCDate() >= PUBLISH_DAY ? 1 : 2;
// getUTCMonth counts from zero and so does Date.UTC, so no conversion here.
const expectedDate = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1),
);
const expected = `${expectedDate.getUTCFullYear()}-${String(
  expectedDate.getUTCMonth() + 1,
).padStart(2, "0")}`;

const [lastYear, lastMonth] = last.split("-").map(Number);
const [expYear, expMonth] = expected.split("-").map(Number);
const missing = (expYear - lastYear) * 12 + (expMonth - lastMonth);
const stale = missing > 0;

// Naming the months, not just counting them: with the count alone the reminder
// still sends you to cpi.json to work out which ones are actually absent.
// getUTCMonth is zero-based and lastMonth is not, hence the shift by one.
const missingMonths = [];
for (let i = 1; i <= missing; i++) {
  const date = new Date(Date.UTC(lastYear, lastMonth - 1 + i, 1));
  missingMonths.push(
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
  );
}

console.log(`последний месяц в данных: ${last}`);
console.log(`должен быть опубликован:  ${expected}`);
console.log(`не хватает месяцев:       ${Math.max(missing, 0)}`);
console.log(`каких именно:             ${missingMonths.join(", ") || "—"}`);
console.log(`нужно обновление:         ${stale ? "да" : "нет"}`);

// Read by the next step of the workflow. Absent when run by hand, so the script
// stays usable locally without a token or a network.
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `last=${last}\nexpected=${expected}\nmissing=${missing}\n` +
      `missing_months=${missingMonths.join(", ")}\nstale=${stale}\n`,
  );
}
