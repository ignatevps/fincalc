import { useState } from "react";
import { formatNumber } from "../utils/formatters";

// Formatting on every keystroke moves the caret to the end: React assigns
// input.value, and assigning the property resets the selection. So the value is
// formatted only while the field is not focused — while typing it round-trips
// unchanged and React leaves the DOM property alone.
//
// type="text" with inputMode="numeric" rather than type="number": the numeric
// keypad without the spinners and the scroll-wheel edits.
export default function AmountInput({ value, onChange, ...rest }) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={focused ? value : formatNumber(value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")))}
      {...rest}
    />
  );
}
