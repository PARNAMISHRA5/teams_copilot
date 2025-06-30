import React from 'react';
import { X, ExternalLink, FileText, Book, Shield, Settings } from 'lucide-react';

const ReferencesPanel = ({ isOpen, references = [], onClose }) => {
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


  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">References</h3>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
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
                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => {
                  // TODO: Handle reference click - open in new tab or show details
                  console.log('Reference clicked:', reference);
                }}
              >
                {/* Reference Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {getTypeIcon(reference.type)}
                    <span className="text-sm font-medium text-gray-800 line-clamp-2">
                      {reference.title}
                    </span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 ml-2" />
                </div>

                {/* Source */}
                <div className="text-xs text-gray-600 mb-2">
                  {reference.source}
                </div>

                {/* Excerpt */}
                <div className="text-xs text-gray-700 mb-3 line-clamp-3">
                  {reference.excerpt}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  
                  {/* URL Preview */}
                  {reference.url && (
                    <span className="text-xs text-gray-500 truncate ml-2">
                      {reference.url.length > 25 
                        ? `...${reference.url.slice(-22)}` 
                        : reference.url
                      }
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <div className="text-xs text-gray-500 text-center">
          {/* TODO: Replace with actual RAG pipeline info */}
          References from documentation search
        </div>
      </div>
    </div>
  );
};

export default ReferencesPanel;