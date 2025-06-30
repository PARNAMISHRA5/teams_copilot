import React, { useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, Check, MoreHorizontal, FileText, X, ZoomIn } from 'lucide-react';
import defaultBotLogo from '../assets/dn logo.png';

const ChatMessage = ({ 
  message, 
  isGenerating = false, 
  customBotLogo = defaultBotLogo,
  onReferencesClick,
  isReferencesOpen = false 
}) => {
  const [copyStatus, setCopyStatus] = useState('idle');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const isUser = message.role === 'user';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopyStatus('copied');
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopyStatus('copied');
        setTimeout(() => {
          setCopyStatus('idle');
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleImageClick = (imageSrc, imageAlt) => {
    setSelectedImage({ src: imageSrc, alt: imageAlt });
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  // Handle references click
  const handleReferencesClick = () => {
    if (onReferencesClick && message.references) {
      onReferencesClick(message.id, message.references);
    }
  };

  const formatContent = (content) => {
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Handle code blocks ```
      if (line.startsWith('```')) {
        return null; // Handle code blocks separately if needed
      }
      
      // Handle image references like aidn_000, aidn_001, etc.
      const imageRegex = /aidn_(\d+)/g;
      let formattedLine = line;
      const imageMatches = line.match(imageRegex);
      
      if (imageMatches) {
        imageMatches.forEach((match) => {
          const imageIndex = match.split('_')[1];
          // Corrected path - React serves public folder from root
          const imageSrc = `/api/images/${match}.jpeg`;
          const imageElement = `<span class="inline-image-container">
            <img 
              src="${imageSrc}" 
              alt="Reference ${match}" 
              class="inline-image cursor-pointer hover:opacity-80 transition-opacity"
              data-image-src="${imageSrc}"
              data-image-alt="Reference ${match}"
              style="max-width: 200px; max-height: 150px; margin: 4px 0; border-radius: 4px; border: 1px solid #e5e7eb;"
              onerror="this.style.display='none'; console.error('Failed to load image:', '${imageSrc}');"
            />
            <span class="image-reference-label text-xs text-blue-600 ml-1">[${match}]</span>
          </span>`;
          formattedLine = formattedLine.replace(match, imageElement);
        });
      }
      
      // Handle bold text (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const boldMatches = line.match(boldRegex);
      
      if (boldMatches) {
        boldMatches.forEach((match) => {
          const boldText = match.replace(/\*\*/g, '');
          formattedLine = formattedLine.replace(match, `<strong>${boldText}</strong>`);
        });
      }
      
      // Handle italic text (*text*)
      const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
      const italicMatches = formattedLine.match(italicRegex);
      
      if (italicMatches) {
        italicMatches.forEach((match) => {
          if (!match.includes('</strong>') && !match.includes('<strong>')) {
            const italicText = match.replace(/\*/g, '');
            formattedLine = formattedLine.replace(match, `<em>${italicText}</em>`);
          }
        });
      }
      
      // Handle inline code `code`
      const codeRegex = /`([^`]+)`/g;
      formattedLine = formattedLine.replace(codeRegex, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
      
      return (
        <span key={index}>
          <span 
            dangerouslySetInnerHTML={{ __html: formattedLine }} 
            onClick={(e) => {
              if (e.target.classList.contains('inline-image')) {
                handleImageClick(e.target.dataset.imageSrc, e.target.dataset.imageAlt);
              }
            }}
          />
          {index < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  if (isUser) {
    return (
      <div className="mb-4 px-3">
        <div className="flex justify-end">
          <div className="max-w-[75%]">
            <div className="bg-blue-600 text-white px-3 py-2 rounded-lg rounded-tr-sm">
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 px-3">
        <div className="flex items-start gap-2">
          {/* Bot Avatar */}
          <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center mt-0.5">
            <img 
              src={customBotLogo} 
              alt="Bot" 
              className="w-4 h-4 object-contain"
              onError={(e) => {
                console.error('Failed to load bot logo:', customBotLogo);
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Bot Message */}
          <div className="flex-1 max-w-[80%]">
            <div className="bg-gray-50 border border-gray-200 rounded-lg rounded-tl-sm p-3">
              {isGenerating ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-400">Generating...</span>
                </div>
              ) : (
                <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words">
              {message.content === "__version_selection__" ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-1">
                    Please Select Version:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "v4.2",
                      "v4.1_Maintenance",
                      "v4.1",
                      "v4.0",
                      "v4.0_Maintenance",
                      "v3.4",
                      "v3.4_Maintenance",
                    ].map((ver) => (
                      <button
                        key={ver}
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent("version-selected", { detail: ver })
                          )
                        }
                        className="px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 text-blue-800"
                      >
                        {ver}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                formatContent(message.content)
              )}
            </div>
                
              )}
            </div>

            {/* Bot message actions */}
            {!isGenerating && (
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={copyToClipboard}
                  className={`
                    p-1.5 rounded-md transition-all duration-200
                    ${copyStatus === 'copied' 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }
                  `}
                  title={copyStatus === 'copied' ? 'Copied!' : 'Copy'}
                >
                  {copyStatus === 'copied' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                
                <button
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                  title="Like"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                
                <button
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                  title="Dislike"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>

                {/* References Button - Only show if message has references */}
                {message.references && message.references.length > 0 && (
                  <button
                    onClick={handleReferencesClick}
                    className={`
                      p-1.5 rounded-md transition-all duration-200
                      ${isReferencesOpen 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }
                    `}
                    title={isReferencesOpen ? 'Hide References' : 'Show References'}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                )}
                
                <button
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                  title="More"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeImageModal}>
          <div className="relative max-w-4xl max-h-4xl p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
              {selectedImage.alt}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatMessage;