import "./App.css";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

function App() {
  const [fileName, setFileName] = useState("Some text");
  return (
    <main className="w-screen h-screen">
      <button
        onClick={async () => {
          const file = await open({
            multiple: false,
            directory: false,
            filters: [
              {
                name: "Text Files",
                extensions: ["txt", "md"],
              },
            ],
          });
          setFileName(file);
        }}
      >
        Open file
      </button>
      <textarea
        name="text-editor"
        id="text-editor"
        className="size-full resize-none border-none font-mono focus:outline-none"
        value={fileName}
        onChange={(event) => setFileName(event.target.value)}
      ></textarea>
    </main>
  );
}

export default App;
