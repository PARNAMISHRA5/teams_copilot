import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const FeedbackPopover = ({ isOpen, anchorRef, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState('');
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        !anchorRef?.current?.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose, anchorRef]);

  if (!isOpen || !anchorRef?.current) return null;

  const { top, left } = anchorRef.current.getBoundingClientRect();
  const popoverStyle = {
    position: 'absolute',
    top: top - 160,
    left: left - 150,
    zIndex: 9999,
  };

  const handleSubmit = () => {
    onSubmit(feedback);
    setFeedback('');
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="bg-white border border-gray-200 shadow-xl rounded-lg w-72 p-4"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-800">Provide Feedback</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <textarea
        className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
        rows={3}
        placeholder="What could be better?"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        // disabled={!feedback.trim()}
        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded disabled:opacity-50"
      >
        Submit
      </button>
    </div>
  );
};

export default FeedbackPopover;
