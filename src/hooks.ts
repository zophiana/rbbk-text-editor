import { useCallback, useEffect, useState, type RefObject } from "react";

type Sel = { start: number; end: number };

export function useCaret<T extends HTMLElement>(
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

    // If it's an input/textarea, use selectionStart/End
    const anyEl = el as any;
    if (
      typeof anyEl.selectionStart === "number" &&
      typeof anyEl.selectionEnd === "number"
    ) {
      setSel({
        start: anyEl.selectionStart ?? 0,
        end: anyEl.selectionEnd ?? 0,
      });
      return;
    }

    // Otherwise, compute selection inside contentEditable
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preRange = range.cloneRange();
      preRange.selectNodeContents(el);
      preRange.setEnd(range.endContainer, range.endOffset);
      const end = preRange.toString().length;

      const preStart = range.cloneRange();
      preStart.selectNodeContents(el);
      preStart.setEnd(range.startContainer, range.startOffset);
      const start = preStart.toString().length;

      setSel({ start, end });
    }
  }, []);

  // Set cursor to a specific position (no selection)
  const setCursor = useCallback(
    (position: number) => {
      const el = ref.current as any;
      if (!el) return;

      // If input/textarea
      if (
        typeof el.value === "string" &&
        typeof el.setSelectionRange === "function"
      ) {
        const maxPos = el.value.length;
        const safePos = Math.max(0, Math.min(position, maxPos));
        el.setSelectionRange(safePos, safePos);
        setSel({ start: safePos, end: safePos });
        if (document.activeElement !== el) el.focus();
        return;
      }

      // contentEditable root: place caret at absolute char index
      const root = ref.current as HTMLElement;
      const selection = window.getSelection();
      const range = document.createRange();
      let charIndex = 0;
      const maxPos = root.textContent?.length ?? 0;
      const safePos = Math.max(0, Math.min(position, maxPos));
      let set = false;
      for (const node of Array.from(root.childNodes)) {
        const text = node.textContent || "";
        const length = text.length;
        if (safePos <= charIndex + length) {
          const offset = Math.max(0, safePos - charIndex);
          range.setStart((node as any).firstChild ?? node, offset);
          set = true;
          break;
        }
        charIndex += length;
      }
      if (!set) range.setStart(root, root.childNodes.length);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      setSel({ start: safePos, end: safePos });
      if (document.activeElement !== root) root.focus();
    },
    [ref]
  );

  // Set selection range
  const setSelection = useCallback(
    (start: number, end: number) => {
      const el = ref.current as any;
      if (!el) return;

      // Input/textarea path
      if (
        typeof el.value === "string" &&
        typeof el.setSelectionRange === "function"
      ) {
        const maxPos = el.value.length;
        const safeStart = Math.max(0, Math.min(start, maxPos));
        const safeEnd = Math.max(safeStart, Math.min(end, maxPos));
        el.setSelectionRange(safeStart, safeEnd);
        setSel({ start: safeStart, end: safeEnd });
        if (document.activeElement !== el) el.focus();
        return;
      }

      // contentEditable: map absolute indices to DOM
      const root = ref.current as HTMLElement;
      const selection = window.getSelection();
      const range = document.createRange();
      const maxPos = root.textContent?.length ?? 0;
      const safeStart = Math.max(0, Math.min(start, maxPos));
      const safeEnd = Math.max(safeStart, Math.min(end, maxPos));

      let charIndex = 0;
      let startSet = false;
      let endSet = false;
      for (const node of Array.from(root.childNodes)) {
        const text = node.textContent || "";
        const length = text.length;
        const nodeStart = charIndex;
        const nodeEnd = charIndex + length;
        if (!startSet && safeStart >= nodeStart && safeStart <= nodeEnd) {
          range.setStart(
            (node as any).firstChild ?? node,
            safeStart - nodeStart
          );
          startSet = true;
        }
        if (!endSet && safeEnd >= nodeStart && safeEnd <= nodeEnd) {
          range.setEnd((node as any).firstChild ?? node, safeEnd - nodeStart);
          endSet = true;
        }
        charIndex += length;
        if (startSet && endSet) break;
      }
      if (!startSet) range.setStart(root, 0);
      if (!endSet) range.setEnd(root, root.childNodes.length);
      selection?.removeAllRanges();
      selection?.addRange(range);
      setSel({ start: safeStart, end: safeEnd });
      if (document.activeElement !== root) root.focus();
    },
    [ref]
  );

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
  { row: number; char: number; absoluteChar: number },
  { inputRow: string; inputChar: string; inputAbsoluteChar: string },
  {
    setCursorByRowChar: (row: number, char: number) => void;
    setCursorByAbsoluteChar: (absoluteChar: number) => void;
    setInputRow: (value: string) => void;
    setInputChar: (value: string) => void;
    setInputAbsoluteChar: (value: string) => void;
    validateAndSetRow: (inputValue: string) => void;
    validateAndSetChar: (inputValue: string) => void;
    validateAndSetAbsoluteChar: (inputValue: string) => void;
  }
] {
  const [cursorRow, setCursorRow] = useState(1);
  const [cursorChar, setCursorChar] = useState(1);
  const [cursorAbsoluteChar, setCursorAbsoluteChar] = useState(1);
  const [inputRow, setInputRow] = useState("1");
  const [inputChar, setInputChar] = useState("1");
  const [inputAbsoluteChar, setInputAbsoluteChar] = useState("1");
  const [caret, { setCursor }] = useCaret(ref);

  // Set cursor by row and character
  const setCursorByRowChar = useCallback(
    (row: number, char: number) => {
      const position = getCursorPositionFromRowChar(content, row, char);
      setCursor(position);
    },
    [content, setCursor]
  );

  // Set cursor by absolute character position
  const setCursorByAbsoluteChar = useCallback(
    (absoluteChar: number) => {
      const maxPosition = content.length;
      const safePosition = Math.max(0, Math.min(absoluteChar - 1, maxPosition));
      setCursor(safePosition);
    },
    [content, setCursor]
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
    [content, cursorChar, setCursor]
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
    [content, cursorRow, setCursor]
  );

  // Validate and set absolute character
  const validateAndSetAbsoluteChar = useCallback(
    (inputValue: string) => {
      const newAbsoluteChar = parseInt(inputValue) || 1;
      const maxAbsoluteChar = Math.max(1, content.length);
      const validAbsoluteChar = Math.max(
        1,
        Math.min(newAbsoluteChar, maxAbsoluteChar)
      );

      setInputAbsoluteChar(validAbsoluteChar.toString());
      setCursorAbsoluteChar(validAbsoluteChar);

      setCursorByAbsoluteChar(validAbsoluteChar);
    },
    [content, setCursorByAbsoluteChar]
  );

  // Update row/char when cursor position changes
  useEffect(() => {
    const { row, char } = getRowCharFromCursorPosition(content, caret.end);
    const absoluteChar = caret.end + 1; // Convert 0-based to 1-based

    setCursorRow(row);
    setCursorChar(char);
    setCursorAbsoluteChar(absoluteChar);
    setInputRow(row.toString());
    setInputChar(char.toString());
    setInputAbsoluteChar(absoluteChar.toString());
  }, [caret, content]);

  return [
    { row: cursorRow, char: cursorChar, absoluteChar: cursorAbsoluteChar },
    { inputRow, inputChar, inputAbsoluteChar },
    {
      setCursorByRowChar,
      setCursorByAbsoluteChar,
      setInputRow,
      setInputChar,
      setInputAbsoluteChar,
      validateAndSetRow,
      validateAndSetChar,
      validateAndSetAbsoluteChar,
    },
  ];
}
