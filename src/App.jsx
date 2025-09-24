import "./App.css";

function App() {
  return (
    <main className="w-screen h-screen">
      <textarea
        name="text-editor"
        id="text-editor"
        className="size-full resize-none border-none font-mono focus:outline-none"
      >
        Some example text
      </textarea>
    </main>
  );
}

export default App;
