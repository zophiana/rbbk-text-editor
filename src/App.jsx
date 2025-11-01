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
  const [replaceQuery, setReplaceQuery] = useState("");
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

  useEffect(() => {
    const updateTitle = async () => {
      try {
        const fileName = filePath
          ? filePath.split(/[\\/]/).pop() || filePath
          : "Unbenannt";
        const unsavedDot = hasUnsavedChanges ? "⦁" : " ";
        const title = `${fileName} ${unsavedDot} - Text Editor`;
        const currentWindow = getCurrentWindow();
        await currentWindow.setTitle(title);
      } catch (e) {
        // If not running inside Tauri (e.g. in the browser) this may fail —
        // just log and continue.
        // eslint-disable-next-line no-console
        console.warn("Unable to set window title:", e);
      }
    };

    updateTitle();
  }, [filePath, hasUnsavedChanges]);

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
      // Close menus with Escape
      if (event.key === "Escape") {
        if (activeMenu) {
          setActiveMenu(null);
          event.preventDefault();
          return;
        }
      }
      // Global shortcuts
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();

        switch (key) {
          case "n":
            event.preventDefault();
            handleNewFile();
            return;
          case "o":
            event.preventDefault();
            handleOpenFile();
            return;
          case "s":
            event.preventDefault();
            if (event.shiftKey) {
              handleSaveFileAs();
            } else {
              handleSaveFile();
            }
            return;
          case "f":
            event.preventDefault();
            focusFindInput();
            setActiveMenu(null);
            return;
          case "i":
            event.preventDefault();
            handleShowSpecialChars();
            return;
          case "q":
            event.preventDefault();
            handleExit();
            return;
          default:
            break;
        }
      }
      // F1: Info dialog
      if (event.key === "F1") {
        event.preventDefault();
        handleShowInfo();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMenu]);

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
    // Choose initial active match based on current cursor position:
    // Start searching from the caret absolute position (0-based). If a match
    // exists at or after the caret, select that one; otherwise default to first
    // match. This makes the search begin from the current cursor location.
    if (positions.length === 0) {
      setActiveMatchIndex(0);
    } else {
      const caretPos = (cursorPosition?.absoluteChar ?? 1) - 1;
      const idxFromCaret = positions.findIndex((p) => p >= caretPos);
      setActiveMatchIndex(idxFromCaret >= 0 ? idxFromCaret : 0);
    }
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
    // Prefer native smooth scrolling when available. This will scroll the
    // editable container so the active match is centered vertically/horizontally.
    try {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
      return;
    } catch (_) {
      // Fall through to manual scrolling below if scrollIntoView with options
      // isn't supported in the environment.
    }

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
    const nextIndex = (activeMatchIndex + 1) % matchPositions.length;
    setActiveMatchIndex(nextIndex);
    scrollMatchIntoView(nextIndex);
  };

  const handleFindPrev = () => {
    if (matchPositions.length === 0) return;
    const prevIndex =
      (activeMatchIndex - 1 + matchPositions.length) % matchPositions.length;
    setActiveMatchIndex(prevIndex);
    scrollMatchIntoView(prevIndex);
  };

  // Escape for building regex from the literal query
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const handleReplaceOne = () => {
    if (!findQuery || matchPositions.length === 0) return;
    const idx = Math.min(activeMatchIndex, matchPositions.length - 1);
    const start = matchPositions[idx];
    const end = start + findQuery.length;
    const newContent =
      fileContent.slice(0, start) + replaceQuery + fileContent.slice(end);

    setFileContent(newContent);
    // After update, focus and place caret after the inserted replacement
    setTimeout(() => {
      editableDivRef.current?.focus();
      const caretPos = start + (replaceQuery ? replaceQuery.length : 0);
      setSelectionRangeCE(caretPos, caretPos);
      // Try to keep showing the same logical match index
      scrollMatchIntoView(idx);
    }, 0);
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const flags = ignoreCase ? "gi" : "g";
    const regex = new RegExp(escapeRegExp(findQuery), flags);
    const newContent = fileContent.replace(regex, replaceQuery);
    setFileContent(newContent);
    setActiveMatchIndex(0);
    setTimeout(() => editableDivRef.current?.focus(), 0);
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
          i === activeMatchIndex ? "bg-blue-200" : "bg-yellow-200";
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
        <div
          className="relative"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => {
            if (activeMenu) setActiveMenu("datei");
          }}
        >
          <button
            className={`px-2 py-1 flex items-center ${
              activeMenu === "datei" ? "bg-stone-300" : "hover:bg-stone-300"
            }`}
            onClick={() =>
              setActiveMenu(activeMenu === "datei" ? null : "datei")
            }
          >
            Datei
          </button>
          {activeMenu === "datei" && (
            <div className="absolute top-full left-0 bg-white border border-stone-300 shadow-lg z-10 min-w-64">
              <button
                className="w-full text-left px-2 py-1 hover:bg-stone-100 flex items-center justify-between"
                onClick={handleNewFile}
              >
                <span>Neu</span>
                <span className="text-stone-500 ml-8">Ctrl+N</span>
              </button>
              <button
                className="w-full text-left px-2 py-1 hover:bg-stone-100 flex items-center justify-between"
                onClick={handleOpenFile}
              >
                <span>Laden</span>
                <span className="text-stone-500 ml-8">Ctrl+O</span>
              </button>
              <button
                className="w-full text-left px-2 py-1 hover:bg-stone-100 flex items-center justify-between"
                onClick={handleSaveFile}
              >
                <span>Speichern</span>
                <span className="text-stone-500 ml-8">Ctrl+S</span>
              </button>
              <button
                className="w-full text-left px-2 py-1 hover:bg-stone-100 flex items-center justify-between"
                onClick={handleSaveFileAs}
              >
                <span>Speichern unter</span>
                <span className="text-stone-500 ml-8">Ctrl+Shift+S</span>
              </button>
              <button
                className="w-full text-left px-2 py-1 hover:bg-stone-100 flex items-center justify-between"
                onClick={handleExit}
              >
                <span>Beenden</span>
                <span className="text-stone-500 ml-8">Ctrl+Q</span>
              </button>
            </div>
          )}
        </div>
        <div
          className="relative"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => {
            if (activeMenu) setActiveMenu("bearbeiten");
          }}
        >
          <button
            className={`px-2 py-1 flex items-center ${
              activeMenu === "bearbeiten"
                ? "bg-stone-300"
                : "hover:bg-stone-300"
            }`}
            onClick={() =>
              setActiveMenu(activeMenu === "bearbeiten" ? null : "bearbeiten")
            }
          >
            Bearbeiten
          </button>
          {activeMenu === "bearbeiten" && (
            <div className="absolute top-full left-0 bg-white border border-stone-300 shadow-lg z-10 min-w-48">
              <button
                className="w-full text-left px-2 py-1 hover:bg-stone-100 flex items-center justify-between"
                onClick={() => {
                  focusFindInput();
                  setActiveMenu(null);
                }}
              >
                <span>Suchen</span>
                <span className="text-stone-500 ml-8">Ctrl+F</span>
              </button>
              <button
                className="w-full text-left px-2 py-1 hover:bg-stone-100 flex items-center justify-between"
                onClick={() => {
                  handleShowSpecialChars();
                  setActiveMenu(null);
                }}
              >
                <span>Sonderzeichen einfügen</span>
                <span className="text-stone-500 ml-8">Ctrl+I</span>
              </button>
            </div>
          )}
        </div>
        <div
          className="relative"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => {
            if (activeMenu) setActiveMenu("hilfe");
          }}
        >
          <button
            className={`px-2 py-1 flex items-center ${
              activeMenu === "hilfe" ? "bg-stone-300" : "hover:bg-stone-300"
            }`}
            onClick={() =>
              setActiveMenu(activeMenu === "hilfe" ? null : "hilfe")
            }
          >
            Hilfe
          </button>
          {activeMenu === "hilfe" && (
            <div className="absolute top-full left-0 bg-white border border-stone-300 shadow-lg z-10 min-w-32">
              <button
                className="w-full text-left px-2 py-1 hover:bg-stone-100 flex items-center justify-between"
                onClick={handleShowInfo}
              >
                <span>Info</span>
                <span className="text-stone-500 ml-8">F1</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="relative w-full grow min-h-0 flex">
        <div className="min-h-0 flex-1 min-w-0">
          <div
            ref={editableDivRef}
            contentEditable="true"
            spellCheck="false"
            className="leading-none p-2 w-full h-full min-h-0 whitespace-pre font-mono outline-none overflow-auto bg-[image:linear-gradient(90deg,transparent_0%,transparent_60ch,#ccc_60ch,#ccc_calc(60ch+1px),transparent_calc(60ch+1px))] bg-[length:100%_100%] bg-no-repeat"
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
          <div>
            <div
              className="flex"
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
                onKeyDown={(e) => {
                  // Enter is handled on the container; handle Escape here to
                  // focus the editable area and select the active match.
                  if (e.key === "Escape") {
                    e.preventDefault();
                    // If there are matches, select the active one; otherwise
                    // just focus the editable area.
                    if (matchPositions.length > 0) {
                      // activeMatchIndex is always non-negative; clamp to last index
                      const idx = Math.min(
                        activeMatchIndex,
                        matchPositions.length - 1
                      );
                      const start = matchPositions[idx];
                      const end = start + findQuery.length;
                      // Focus the contentEditable and set selection
                      editableDivRef.current?.focus();
                      setSelectionRangeCE(start, end);
                      scrollMatchIntoView(idx);
                    } else {
                      editableDivRef.current?.focus();
                    }
                  }
                }}
                className="px-2 py-1 border border-stone-300 rounded outline-none focus:border-stone-500 flex-1"
              />
            </div>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder="Replace"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    // Enter triggers single replace; Shift+Enter -> replace all
                    if (e.shiftKey) {
                      handleReplaceAll();
                    } else {
                      handleReplaceOne();
                    }
                  }
                }}
                className="px-2 py-1 min-w-10 border border-stone-300 rounded outline-none focus:border-stone-500"
              />
              <button
                className="px-2 py-1 border border-stone-300 rounded hover:enabled:bg-stone-100 disabled:opacity-50"
                onClick={handleReplaceOne}
                title="Ersetzen (Enter)"
                disabled={
                  matchPositions.length === 0 ||
                  !findQuery ||
                  findQuery === replaceQuery
                }
              >
                Ersetzen
              </button>
              <button
                className="px-2 py-1 border border-stone-300 rounded hover:enabled:bg-stone-100 disabled:opacity-50"
                onClick={handleReplaceAll}
                title="Alle ersetzen (Shift+Enter)"
                disabled={
                  matchPositions.length === 0 ||
                  !findQuery ||
                  findQuery === replaceQuery
                }
              >
                Alle
              </button>
            </div>
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
                className="px-2 py-1 border border-stone-300 rounded hover:enabled:bg-stone-100 disabled:opacity-50"
                onClick={handleFindPrev}
                title="Vorheriger Treffer (Shift+Enter)"
                disabled={matchPositions.length === 0 || !findQuery}
              >
                Vorheriges
              </button>
              <button
                className="px-2 py-1 border border-stone-300 rounded hover:enabled:bg-stone-100 disabled:opacity-50"
                onClick={handleFindNext}
                title="Nächster Treffer (Enter)"
                disabled={matchPositions.length === 0 || !findQuery}
              >
                Suchen
              </button>
            </div>
          </div>
          {findQuery && matchPositions.length === 0 && (
            <div
              className="text-sm text-red-600 italic"
              role="status"
              aria-live="polite"
            >
              {`Keine Treffer für "${findQuery}"`}
            </div>
          )}
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
