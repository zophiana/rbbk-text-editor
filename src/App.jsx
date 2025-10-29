import "./App.css";
import { exit } from "@tauri-apps/plugin-process";
import { open, save, confirm } from "@tauri-apps/plugin-dialog";
import { readFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState, useEffect, useRef, useMemo } from "react";
import InfoDialog from "./components/InfoDialog";
import SpecialCharsDialog from "./components/SpecialCharsDialog";
import Console from "./components/Console";
import { useCursorPosition } from "./hooks";

const fileFilters = [
  {
    name: ".txt, .csv, .java",
    extensions: ["txt", "csv", "java"],
  },
];

function App() {
  const [fileContent, setFileContent] = useState("Some text\n");
  const [activeMenu, setActiveMenu] = useState(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showSpecialCharsDialog, setShowSpecialCharsDialog] = useState(false);
  const [filePath, setFilePath] = useState(undefined);
  const [consoleMessages, setConsoleMessages] = useState([]);
  const [originalContent, setOriginalContent] = useState("Some text\n");
  const textAreaRef = useRef(null);
  const [findQuery, setFindQuery] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [matchPositions, setMatchPositions] = useState([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const findInputRef = useRef(null);
  const editableDivRef = useRef(null);
  const lastRenderSigRef = useRef("");
  const [
    cursorPosition,
    inputValues,
    {
      setInputRow,
      setInputChar,
      setInputAbsoluteChar,
      validateAndSetRow,
      validateAndSetChar,
      validateAndSetAbsoluteChar,
    },
  ] = useCursorPosition(editableDivRef, fileContent);

  const hasUnsavedChanges = useMemo(() => originalContent !== fileContent);

  const addConsoleMessage = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleMessages((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleNewFile = () => {
    setFileContent("");
    setFilePath(undefined);
    setOriginalContent("");
    setActiveMenu(null);
    addConsoleMessage("New file created - 0 bytes");
  };

  const handleOpenFile = async () => {
    const file = await open({
      multiple: false,
      directory: false,
      filters: fileFilters,
    });
    if (!file) return;

    const contents = await readFile(file);
    setFilePath(file);
    const decoder = new TextDecoder("utf-8");
    const string = decoder.decode(contents);
    setFileContent(string);
    setOriginalContent(string);
    setActiveMenu(null);

    // Calculate file size in bytes
    const fileSize = contents.length;
    const fileName = file.split("/").pop() || file;
    addConsoleMessage(`File loaded: ${fileName} (${fileSize} bytes)`);
  };

  const handleSaveFile = async () => {
    if (!filePath) {
      await handleSaveFileAs();
      return;
    }

    await writeTextFile(filePath, fileContent);
    setOriginalContent(fileContent);
    setActiveMenu(null);
  };

  const handleSaveFileAs = async () => {
    const file = await save({
      multiple: false,
      directory: false,
      filters: fileFilters,
    });
    if (!file) return;

    await writeTextFile(file, fileContent);
    setFilePath(file);
    setOriginalContent(fileContent);
    setActiveMenu(null);
  };

  const handleExit = async () => {
    await exit(0);
  };

  const handleShowInfo = () => {
    setShowInfoDialog(true);
    setActiveMenu(null);
  };

  const handleCloseInfo = () => {
    setShowInfoDialog(false);
  };

  const handleShowSpecialChars = () => {
    setShowSpecialCharsDialog(true);
    setActiveMenu(null);
  };

  const handleCloseSpecialChars = () => {
    setShowSpecialCharsDialog(false);
  };

  const focusFindInput = () => {
    setTimeout(() => {
      findInputRef.current?.focus();
      findInputRef.current?.select();
    }, 0);
  };

  const handleInsertChar = (char) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      fileContent.substring(0, start) + char + fileContent.substring(end);

    setFileContent(newContent);

    // Set cursor position after the inserted character
    setTimeout(() => {
      const newPosition = start + char.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const handleRowChange = (event) => {
    setInputRow(event.target.value);
  };

  const handleCharChange = (event) => {
    setInputChar(event.target.value);
  };

  const handleAbsoluteCharChange = (event) => {
    setInputAbsoluteChar(event.target.value);
  };

  const handleRowBlur = () => {
    validateAndSetRow(inputValues.inputRow);
  };

  const handleCharBlur = () => {
    validateAndSetChar(inputValues.inputChar);
  };

  const handleAbsoluteCharBlur = () => {
    validateAndSetAbsoluteChar(inputValues.inputAbsoluteChar);
  };

  const handleRowKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      validateAndSetRow(inputValues.inputRow);
    }
  };

  const handleCharKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      validateAndSetChar(inputValues.inputChar);
    }
  };

  const handleAbsoluteCharKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      validateAndSetAbsoluteChar(inputValues.inputAbsoluteChar);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "o") {
          event.preventDefault();
          handleOpenFile();
        } else if (event.key === "i") {
          event.preventDefault();
          handleShowSpecialChars();
        } else if (event.key === "f") {
          event.preventDefault();
          focusFindInput();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Recompute matches when content, query, or case setting changes
  useEffect(() => {
    if (!findQuery) {
      setMatchPositions([]);
      setActiveMatchIndex(0);
      return;
    }

    const haystack = ignoreCase ? fileContent.toLowerCase() : fileContent;
    const needle = ignoreCase ? findQuery.toLowerCase() : findQuery;

    const positions = [];
    let fromIndex = 0;
    while (needle && fromIndex <= haystack.length) {
      const idx = haystack.indexOf(needle, fromIndex);
      if (idx === -1) break;
      positions.push(idx);
      fromIndex = idx + (needle.length || 1);
    }

    setMatchPositions(positions);
    // If there are matches and current selection is outside, reset to first
    setActiveMatchIndex((prev) => {
      if (positions.length === 0) return 0;
      return Math.min(prev, Math.max(positions.length - 1, 0));
    });
  }, [fileContent, findQuery, ignoreCase]);

  // When active match changes, select it in the textarea
  // Utilities for contentEditable caret/selection management
  const getCaretPosition = () => {
    if (!editableDivRef.current) return 0;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editableDivRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    }
    return 0;
  };

  const setCaretPosition = (position) => {
    if (!editableDivRef.current) return;
    const selection = window.getSelection();
    const range = document.createRange();
    let charIndex = 0;
    const root = editableDivRef.current;
    for (const node of root.childNodes) {
      const text = node?.textContent || "";
      const length = text.length;
      if (position <= charIndex + length) {
        const offset = Math.max(0, position - charIndex);
        const target = node.firstChild ?? node;
        try {
          range.setStart(target, offset);
        } catch (_) {
          range.setStart(root, root.childNodes.length);
        }
        break;
      }
      charIndex += length;
    }
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const setSelectionRangeCE = (startPos, endPos) => {
    if (!editableDivRef.current) return;
    const selection = window.getSelection();
    const range = document.createRange();
    let charIndex = 0;
    let startSet = false;
    let endSet = false;
    const root = editableDivRef.current;
    for (const node of root.childNodes) {
      const text = node?.textContent || "";
      const length = text.length;
      const nodeStart = charIndex;
      const nodeEnd = charIndex + length;

      if (!startSet && startPos >= nodeStart && startPos <= nodeEnd) {
        const offset = Math.max(0, startPos - nodeStart);
        range.setStart(node.firstChild ?? node, offset);
        startSet = true;
      }
      if (!endSet && endPos >= nodeStart && endPos <= nodeEnd) {
        const offset = Math.max(0, endPos - nodeStart);
        range.setEnd(node.firstChild ?? node, offset);
        endSet = true;
      }

      charIndex += length;
      if (startSet && endSet) break;
    }
    if (!startSet) range.setStart(root, 0);
    if (!endSet) range.setEnd(root, root.childNodes.length);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const scrollMatchIntoView = (matchIndex) => {
    const container = editableDivRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-match-index=\"${matchIndex}\"]`);
    if (!el) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    // Compute deltas relative to container scrollable area
    const topDelta = eRect.top - cRect.top;
    const bottomDelta = eRect.bottom - cRect.bottom;
    const leftDelta = eRect.left - cRect.left;
    const rightDelta = eRect.right - cRect.right;
    const margin = 8; // small padding

    if (topDelta < margin) {
      container.scrollTop += topDelta - margin;
    } else if (bottomDelta > -margin) {
      container.scrollTop += bottomDelta + margin;
    }

    if (leftDelta < margin) {
      container.scrollLeft += leftDelta - margin;
    } else if (rightDelta > -margin) {
      container.scrollLeft += rightDelta + margin;
    }
  };

  const handleFindNext = () => {
    if (matchPositions.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % matchPositions.length);
  };

  const handleFindPrev = () => {
    if (matchPositions.length === 0) return;
    setActiveMatchIndex(
      (prev) => (prev - 1 + matchPositions.length) % matchPositions.length
    );
  };

  // Render content into the contentEditable with highlighted matches
  const refreshEditable = (preserveCaret) => {
    if (!editableDivRef.current) return;
    const sig = `${fileContent}\n__FQ__:${findQuery}\n__MP__:${matchPositions.join(
      ","
    )}\n__AMI__:${activeMatchIndex}`;
    if (!preserveCaret && lastRenderSigRef.current === sig) {
      return;
    }
    const caret = preserveCaret ? getCaretPosition() : null;
    const root = editableDivRef.current;
    root.innerHTML = "";

    const frag = document.createDocumentFragment();
    if (!findQuery || matchPositions.length === 0) {
      frag.appendChild(document.createTextNode(fileContent));
    } else {
      let lastIndex = 0;
      for (let i = 0; i < matchPositions.length; i++) {
        const start = matchPositions[i];
        const end = start + findQuery.length;
        if (lastIndex < start) {
          frag.appendChild(
            document.createTextNode(fileContent.slice(lastIndex, start))
          );
        }
        const span = document.createElement("span");
        span.className =
          i === activeMatchIndex ? "bg-orange-300" : "bg-yellow-200";
        span.dataset.matchIndex = String(i);
        span.textContent = fileContent.slice(start, end);
        frag.appendChild(span);
        lastIndex = end;
      }
      if (lastIndex < fileContent.length) {
        frag.appendChild(document.createTextNode(fileContent.slice(lastIndex)));
      }
    }
    root.appendChild(frag);
    lastRenderSigRef.current = sig;
    if (preserveCaret && caret !== null) {
      setCaretPosition(caret);
    }
  };

  // Update rendered content when dependencies change
  useEffect(() => {
    refreshEditable(document.activeElement === editableDivRef.current);
  }, [fileContent, findQuery, matchPositions, activeMatchIndex]);

  // Move selection to active match if the editor is focused; always ensure visibility
  useEffect(() => {
    if (!findQuery || matchPositions.length === 0) return;
    const start = matchPositions[activeMatchIndex] ?? matchPositions[0];
    const end = start + findQuery.length;
    try {
      if (document.activeElement === editableDivRef.current) {
        setSelectionRangeCE(start, end);
      }
      // Ensure the active match is visible even when unfocused
      requestAnimationFrame(() => scrollMatchIntoView(activeMatchIndex));
    } catch (_) {}
  }, [activeMatchIndex, matchPositions, findQuery]);

  useEffect(() => {
    let unlisten;

    const setupCloseListener = async () => {
      const currentWindow = getCurrentWindow();

      unlisten = await currentWindow.onCloseRequested(async (event) => {
        console.log("onCloseRequested!");
        console.log(hasUnsavedChanges);
        if (hasUnsavedChanges) {
          const userConfirmed = await confirm(
            "You have unsaved changes. Are you sure you want to close the application?",
            "Unsaved Changes"
          );

          if (!userConfirmed) {
            console.log("do not close");
            // Prevent the window from closing
            event.preventDefault();
          } else {
            console.log("do close!");
          }
        }
      });
    };

    setupCloseListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [hasUnsavedChanges]);

  // Add initial console message
  useEffect(() => {
    addConsoleMessage("Text Editor initialized");
  }, []);

  return (
    <main
      className="w-screen h-screen flex flex-col"
      onClick={() => setActiveMenu(null)}
    >
      <div className="bg-stone-200 border-b border-stone-300 text-sm flex">
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            className="hover:bg-stone-300 px-2 py-1 flex items-center"
            onClick={() =>
              setActiveMenu(activeMenu === "datei" ? null : "datei")
            }
          >
            Datei
          </button>
          {activeMenu === "datei" && (
            <div className="absolute top-full left-0 bg-white border border-stone-300 shadow-lg z-10 min-w-36">
              <button
                className="block w-full text-left px-2 py-1 hover:bg-stone-100"
                onClick={handleNewFile}
              >
                Neu
              </button>
              <button
                className="block w-full text-left px-2 py-1 hover:bg-stone-100"
                onClick={handleOpenFile}
              >
                Laden
              </button>
              <button
                className="block w-full text-left px-2 py-1 hover:bg-stone-100"
                onClick={handleSaveFile}
              >
                Speichern
              </button>
              <button
                className="block w-full text-left px-2 py-1 hover:bg-stone-100"
                onClick={handleSaveFileAs}
              >
                Speichern unter
              </button>
              <button
                className="block w-full text-left px-2 py-1 hover:bg-stone-100"
                onClick={handleExit}
              >
                Beenden
              </button>
            </div>
          )}
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            className="hover:bg-stone-300 px-2 py-1 flex items-center"
            onClick={() =>
              setActiveMenu(activeMenu === "bearbeiten" ? null : "bearbeiten")
            }
          >
            Bearbeiten
          </button>
          {activeMenu === "bearbeiten" && (
            <div className="absolute top-full left-0 bg-white border border-stone-300 shadow-lg z-10 min-w-36">
              <button
                className="block w-full text-left px-2 py-1 hover:bg-stone-100"
                onClick={() => {
                  focusFindInput();
                  setActiveMenu(null);
                }}
              >
                Suchen
              </button>
            </div>
          )}
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            className="hover:bg-stone-300 px-2 py-1 flex items-center"
            onClick={() =>
              setActiveMenu(activeMenu === "hilfe" ? null : "hilfe")
            }
          >
            Hilfe
          </button>
          {activeMenu === "hilfe" && (
            <div className="absolute top-full left-0 bg-white border border-stone-300 shadow-lg z-10 min-w-32">
              <button
                className="block w-full text-left px-2 py-1 hover:bg-stone-100"
                onClick={handleShowInfo}
              >
                Info
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="relative w-full grow min-h-0 flex">
        <div className="min-h-0 flex-1">
          <div
            ref={editableDivRef}
            contentEditable="true"
            spellCheck="false"
            className="w-full h-full min-h-0 whitespace-pre-wrap font-mono outline-none overflow-auto bg-[image:linear-gradient(90deg,transparent_0%,transparent_60ch,#ccc_60ch,#ccc_calc(60ch+1px),transparent_calc(60ch+1px))] bg-[length:100%_100%] bg-no-repeat"
            onInput={(e) => {
              const target = e.target;
              const rawText = target.innerText;
              // Single source of truth: update state; effect will re-render
              setFileContent(rawText);
            }}
            onKeyDown={(e) => {
              // Prevent inserting new elements via rich paste, keep plain text
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                e.preventDefault();
              }
              if (e.key === "Enter") {
                e.preventDefault();
                const caret = getCaretPosition();
                const before = fileContent.slice(0, caret);
                const after = fileContent.slice(caret);
                const next = `${before}\n\r${after}`;
                setFileContent(next);
                // Advance caret to after the inserted newline
                setTimeout(() => setCaretPosition(caret + 1), 0);
              }
            }}
            onPaste={(e) => {
              // Force plain-text paste
              e.preventDefault();
              const text = (e.clipboardData || window.clipboardData).getData(
                "text"
              );
              document.execCommand("insertText", false, text);
            }}
            suppressContentEditableWarning={true}
          />
        </div>
        <aside className="w-72 border-l border-stone-300 bg-white p-3 text-sm flex flex-col gap-3">
          <div className="font-semibold text-stone-700">Suchen</div>
          <div
            className="flex items-center gap-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (e.shiftKey) {
                  handleFindPrev();
                } else {
                  handleFindNext();
                }
              }
            }}
          >
            <input
              ref={findInputRef}
              type="text"
              placeholder="Find"
              value={findQuery}
              onChange={(e) => {
                setFindQuery(e.target.value);
                setActiveMatchIndex(0);
              }}
              className="px-2 py-1 border border-stone-300 rounded outline-none focus:border-stone-500 flex-1"
            />
          </div>
          <label className="flex items-center gap-2 select-none cursor-pointer text-stone-700">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
            />
            <span>Groß-/Kleinschreibung ignorieren</span>
          </label>
          <div className="flex items-center justify-between text-stone-600">
            <div>
              {matchPositions.length > 0
                ? `${activeMatchIndex + 1} von ${matchPositions.length}`
                : "0 von 0"}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 border border-stone-300 rounded hover:bg-stone-100"
                onClick={handleFindPrev}
                title="Vorheriger Treffer (Shift+Enter)"
              >
                Vorheriges
              </button>
              <button
                className="px-2 py-1 border border-stone-300 rounded hover:bg-stone-100"
                onClick={handleFindNext}
                title="Nächster Treffer (Enter)"
              >
                Suchen
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="bg-stone-200 border-t border-stone-300 text-sm flex items-center px-2 py-1 gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="cursor-row" className="text-stone-600">
            Zeile:
          </label>
          <input
            id="cursor-row"
            type="number"
            min="1"
            value={inputValues.inputRow}
            onChange={handleRowChange}
            onBlur={handleRowBlur}
            onKeyDown={handleRowKeyDown}
            className="w-16 px-1 py-0.5 border border-stone-400 rounded text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="cursor-char" className="text-stone-600">
            Spalte:
          </label>
          <input
            id="cursor-char"
            type="number"
            min="1"
            value={inputValues.inputChar}
            onChange={handleCharChange}
            onBlur={handleCharBlur}
            onKeyDown={handleCharKeyDown}
            className="w-16 px-1 py-0.5 border border-stone-400 rounded text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="cursor-absolute-char" className="text-stone-600">
            Zeichenposition:
          </label>
          <input
            id="cursor-absolute-char"
            type="number"
            min="1"
            value={inputValues.inputAbsoluteChar}
            onChange={handleAbsoluteCharChange}
            onBlur={handleAbsoluteCharBlur}
            onKeyDown={handleAbsoluteCharKeyDown}
            className="w-16 px-1 py-0.5 border border-stone-400 rounded text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <input type="number" className="opacity-0" />
      </div>

      <Console messages={consoleMessages} />

      <InfoDialog open={showInfoDialog} onClose={handleCloseInfo} />
      <SpecialCharsDialog
        open={showSpecialCharsDialog}
        onClose={handleCloseSpecialChars}
        onInsertChar={handleInsertChar}
      />
    </main>
  );
}

export default App;
