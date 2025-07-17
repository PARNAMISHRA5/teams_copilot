import React, { useState } from 'react';
import { X, ExternalLink, FileText, Book, Shield, Settings } from 'lucide-react';

const ReferencesPanel = ({ isOpen, references = [], onClose }) => {
  const [expandedRefs, setExpandedRefs] = useState({});

  if (!isOpen) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'documentation':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'guide':
        return <Book className="w-4 h-4 text-green-500" />;
      case 'security':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'reference':
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };


  const handleTouchStart = (e) => {
    // Prevent any touch interference
    e.stopPropagation();
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center break-words justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600 shrink-0" />
          <h2 className="text-lg font-bold text-gray-800 leading-tight flex items-center"
          style={{ margin: 'revert-layer' }}>References</h2>
          <span className="bg-gray-100 text-gray-600 text-xs rounded-full w-5 h-5 flex items-center justify-center leading-none shrink-0">
            {references.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Close References"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {references.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <h4 className="text-sm font-medium text-gray-600 mb-1">No References</h4>
            <p className="text-xs text-gray-500">
              References will appear here when available
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {references.map((reference, index) => (
              <div
                key={reference.id || index}
                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
  <div 
    className="flex items-center gap-2 flex-1 cursor-pointer p-2 -m-2 rounded hover:bg-blue-50 hover:shadow-sm active:bg-blue-100 touch-manipulation"
    onTouchStart={handleTouchStart}
    role="button"
    tabIndex={0}
  >
    {getTypeIcon(reference.type)}
    <a
      href={reference.url} // assuming you have a URL field
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium text-blue-600 break-all whitespace-normal line-clamp-2"
    >
      {reference.source}
    </a>
    <ExternalLink className="w-3 h-3 text-blue-400 shrink-0 ml-1" />
  </div>
</div>

{/* Title or Description */}
<div className="text-xs text-gray-600 mb-2 break-words">
  {reference.title}
</div>


                {/* Source */}
                <div className="text-xs text-gray-600 mb-2 break-words">
                  {reference.source}
                </div>

                {/* Excerpt */}
                <div
                  className={`text-xs text-gray-700 mb-2 break-words ${
                    expandedRefs[reference.id] ? '' : 'line-clamp-3'
                  }`}
                >
                  {reference.excerpt}
                </div>

                {/* Show More / Less */}
                {reference.excerpt && (
                  <div
                    className="text-xs text-blue-500 cursor-pointer p-1 -m-1 rounded hover:bg-blue-50 active:bg-blue-100 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedRefs((prev) => ({
                        ...prev,
                        [reference.id]: !prev[reference.id],
                      }));
                    }}
                    onTouchStart={handleTouchStart}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setExpandedRefs((prev) => ({
                          ...prev,
                          [reference.id]: !prev[reference.id],
                        }));
                      }
                    }}
                  >
                    {expandedRefs[reference.id] ? 'Show Less' : 'Show More'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <div className="text-xs text-gray-500 text-center">
          References from documentation search
        </div>
      </div>
    </div>
  );
};

export default ReferencesPanel;