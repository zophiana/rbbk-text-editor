import { useCallback, useEffect, useState, type RefObject } from "react";

type Sel = { start: number; end: number };

export function useCaret<T extends HTMLTextAreaElement | HTMLInputElement>(
  ref: RefObject<T>
): [
  Sel,
  {
    setCursor: (position: number) => void;
    setSelection: (start: number, end: number) => void;
  }
] {
  const [sel, setSel] = useState<Sel>({ start: 0, end: 0 });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    if (document.activeElement !== el) return;

    setSel({
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    });
  }, []);

  // Set cursor to a specific position (no selection)
  const setCursor = useCallback((position: number) => {
    const el = ref.current;
    if (!el) return;

    // Clamp position to valid range
    const maxPos = el.value.length;
    const safePos = Math.max(0, Math.min(position, maxPos));

    el.setSelectionRange(safePos, safePos);
    setSel({ start: safePos, end: safePos });

    // Focus if not already focused
    if (document.activeElement !== el) {
      el.focus();
    }
  }, []);

  // Set selection range
  const setSelection = useCallback((start: number, end: number) => {
    const el = ref.current;
    if (!el) return;

    // Clamp positions to valid range
    const maxPos = el.value.length;
    const safeStart = Math.max(0, Math.min(start, maxPos));
    const safeEnd = Math.max(safeStart, Math.min(end, maxPos));

    el.setSelectionRange(safeStart, safeEnd);
    setSel({ start: safeStart, end: safeEnd });

    // Focus if not already focused
    if (document.activeElement !== el) {
      el.focus();
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener("select", update);
    el.addEventListener("keyup", update);
    el.addEventListener("mouseup", update);

    const onDocSelChange = () => {
      if (document.activeElement === el) update();
    };
    document.addEventListener("selectionchange", onDocSelChange);

    update();

    return () => {
      el.removeEventListener("select", update);
      el.removeEventListener("keyup", update);
      el.removeEventListener("mouseup", update);
      document.removeEventListener("selectionchange", onDocSelChange);
    };
  }, [update, ref]);

  return [sel, { setCursor, setSelection }];
}

function getCursorPositionFromRowChar(
  content: string,
  row: number,
  char: number
) {
  const lines = content.split("\n");
  let position = 0;

  for (let i = 0; i < Math.min(row - 1, lines.length); i++) {
    position += (lines[i] ?? "").length + 1; // +1 for newline character
  }

  // Add character position within the current line
  const currentLine = lines[Math.min(row - 1, lines.length - 1)] ?? "";
  position += Math.min(char - 1, currentLine.length);

  return position;
}

function getRowCharFromCursorPosition(content: string, position: number) {
  const textBeforeCursor = content.substring(0, position);
  const lines = textBeforeCursor.split("\n");
  const row = lines.length;
  const char = (lines[lines.length - 1] ?? "").length + 1;
  return { row, char };
}

export function useCursorPosition<
  T extends HTMLTextAreaElement | HTMLInputElement
>(
  ref: RefObject<T>,
  content: string
): [
  { row: number; char: number },
  { inputRow: string; inputChar: string },
  {
    setCursorByRowChar: (row: number, char: number) => void;
    setInputRow: (value: string) => void;
    setInputChar: (value: string) => void;
    validateAndSetRow: (inputValue: string) => void;
    validateAndSetChar: (inputValue: string) => void;
  }
] {
  const [cursorRow, setCursorRow] = useState(1);
  const [cursorChar, setCursorChar] = useState(1);
  const [inputRow, setInputRow] = useState("1");
  const [inputChar, setInputChar] = useState("1");
  const [caret, { setCursor }] = useCaret(ref);

  // Set cursor by row and character
  const setCursorByRowChar = useCallback(
    (row: number, char: number) => {
      const position = getCursorPositionFromRowChar(content, row, char);
      setCursor(position);
    },
    [getCursorPositionFromRowChar, setCursor]
  );

  // Validate and set row
  const validateAndSetRow = useCallback(
    (inputValue: string) => {
      const newRow = parseInt(inputValue) || 1;
      const lines = content.split("\n");
      const maxRow = Math.max(1, lines.length);
      const validRow = Math.max(1, Math.min(newRow, maxRow));

      setInputRow(validRow.toString());
      setCursorRow(validRow);

      const position = getCursorPositionFromRowChar(
        content,
        validRow,
        cursorChar
      );
      setCursor(position);
    },
    [content, cursorChar, getCursorPositionFromRowChar, setCursor]
  );

  // Validate and set character
  const validateAndSetChar = useCallback(
    (inputValue: string) => {
      const newChar = parseInt(inputValue) || 1;
      const lines = content.split("\n");
      const currentLine = lines[cursorRow - 1] || "";
      const maxChar = Math.max(1, currentLine.length + 1);
      const validChar = Math.max(1, Math.min(newChar, maxChar));

      setInputChar(validChar.toString());
      setCursorChar(validChar);

      const position = getCursorPositionFromRowChar(
        content,
        cursorRow,
        validChar
      );
      setCursor(position);
    },
    [content, cursorRow, getCursorPositionFromRowChar, setCursor]
  );

  // Update row/char when cursor position changes
  useEffect(() => {
    const { row, char } = getRowCharFromCursorPosition(content, caret.end);
    setCursorRow(row);
    setCursorChar(char);
    setInputRow(row.toString());
    setInputChar(char.toString());
  }, [caret, getRowCharFromCursorPosition]);

  return [
    { row: cursorRow, char: cursorChar },
    { inputRow, inputChar },
    {
      setCursorByRowChar,
      setInputRow,
      setInputChar,
      validateAndSetRow,
      validateAndSetChar,
    },
  ];
}
