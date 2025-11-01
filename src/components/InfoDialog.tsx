import React, { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import ExtraFeaturesDialog from "./ExtraFeaturesDialog";

export default function InfoDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const [extraOpen, setExtraOpen] = useState(false);
  const dialog = React.useRef<HTMLDivElement>(null);
  if (!props.open) return null;

  return (
    <div
      tabIndex={0}
      className="fixed inset-0 bg-gray-800/50 backdrop-blur-[2px] flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      onClick={props.onClose}
      ref={dialog}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !e.defaultPrevented) props.onClose();
      }}
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
          <p className="text-gray-600 mb-4">
            Eine einfache Texteditor-Anwendung
          </p>
          <div className="bg-gray-50 rounded-lg mb-5">
            <p className="text-gray-600 text-sm mb-1">
              Entwickelt von{" "}
              <span className="font-semibold text-gray-800">
                Antonia Schwennesen
              </span>
            </p>
            <p className="text-gray-600 text-sm">
              Klasse: <span className="font-semibold text-gray-800">ITO6</span>
            </p>
          </div>
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            Version 0.1.0
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setExtraOpen(true)}
            className="flex items-center justify-between p-2 hover:bg-gray-100 rounded w-full text-left"
            aria-label="Öffne die Beschreibung der Zusatzfunktionen"
          >
            <span>Zusatzfunktionen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              openUrl("https://github.com/zophiana/rbbk-text-editor/");
            }}
            className="flex items-center justify-between p-2 hover:bg-gray-100 rounded w-full text-left"
            aria-label="Öffne Code auf GitHub"
          >
            <span>Code</span>
            <span className="text-gray-400">↗</span>
          </button>

          <button
            type="button"
            onClick={() => {
              openUrl("https://github.com/zophiana/rbbk-text-editor/issues");
            }}
            className="flex items-center justify-between p-2 hover:bg-gray-100 rounded w-full text-left"
            aria-label="Fehler melden auf GitHub"
          >
            <span>Fehler melden</span>
            <span className="text-gray-400">↗</span>
          </button>

          <button
            type="button"
            onClick={() => {
              openUrl("https://github.com/zophiana/rbbk-text-editor/pulls");
            }}
            className="flex items-center justify-between p-2 hover:bg-gray-100 rounded w-full text-left"
            aria-label="Mitwirken auf GitHub"
          >
            <span>Mitwirken</span>
            <span className="text-gray-400">↗</span>
          </button>
        </div>
      </div>
      <ExtraFeaturesDialog
        open={extraOpen}
        onClose={() => {
          setExtraOpen(false);
          dialog.current?.focus();
        }}
      />
    </div>
  );
}
