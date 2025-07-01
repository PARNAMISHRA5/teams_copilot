import React, { useState, useEffect } from 'react';
import { Copy, ThumbsUp, ThumbsDown, Check, FileText, X, ZoomIn, ZoomOut, Download } from 'lucide-react';
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
  const [isTeamsContext, setIsTeamsContext] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const isUser = message.role === 'user';

  // Enhanced Teams detection
  useEffect(() => {
    const detectTeamsContext = () => {
      const isInTeams = !!(
        window.parent !== window || 
        window.opener ||
        document.referrer.includes('teams.microsoft.com') ||
        window.location.href.includes('teams.microsoft.com') ||
        navigator.userAgent.includes('Teams') ||
        window.microsoftTeams ||
        window.location.hostname === 'localhost' && window.parent !== window ||
        // Additional Teams detection methods
        window.frameElement ||
        document.domain !== window.location.hostname
      );
      
      setIsTeamsContext(isInTeams);
      
      // Force Teams-specific styling and behavior
      if (isInTeams) {
        document.body.classList.add('teams-context');
        
        // Disable certain browser features that don't work in Teams
        setTimeout(() => {
          const event = new Event('resize');
          window.dispatchEvent(event);
        }, 100);
      }
    };

    detectTeamsContext();
    
    // Listen for Teams SDK
    if (window.microsoftTeams) {
      try {
        window.microsoftTeams.initialize();
      } catch (error) {
        console.warn('Teams SDK initialization failed:', error);
      }
    }
  }, []);

  // Enhanced copy function with proper image handling
  const copyToClipboard = async () => {
    try {
      setCopyStatus('copying');
      
      // Extract text content
      let textContent = message.content;
      
      // For Teams context, use simpler copy method
      if (isTeamsContext) {
        await copyForTeams(textContent);
        return;
      }

      // Modern browser copy with images
      if (navigator.clipboard && navigator.clipboard.write) {
        const clipboardItems = [];
        
        // Process images from content
        const imageRefs = extractImageReferences(textContent);
        
        if (imageRefs.length > 0) {
          try {
            // Create HTML content with embedded images
            const htmlContent = await generateRichHtmlContent(textContent, imageRefs);
            
            clipboardItems.push(
              new ClipboardItem({
                'text/plain': new Blob([textContent], { type: 'text/plain' }),
                'text/html': new Blob([htmlContent], { type: 'text/html' })
              })
            );

            // Try to add actual image blobs
            for (const imgRef of imageRefs) {
              try {
                const imageBlob = await fetchImageAsBlob(imgRef.url);
                if (imageBlob) {
                  clipboardItems.push(
                    new ClipboardItem({
                      [imageBlob.type]: imageBlob
                    })
                  );
                }
              } catch (imgError) {
                console.warn('Could not add image to clipboard:', imgRef.url, imgError);
              }
            }
          } catch (error) {
            console.warn('Rich content creation failed, falling back to text:', error);
            clipboardItems.push(
              new ClipboardItem({
                'text/plain': new Blob([textContent], { type: 'text/plain' })
              })
            );
          }
        } else {
          // Text only
          clipboardItems.push(
            new ClipboardItem({
              'text/plain': new Blob([textContent], { type: 'text/plain' })
            })
          );
        }

        await navigator.clipboard.write(clipboardItems);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 3000);
        
      } else {
        // Fallback for older browsers
        await navigator.clipboard.writeText(textContent);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
      }
      
    } catch (err) {
      console.error('Copy failed:', err);
      
      // Ultimate fallback
      try {
        const textArea = document.createElement('textarea');
        textArea.value = message.content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (success) {
          setCopyStatus('copied');
          setTimeout(() => setCopyStatus('idle'), 2000);
        } else {
          throw new Error('execCommand failed');
        }
      } catch (fallbackErr) {
        console.error('All copy methods failed:', fallbackErr);
        setCopyStatus('error');
        setTimeout(() => setCopyStatus('idle'), 3000);
      }
    }
  };

  // Teams-specific copy function
  const copyForTeams = async (textContent) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textContent);
      } else {
        // Fallback for Teams iframe restrictions
        const textArea = document.createElement('textarea');
        textArea.value = textContent;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!success) {
          throw new Error('Copy command failed');
        }
      }
      
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Teams copy failed:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  // Extract image references from content
  const extractImageReferences = (content) => {
    const imageRegex = /aidn_(\d+)/g;
    const matches = content.match(imageRegex) || [];
    return [...new Set(matches)].map(match => ({
      ref: match,
      url: `/api/images/${match}.jpeg`,
      alt: `Reference ${match}`
    }));
  };

  // Generate rich HTML content with embedded images
  const generateRichHtmlContent = async (content, imageRefs) => {
    let htmlContent = content.replace(/\n/g, '<br>');
    
    // Replace image references with HTML img tags
    for (const imgRef of imageRefs) {
      try {
        // Convert image to base64 for embedding
        const response = await fetch(imgRef.url);
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          const imageHtml = `<img src="${base64}" alt="${imgRef.alt}" style="max-width: 300px; max-height: 200px; margin: 8px 0; border-radius: 6px; border: 1px solid #e5e7eb; display: block;">`;
          htmlContent = htmlContent.replace(new RegExp(imgRef.ref, 'g'), imageHtml);
        }
      } catch (error) {
        console.warn('Failed to embed image:', imgRef.url, error);
        // Keep the original reference if embedding fails
      }
    }
    
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
        ${htmlContent}
      </div>
    `;
  };

  // Convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Fetch image as blob for clipboard
  const fetchImageAsBlob = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl, {
        cache: 'force-cache',
        mode: 'cors'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.blob();
    } catch (error) {
      console.error('Failed to fetch image:', error);
      return null;
    }
  };

  const handleImageClick = (imageSrc, imageAlt) => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setSelectedImage({ src: imageSrc, alt: imageAlt });
      setImageZoom(1);
      setImageModalOpen(true);
    };
    img.src = imageSrc;
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
    setImageZoom(1);
    setImageDimensions({ width: 0, height: 0 });
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setImageZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation(); 
    setImageZoom(prev => Math.max(prev / 1.2, 0.2));
  };

  const handleDownloadImage = async (e) => {
    e.stopPropagation();
    if (!selectedImage) return;
    
    try {
      const response = await fetch(selectedImage.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedImage.alt.replace(/\s+/g, '_') + '.jpeg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleReferencesClick = () => {
    if (onReferencesClick && message.references) {
      onReferencesClick(message.id, message.references);
    }
  };

  const formatContent = (content) => {
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      if (line.startsWith('```')) {
        return null;
      }
      
      const imageRegex = /aidn_(\d+)/g;
      let formattedLine = line;
      const imageMatches = line.match(imageRegex);
      
      if (imageMatches) {
        imageMatches.forEach((match) => {
          const imageSrc = `/api/images/${match}.jpeg`;
          const imageSize = isTeamsContext ? 'max-width: 280px; max-height: 180px;' : 'max-width: 320px; max-height: 220px;';
          const imageElement = `<span class="inline-image-container" style="display: block; margin: 12px 0;">
            <img 
              src="${imageSrc}" 
              alt="Reference ${match}" 
              class="inline-image cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105"
              data-image-src="${imageSrc}"
              data-image-alt="Reference ${match}"
              style="${imageSize} border-radius: 8px; border: 2px solid #e5e7eb; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
              onerror="this.style.display='none'; console.error('Failed to load image:', '${imageSrc}');"
            />
            <span class="image-reference-label text-xs text-blue-600 font-medium mt-1 block">[${match}]</span>
          </span>`;
          formattedLine = formattedLine.replace(match, imageElement);
        });
      }
      
      // Enhanced text formatting
      const boldRegex = /\*\*(.*?)\*\*/g;
      formattedLine = formattedLine.replace(boldRegex, '<strong style="font-weight: 600;">$1</strong>');
      
      const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
      formattedLine = formattedLine.replace(italicRegex, '<em style="font-style: italic;">$1</em>');
      
      const codeRegex = /`([^`]+)`/g;
      formattedLine = formattedLine.replace(codeRegex, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono border" style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.875rem; border: 1px solid #e5e7eb;">$1</code>');
      
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

  // Enhanced responsive classes for both web and Teams
  const getResponsiveClasses = () => {
    if (isTeamsContext) {
      return 'max-w-[95%] sm:max-w-[88%] md:max-w-[85%] lg:max-w-[80%]';
    }
    return 'max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%]';
  };

  const getContainerPadding = () => {
    return isTeamsContext ? 'px-1 sm:px-2' : 'px-3 sm:px-4';
  };

  if (isUser) {
    return (
      <div className={`mb-4 ${getContainerPadding()}`}>
        <div className="flex justify-end">
          <div className={getResponsiveClasses()}>
            <div className="bg-blue-600 text-white px-3 py-2.5 rounded-lg rounded-tr-sm shadow-sm">
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
      <div className={`mb-4 ${getContainerPadding()}`}>
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Bot Avatar */}
          <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center mt-0.5">
            <img 
              src={customBotLogo} 
              alt="Bot" 
              className="w-5 h-5 object-contain"
              onError={(e) => {
                console.error('Failed to load bot logo:', customBotLogo);
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Bot Message */}
          <div className={`flex-1 ${getResponsiveClasses()}`}>
            <div className="bg-gray-50 border border-gray-200 rounded-lg rounded-tl-sm p-3 shadow-sm">
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
                  {formatContent(message.content)}
                </div>
              )}
            </div>

            {/* Bot message actions */}
            {!isGenerating && (
              <div className={`flex items-center gap-1 mt-2 ${isTeamsContext ? 'flex-wrap' : ''}`}>
                <button
                  onClick={copyToClipboard}
                  disabled={copyStatus === 'copying'}
                  className={`
                    p-1.5 rounded-md transition-all duration-200 text-xs font-medium
                    ${copyStatus === 'copied' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : copyStatus === 'error'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : copyStatus === 'copying'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                    }
                  `}
                  title={
                    copyStatus === 'copied' ? 'Copied with images!' : 
                    copyStatus === 'error' ? 'Copy failed - try again' : 
                    copyStatus === 'copying' ? 'Copying...' :
                    'Copy message and images'
                  }
                >
                  {copyStatus === 'copied' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                
                <button
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200"
                  title="Like"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                
                <button
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200"
                  title="Dislike"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>

                {/* References Button */}
                {message.references && message.references.length > 0 && (
                  <button
                    onClick={handleReferencesClick}
                    data-references-button="true"
                    className={`
                      p-1.5 rounded-md transition-all duration-200 flex items-center gap-1
                      ${isReferencesOpen 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                      }
                    `}
                    title={isReferencesOpen ? 'Hide References' : `Show ${message.references.length} References`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {(isTeamsContext || message.references.length > 1) && (
                      <span className="text-xs font-medium">{message.references.length}</span>
                    )}
                  </button>
                )}
                
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Image Modal with zoom controls */}
      {imageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" 
          onClick={closeImageModal}
          style={{ zIndex: isTeamsContext ? 99999 : 1000 }}
        >
          <div className="relative max-w-full max-h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Image controls */}
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              <button
                onClick={handleZoomOut}
                className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all duration-200"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomIn}
                className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all duration-200"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadImage}
                className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all duration-200"
                title="Download Image"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={closeImageModal}
                className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all duration-200"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Image container with scroll */}
            <div className="overflow-auto max-w-full max-h-full">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="block rounded-lg transition-transform duration-200"
                style={{
                  transform: `scale(${imageZoom})`,
                  transformOrigin: 'center center',
                  maxWidth: imageZoom <= 1 ? '90vw' : 'none',
                  maxHeight: imageZoom <= 1 ? '90vh' : 'none'
                }}
              />
            </div>
            
            {/* Image info */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
              <div className="font-medium">{selectedImage.alt}</div>
              {imageDimensions.width > 0 && (
                <div className="text-xs text-gray-300 mt-1">
                  {imageDimensions.width} × {imageDimensions.height} • Zoom: {Math.round(imageZoom * 100)}%
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatMessage;