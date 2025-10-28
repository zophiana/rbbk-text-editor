import "./App.css";
import { exit } from "@tauri-apps/plugin-process";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useState, useEffect, useRef } from "react";
import InfoDialog from "./components/InfoDialog";
import SpecialCharsDialog from "./components/SpecialCharsDialog";
import { useCursorPosition } from "./hooks";

const fileFilters = [
  {
    name: ".txt, .csv, .java",
    extensions: ["txt", "csv", "java"],
  },
];

function App() {
  const [fileContent, setFileContent] = useState("Some text");
  const [activeMenu, setActiveMenu] = useState(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showSpecialCharsDialog, setShowSpecialCharsDialog] = useState(false);
  const [filePath, setFilePath] = useState(undefined);
  const textAreaRef = useRef(null);
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
  ] = useCursorPosition(textAreaRef, fileContent);

  const handleNewFile = () => {
    setFileContent("");
    setFilePath(undefined);
    setActiveMenu(null);
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
    setActiveMenu(null);
  };

  const handleSaveFile = async () => {
    if (!filePath) {
      await handleSaveFileAs();
      return;
    }

    await writeTextFile(filePath, fileContent);
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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "o") {
          event.preventDefault();
          handleOpenFile();
        } else if (event.key === "i") {
          event.preventDefault();
          handleShowSpecialChars();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
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
      <textarea
        ref={textAreaRef}
        name="text-editor"
        id="text-editor"
        className="w-full grow resize-none border-none font-mono focus:outline-none bg-[image:linear-gradient(90deg,transparent_0%,transparent_60ch,#ccc_60ch,#ccc_calc(60ch+1px),transparent_calc(60ch+1px))] bg-[length:100%_100%] bg-no-repeat"
        value={fileContent}
        onChange={(event) => setFileContent(event.target.value)}
      ></textarea>

      <div className="bg-stone-200 border-t border-stone-300 text-sm flex items-center px-2 py-1 gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="cursor-row" className="text-stone-600">
            Row:
          </label>
          <input
            id="cursor-row"
            type="number"
            min="1"
            value={inputValues.inputRow}
            onChange={handleRowChange}
            onBlur={handleRowBlur}
            className="w-16 px-1 py-0.5 border border-stone-400 rounded text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="cursor-char" className="text-stone-600">
            Char:
          </label>
          <input
            id="cursor-char"
            type="number"
            min="1"
            value={inputValues.inputChar}
            onChange={handleCharChange}
            onBlur={handleCharBlur}
            className="w-16 px-1 py-0.5 border border-stone-400 rounded text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="cursor-absolute-char" className="text-stone-600">
            Zeichen:
          </label>
          <input
            id="cursor-absolute-char"
            type="number"
            min="1"
            value={inputValues.inputAbsoluteChar}
            onChange={handleAbsoluteCharChange}
            onBlur={handleAbsoluteCharBlur}
            className="w-16 px-1 py-0.5 border border-stone-400 rounded text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <input type="number" className="opacity-0" />
      </div>

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
