'use client';

import { useState } from 'react';
import { Bug, X } from 'lucide-react';

export function DebugTool() {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 left-4 z-50 bg-amber-600 hover:bg-amber-700 text-white rounded-full p-2.5 shadow-lg"
        title="Debug Tool"
      >
        <Bug size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-700 p-3 flex justify-between items-center">
        <h3 className="text-white font-medium">LocalStorage Debug</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">
          <X size={18} />
        </button>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto">
        <h4 className="text-white text-sm mb-2">Current Local Storage:</h4>
        <div className="space-y-2">
          {Object.keys(localStorage).map((key) => (
            <div key={key} className="text-xs">
              <div className="font-medium text-blue-400">{key}</div>
              <div className="p-1 bg-gray-900 rounded mt-1 text-gray-300 overflow-x-auto whitespace-pre-wrap">
                {localStorage.getItem(key)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => localStorage.clear()}
            className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
} 