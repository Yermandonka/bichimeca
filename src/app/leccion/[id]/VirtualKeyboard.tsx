"use client";

import {
  FINGER_LABELS,
  KEYBOARD_ROWS,
  SPACE_KEY,
  keyForChar,
  type KeyboardKey,
} from "@/domain/keyboard/layout";

/**
 * ISO-ES visual keyboard. The expected key is highlighted (ring + color,
 * never color alone) and its finger is named below the keyboard, so the
 * learner trains location and finger together without looking down.
 */
export function VirtualKeyboard({
  expectedChar,
  hasError,
}: {
  /** Character the learner must type next; null hides the highlight. */
  expectedChar: string | null;
  /** Whether the last attempt at this position was wrong. */
  hasError: boolean;
}) {
  const expectedKey = expectedChar !== null ? keyForChar(expectedChar) : null;

  const renderKey = (key: KeyboardKey, extraClasses = "") => {
    const isExpected = expectedKey?.char === key.char;
    const stateClasses = isExpected
      ? hasError
        ? "border-red-400 bg-red-100 text-red-700 ring-2 ring-red-400"
        : "border-brand-500 bg-brand-100 text-brand-700 ring-2 ring-brand-500"
      : "border-ink-900/10 bg-noche-900 text-ink-600";
    return (
      <span
        key={key.char}
        data-key={key.char}
        className={`flex h-10 items-center justify-center rounded-lg border font-mono text-sm font-semibold shadow-sm transition-colors ${stateClasses} ${extraClasses}`}
      >
        {key.char === " " ? "" : key.char.toUpperCase()}
        {key.isAnchor && (
          <span
            aria-hidden="true"
            className="absolute bottom-1 h-0.5 w-3 rounded-full bg-current opacity-40"
          />
        )}
      </span>
    );
  };

  return (
    <div aria-hidden="true" className="mx-auto mt-6 w-full max-w-2xl select-none">
      <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="grid w-full gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
              paddingLeft: rowIndex * 12,
              paddingRight: (2 - rowIndex) * 6,
            }}
          >
            {row.map((key) => (
              <span key={key.char} className="relative flex">
                {renderKey(key, "w-full")}
              </span>
            ))}
          </div>
        ))}
        <div className="w-1/2">{renderKey(SPACE_KEY, "w-full")}</div>
      </div>
      <p className="mt-2 min-h-5 text-center text-sm text-ink-600">
        {expectedKey ? (
          <>
            Dedo:{" "}
            <span className="font-semibold text-brand-700">
              {FINGER_LABELS[expectedKey.finger]}
            </span>
          </>
        ) : null}
      </p>
    </div>
  );
}
