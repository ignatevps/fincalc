import { NumericFormat } from "react-number-format";

// The separators have to survive typing, which means reformatting on every
// keystroke — and that moves the caret unless something puts it back. That
// "something" is the whole job of the library; doing it by hand is a day's
// work and a long tail of edge cases.
export default function AmountInput({ value, onChange, ...rest }) {
  return (
    <NumericFormat
      value={value}
      onValueChange={(v) => onChange(v.floatValue ?? 0)}
      thousandSeparator=" "
      decimalScale={0}
      allowNegative={false}
      inputMode="numeric"
      {...rest}
    />
  );
}
