import React, { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';

import { AppTextInput } from './AppTextInput';
import { formatDateInput } from '../utils/validation';

type Props = Omit<ComponentProps<typeof AppTextInput>, 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (value: string) => void;
};
type Selection = { start: number; end: number };

function cursorAfterDigitCount(value: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let digits = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) {
      digits += 1;
      if (digits === digitCount) return index + 1;
    }
  }
  return value.length;
}

export function DateInput({ value, onChangeText, ...props }: Props) {
  const [selection, setSelection] = useState<Selection>({
    start: value.length,
    end: value.length,
  });
  const selectionRef = useRef(selection);
  const valueRef = useRef(value);
  const propValueRef = useRef(value);
  const pendingSelectionRef = useRef<{
    expected: Selection;
    stale: Selection;
  } | null>(null);

  useEffect(() => {
    if (propValueRef.current === value) {
      return;
    }

    propValueRef.current = value;

    // Local edits update valueRef before notifying the parent. Preserve their
    // calculated selection; only external value changes should move the caret.
    if (valueRef.current !== value) {
      valueRef.current = value;
      const position = value.length;
      const nextSelection = { start: position, end: position };
      selectionRef.current = nextSelection;
      setSelection(nextSelection);
    }
  }, [value]);

  function handleChangeText(nextValue: string) {
    const previousValue = valueRef.current;
    let prefix = 0;
    while (
      prefix < previousValue.length &&
      prefix < nextValue.length &&
      previousValue[prefix] === nextValue[prefix]
    ) prefix += 1;

    let suffix = 0;
    while (
      suffix < previousValue.length - prefix &&
      suffix < nextValue.length - prefix &&
      previousValue[previousValue.length - 1 - suffix] ===
        nextValue[nextValue.length - 1 - suffix]
    ) suffix += 1;

    const rawCursor = nextValue.length - suffix;
    const digitsBeforeCursor = nextValue.slice(0, rawCursor).replace(/\D/g, '').length;
    let nextDigits = nextValue.replace(/\D/g, '').slice(0, 8);
    const previousDigits = previousValue.replace(/\D/g, '');
    const previousCursor = selectionRef.current.start;
    const deletedSeparatorBackward =
      nextValue.length < previousValue.length &&
      previousValue[previousCursor - 1] === '-' &&
      nextDigits === previousDigits;
    const deletedSeparatorForward =
      nextValue.length < previousValue.length &&
      previousValue[previousCursor] === '-' &&
      nextDigits === previousDigits;

    if (deletedSeparatorBackward && digitsBeforeCursor > 0) {
      const removeIndex = digitsBeforeCursor - 1;
      nextDigits = previousDigits.slice(0, removeIndex) + previousDigits.slice(removeIndex + 1);
    } else if (deletedSeparatorForward && digitsBeforeCursor < previousDigits.length) {
      const removeIndex = digitsBeforeCursor;
      nextDigits = previousDigits.slice(0, removeIndex) + previousDigits.slice(removeIndex + 1);
    }

    const formatted = formatDateInput(nextDigits);
    const cursor = cursorAfterDigitCount(formatted, digitsBeforeCursor);
    const nextSelection = { start: cursor, end: cursor };

    // Formatting changes the native string length (for example, inserting
    // YYYY-MM after the fifth digit). React Native can emit a selection event
    // from the pre-format text after this handler; don't let that stale event
    // overwrite the caret we just calculated for the formatted value.
    pendingSelectionRef.current = {
      expected: nextSelection,
      // onChangeText reports the unformatted text first. Native selection
      // events can then arrive for that old text length (rawCursor), after
      // we've already requested the caret position in the formatted value.
      stale: { start: rawCursor, end: rawCursor },
    };
    valueRef.current = formatted;
    selectionRef.current = nextSelection;
    setSelection(nextSelection);
    onChangeText(formatted);
  }

  return (
    <AppTextInput
      {...props}
      value={value}
      onChangeText={handleChangeText}
      keyboardType={props.keyboardType ?? 'numbers-and-punctuation'}
      maxLength={10}
      selection={selection}
      onSelectionChange={event => {
        const nextSelection = event.nativeEvent.selection;
        const pending = pendingSelectionRef.current;

        if (pending) {
          const matchesExpected =
            nextSelection.start === pending.expected.start &&
            nextSelection.end === pending.expected.end;
          const matchesStale =
            nextSelection.start === pending.stale.start &&
            nextSelection.end === pending.stale.end;

          if (matchesExpected) {
            pendingSelectionRef.current = null;
          } else if (matchesStale) {
            return;
          } else {
            // A genuine user caret move is newer than the formatting update.
            pendingSelectionRef.current = null;
          }
        }

        selectionRef.current = nextSelection;
        setSelection(nextSelection);
      }}
    />
  );
}
