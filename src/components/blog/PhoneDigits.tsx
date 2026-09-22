import { useRef, useEffect } from "react";

interface PhoneDigitsProps {
  value: string;
  onChange: (digits: string) => void;
  length: number;
  autoFocus?: boolean;
  ariaLabel?: string;
}

/**
 * Segmented phone number input — one box per digit, auto-advances on type,
 * backspaces to the previous box, and accepts pasting a full number.
 * Elder-friendly: large tap targets, single-character focus per cell.
 */
export function PhoneDigits({ value, onChange, length, autoFocus, ariaLabel = "Phone number" }: PhoneDigitsProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.replace(/\D/g, "").slice(0, length).padEnd(length, " ").split("");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setAt = (i: number, ch: string) => {
    const current = value.replace(/\D/g, "").slice(0, length).split("");
    while (current.length < i) current.push("");
    current[i] = ch;
    onChange(current.join("").replace(/\s/g, "").slice(0, length));
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) { setAt(i, ""); return; }
    if (raw.length > 1) {
      // paste-like: distribute across cells starting at i
      const merged = (value.replace(/\D/g, "").slice(0, i) + raw).slice(0, length);
      onChange(merged);
      const next = Math.min(merged.length, length - 1);
      refs.current[next]?.focus();
      return;
    }
    setAt(i, raw);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i].trim() && i > 0) {
      refs.current[i - 1]?.focus();
      setAt(i - 1, "");
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const raw = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!raw) return;
    e.preventDefault();
    const merged = (value.replace(/\D/g, "").slice(0, i) + raw).slice(0, length);
    onChange(merged);
    const next = Math.min(merged.length, length - 1);
    refs.current[next]?.focus();
  };

  return (
    <div className="flex gap-1.5 justify-between" role="group" aria-label={ariaLabel}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
          className="w-full h-12 min-w-0 rounded-md border border-input bg-background text-center text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ))}
    </div>
  );
}
