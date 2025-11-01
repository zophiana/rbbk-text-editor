import React from "react";

export default function ExtraFeaturesDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-800/50 backdrop-blur-[2px] flex items-center justify-center z-60"
      role="dialog"
      aria-modal="true"
      onClick={props.onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 text-gray-800 shadow-xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold">Zusatzfunktionen</h3>
          <button
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                props.onClose();
                e.preventDefault();
              }
            }}
            onClick={props.onClose}
            aria-label="Schließen"
            className="text-gray-400 hover:text-gray-600 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="text-gray-700">
          <ul className="list-disc pl-4 flex gap-1 flex-col">
            <li>Menüeintrag für den Sonderzeichen-Dialog</li>
            <li>Jeder Menüeintrag hat einen Shortcut</li>
            <li>Es werden immer alle Suchergebnisse markiert</li>
            <li>WYSIWYG-Suche: Sofortige Vorschau aller Treffer</li>
            <li>
              Im Info-Dialog werden Links zu Quellcode, Issue-Tracker und
              Mitwirkung angezeigt
            </li>
            <li>Die aktuelle App-Version wird im Info-Dialog angezeigt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
