import "./App.css";
import { exit } from "@tauri-apps/plugin-process";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useState, useEffect } from "react";
import InfoDialog from "./components/InfoDialog";

const fileFilters = [
  {
    name: "Text Files",
    extensions: ["txt", "md"],
  },
];

function App() {
  const [fileContent, setFileContent] = useState("Some text");
  const [activeMenu, setActiveMenu] = useState(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [filePath, setFilePath] = useState(undefined);

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
    if (!filePath) return;

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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "o") {
        event.preventDefault();
        handleOpenFile();
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
        name="text-editor"
        id="text-editor"
        className="w-full grow resize-none border-none font-mono focus:outline-none"
        value={fileContent}
        onChange={(event) => setFileContent(event.target.value)}
      ></textarea>

      <InfoDialog open={showInfoDialog} onClose={handleCloseInfo} />
    </main>
  );
}

export default App;
