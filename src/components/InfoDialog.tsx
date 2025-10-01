import React from "react";

export default function InfoDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-800/50 backdrop-blur-[2px] flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      onClick={props.onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-gray-800 shadow-xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end mb-4">
          <button
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") props.onClose();
            }}
            onClick={props.onClose}
            aria-label="Schließen"
            className="text-gray-400 hover:text-gray-600 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Text Editor</h3>
          <p className="text-gray-600 mb-2">
            Eine einfache Texteditor-Anwendung
          </p>
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            Version 0.1.0
          </div>
        </div>

        <div className="space-y-2">
          <a
            href="https://github.com/zophiana/rbbk-text-editor/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
          >
            <span>Code</span>
            <span className="text-gray-400">↗</span>
          </a>
          <a
            href="https://github.com/zophiana/rbbk-text-editor/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
          >
            <span>Fehler melden</span>
            <span className="text-gray-400">↗</span>
          </a>
          <a
            href="https://github.com/zophiana/rbbk-text-editor/pulls"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
          >
            <span>Mitwirken</span>
            <span className="text-gray-400">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
