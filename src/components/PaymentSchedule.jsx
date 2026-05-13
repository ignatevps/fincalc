import { formatCurrency } from "../utils/formatters";

export default function PaymentSchedule({
  schedule,
  prepaidLog,
  earlyRepayment,
}) {
  const cutDate = earlyRepayment ? earlyRepayment.date : null;
  const rows = [
    ...schedule
      .filter((r) => !cutDate || r.date <= cutDate)
      .map((r) => ({ ...r, type: "payment" })),
    ...prepaidLog
      .filter((r) => !cutDate || r.date <= cutDate)
      .map((r) => ({ ...r, type: "prepayment" })),
    ...(earlyRepayment ? [{ ...earlyRepayment, type: "early" }] : []),
  ].sort((a, b) => a.date - b.date);

  return (
    <table>
      <thead>
        <tr>
          <th>№</th>
          <th>Дата</th>
          <th>Платеж</th>
          <th>Проценты</th>
          <th>Тело кредита</th>
          <th>Остаток</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.type === "payment" ? (
              <>
                <td>{i + 1}</td>
                <td>{row.date.toLocaleDateString("ru-RU")}</td>
                <td>{formatCurrency(row.payment)}</td>
                <td>{formatCurrency(row.interest)}</td>
                <td>{formatCurrency(row.body)}</td>
                <td>{formatCurrency(row.balance)}</td>
              </>
            ) : row.type === "prepayment" ? (
              <>
                <td></td>
                <td>{row.date.toLocaleDateString("ru-RU")}</td>
                <td colSpan={3}>Частичное погашение</td>
                <td>−{formatCurrency(row.amount)}</td>
              </>
            ) : (
              <>
                <td></td>
                <td>{row.date.toLocaleDateString("ru-RU")}</td>
                <td colSpan={3}>Досрочное погашение</td>
                <td>{formatCurrency(row.amount)}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
