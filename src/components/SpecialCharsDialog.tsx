import React from "react";

interface SpecialCharsDialogProps {
  open: boolean;
  onClose: () => void;
  onInsertChar: (char: string) => void;
}

export default function SpecialCharsDialog({
  open,
  onClose,
  onInsertChar,
}: SpecialCharsDialogProps) {
  if (!open) return null;

  // Common special characters organized by category
  const specialChars = {
    "Deutsche Umlaute": ["ä", "ö", "ü", "Ä", "Ö", "Ü", "ß"],
    "Französische Akzente": ["à", "á", "â", "ã", "ä", "å", "æ", "ç", "è", "é", "ê", "ë", "ì", "í", "î", "ï", "ð", "ñ", "ò", "ó", "ô", "õ", "ö", "ø", "ù", "ú", "û", "ü", "ý", "þ", "ÿ"],
    "Spanische Zeichen": ["ñ", "Ñ", "¿", "¡"],
    "Mathematische Symbole": ["±", "×", "÷", "∞", "≤", "≥", "≠", "≈", "∑", "∏", "√", "∫", "∂", "∆", "∇"],
    "Währungssymbole": ["€", "$", "£", "¥", "¢", "₹", "₽"],
    "Pfeile": ["←", "→", "↑", "↓", "↔", "↕", "⇐", "⇒", "⇑", "⇓", "⇔", "⇕"],
    "Sonstige": ["©", "®", "™", "§", "¶", "†", "‡", "•", "◦", "‣", "⁃", "…", "–", "—", "„", '"', "'", "'", "«", "»", "‹", "›"],
    "Griechische Buchstaben": ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "ο", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω", "Α", "Β", "Γ", "Δ", "Ε", "Ζ", "Η", "Θ", "Ι", "Κ", "Λ", "Μ", "Ν", "Ξ", "Ο", "Π", "Ρ", "Σ", "Τ", "Υ", "Φ", "Χ", "Ψ", "Ω"],
  };

  const handleCharClick = (char: string) => {
    onInsertChar(char);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-800/50 backdrop-blur-[2px] flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 text-gray-800 shadow-xl border border-gray-200 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Sonderzeichen einfügen</h2>
          <button
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
            onClick={onClose}
            aria-label="Schließen"
            className="text-gray-400 hover:text-gray-600 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(specialChars).map(([category, chars]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-gray-600 mb-3 border-b border-gray-200 pb-1">
                {category}
              </h3>
              <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-2">
                {chars.map((char) => (
                  <button
                    key={char}
                    onClick={() => handleCharClick(char)}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors text-lg font-mono"
                    title={`${char} einfügen`}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500 text-center">
          Klicken Sie auf ein Zeichen, um es an der aktuellen Cursorposition einzufügen
        </div>
      </div>
    </div>
  );
}
