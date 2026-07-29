# Financial Calculators

Calculators for everyday money decisions: inflation, deposit, loan, mortgage.
Companion project to [Keeply](https://mykeeply.com), a personal finance tracker.

**Live:** [calc.mykeeply.com](https://calc.mykeeply.com) (in Russian)

## What it does

- **Inflation** — how much a sum is worth between two dates, based on monthly CPI data since 1991 (Russia only for now)
- **Deposit** — interest income month by month, with compounding
- **Loan** — annuity and differentiated schedules, overpayment, partial and full early repayments
- **Mortgage** — same, plus a down payment in either currency or percent

What sets it apart from typical calculators:

- Interest accrues on **actual days in the period**, including leap years, instead of an averaged 30-day month
- **Multiple independent early repayments** with dates, monthly repeat, and a choice between reducing the payment or the term
- Full payment schedule split into principal and interest

## Stack

Astro · React 19 · JavaScript · Vitest · Docker + Kamal on a VPS

### Why Astro instead of an SPA

The first version was a Vite + React + React Router SPA. Client-side rendering serves search engines an empty `<div id="root">`, which defeats the point of a project built for organic traffic.

Astro fixes that without giving up React: every page is prerendered to static HTML at build time, and each calculator ships as an island hydrated on load — so JavaScript is only downloaded where interactivity actually exists.

Calculation logic lives in `src/utils/` as pure, unit-tested functions; React components only handle input and rendering.

### Why a VPS instead of Vercel

The site first went live on Vercel. From Russia — where the entire audience is — it loaded slowly over Wi-Fi and did not load at all on mobile networks, which also makes it unreachable for Yandex's crawler.

It now runs on a Moscow VPS: a multi-stage build (Node compiles the site, nginx serves it, ~26 MB image) deployed with Kamal, sharing kamal-proxy with the main Keeply app, which routes by hostname.

## Getting started

```bash
npm install
npm run dev     # localhost:4321
npm run test    # unit tests
```

Requires Node >= 22.12.
