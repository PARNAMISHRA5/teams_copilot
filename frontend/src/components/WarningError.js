// --- WarningError.js ---
import React from 'react';

const ICONS = {
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const STYLES = {
  error: { bgColor: 'bg-red-500', textColor: 'text-white', role: 'alert' },
  warning: { bgColor: 'bg-yellow-500', textColor: 'text-gray-900', role: 'status' },
  success: { bgColor: 'bg-green-500', textColor: 'text-white', role: 'status' },
  default: { bgColor: 'bg-gray-700', textColor: 'text-white', role: 'status' },
};

function WarningError({ message, type, isVisible, onClose, topOffset='top-4' }) {
  const normalizedType = type === 'e' ? 'error' : type;
  const { bgColor, textColor, role } = STYLES[normalizedType] || STYLES.default;
  const icon = ICONS[normalizedType] || null;

  const transitionClasses = isVisible
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 -translate-y-full pointer-events-none';

  return (
    <div
      className={`fixed ${topOffset} right-4 z-50 p-4 rounded-lg shadow-lg flex items-center transition-all duration-300 ease-in-out transform ${bgColor} ${textColor} ${transitionClasses} bg-opacity-90`}
      role={role}
      aria-live="polite"
    >
      {icon}
      <span className="font-medium mr-4">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto p-1 rounded-full hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition duration-150 ease-in-out"
        aria-label="Close message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default WarningError;
