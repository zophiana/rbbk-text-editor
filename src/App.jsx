import "./App.css";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { useState } from "react";

function App() {
  const [fileContent, setFileContent] = useState("Some text");
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
          if (!file) return;

          const contents = await readFile(file);
          const decoder = new TextDecoder("utf-8");
          const string = decoder.decode(contents);
          setFileContent(string);
        }}
      >
        Open file
      </button>
      <textarea
        name="text-editor"
        id="text-editor"
        className="size-full resize-none border-none font-mono focus:outline-none"
        value={fileContent}
        onChange={(event) => setFileContent(event.target.value)}
      ></textarea>
    </main>
  );
}

export default App;
