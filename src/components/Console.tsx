import React, { useEffect, useRef } from "react";

interface ConsoleProps {
  messages: string[];
}

const Console: React.FC<ConsoleProps> = ({ messages }) => {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={consoleRef}
      className="bg-black text-green-400 font-mono text-xs p-2 h-20 overflow-y-auto border-t border-gray-800"
    >
      <div className="space-y-1">
        {messages.map((message, index) => (
          <div key={index} className="flex items-center">
            <span className="text-green-600 mr-2">$</span>
            <span>{message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Console;
