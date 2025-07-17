import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // Import createPortal
import { Copy, ThumbsUp, ThumbsDown, Check, FileText, X, ZoomIn, ZoomOut, Download, Trash2 } from 'lucide-react'; // Added Trash2
import defaultBotLogo from '../assets/DBD_BIG.png'; // Using dn logo.png
import FeedbackPopover from './FeedbackPopover'; // From chatmessage.js
import { ERROR_MESSAGES } from './ErrorMessages';
import { getNewToken } from '../utils/authUtils';
import WarningError from './WarningError'; // Import the WarningError component

const FEEDBACK_URL = process.env.REACT_APP_API_URL;
const DB_API_BASE = process.env.REACT_APP_API_URL;
const ENV_PROJECT = process.env.REACT_APP_SELECTED_PROJECT;


const ChatMessage = ({
  message,
  isGenerating = false,
  traceId,
  selectedProjectVersion,
  customBotLogo = defaultBotLogo,
  onReferencesClick,
  isReferencesOpen = false,
  token,
  onDeleteMessage, // Added onDeleteMessage prop
  setToken
}) => {
  const [copyStatus, setCopyStatus] = useState('idle');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTeamsContext, setIsTeamsContext] = useState(false);
  const [imageZoom, setImageZoom] = useState(0.8); // Changed initial zoom to 0.8 for better fit

  // New state for image panning
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [startPanX, setStartPanX] = useState(0);
  const [startPanY, setStartPanY] = useState(0);

  const isUser = message.role === 'user';

  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);

  // Function to show the alert message
  const showAlert = (message, type = 'success', duration = 3000) => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);

    // Hide the alert after a specified duration
    setTimeout(() => {
      setAlertVisible(false);
    }, duration);
  };


  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackAnchor, setFeedbackAnchor] = useState(null);


  // Function to handle feedback submission (for both like and dislike)
  const handleFeedbackSubmit = async (comment, score) => {
    try {
      const messageTraceId = traceId || message?.trace_id || '';
      const selectedProjectVersion = message?.model;

      // Validate that we have a trace_id
      if (!messageTraceId) {
        console.warn(" No trace_id found in message. Feedback may not be properly linked.");
      }
      const url = `${FEEDBACK_URL}/feedback/${ENV_PROJECT}/${selectedProjectVersion}`;
      console.log(url);

      const payload = {
        trace_id: messageTraceId,
        score: score,
        comment: comment || (score === 1 ? 'Liked' : 'Disliked') // Default comment if empty
      };

      // console.log("🚀 Feedback Payload to Backend:", payload);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok){
        // Handling 401 Error
        if (response.status === 401) {
          console.log("INFO: 401 Unauthorized error detected. Attempting to get new token.");
          try {
            const newToken = await getNewToken();
            setToken(newToken);
            window.location.reload(); // Refresh the entire page to apply new token and re-fetch data
            return;
          } catch (tokenError) {
            console.error("ERROR: Failed to get new token:", tokenError);
            showAlert("Authentication expired. Please log in again.", 'error');
            return;
          }
        }

        // For other non-OK responses (e.g., 400, 403, 404, 500)
        const errorMessage = ERROR_MESSAGES[response.status] || ERROR_MESSAGES.DEFAULT;
        showAlert(errorMessage, 'error'); // Pass the fetched error message

        throw new Error('Failed to send feedback');
      }

      // console.log('✅ Feedback sent:', payload);
      showAlert('Feedback submitted successfully!', 'success'); // Show success alert
    } catch (error) {
      console.error('❌ Feedback error:', error);
      if (!error.message.includes("Failed to get new token") && !error.message.includes("Authentication expired")) {
          showAlert(ERROR_MESSAGES.DEFAULT, 'error');
      }
    }
  };

  // Function to handle message deletion
  const handleDeleteMessage = async () => {
    // Corrected: Ensure conversation_id and message.id are present
    if (!message || message.conversation_id === undefined || message.id === undefined) {
      console.error('Missing conversation_id or message_id for deletion. Message:', message);
      return;
    }

    // Corrected: Extract the numeric message_id from the potentially suffixed id
    const messageIdToDelete = message.id.includes('-ai') ? message.id.split('-ai')[0] : message.id;

    try {
      const PROJECT_ID = ENV_PROJECT; // Using ENV_PROJECT as project_id

      const url = `${DB_API_BASE}/chat-history/messages?project_id=${PROJECT_ID}`;
      const payload = {
        conversation_id: parseInt(message.conversation_id, 10), // Ensure it's an integer
        message_id: parseInt(messageIdToDelete, 10) // Ensure it's an integer
      };

      // console.log("🚀 Deleting message with payload:", payload);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handling 401 Error
        if (response.status === 401) {
          console.log("INFO: 401 Unauthorized error detected. Attempting to get new token.");
          try {
            const newToken = await getNewToken();
            setToken(newToken);
            window.location.reload(); // Refresh the entire page to apply new token and re-fetch data
            return;
          } catch (tokenError) {
            console.error("ERROR: Failed to get new token:", tokenError);
            // Optionally, show a specific error message if token refresh fails
            showAlert("Authentication expired. Please log in again.", 'error');
            return;
          }
        }

        // For other non-OK responses (e.g., 400, 403, 404, 500)
        const errorMessage = ERROR_MESSAGES[response.status] || ERROR_MESSAGES.DEFAULT;
        showAlert(errorMessage, 'error'); // Pass the fetched error message

        throw new Error(`Failed to delete message: ${errorData.message || response.statusText}`);
      }

      // console.log('✅ Message deleted successfully:', payload);
      // Call the parent's function to remove the message from the UI
      if (onDeleteMessage) {
        // Pass the original message.id (which might be X-ai) and conversation_id
        onDeleteMessage(message.id, message.conversation_id);
      }
    } catch (error) {
      console.error('❌ Delete message error:', error);
      if (!error.message.includes("Failed to get new token") && !error.message.includes("Authentication expired")) {
          showAlert(ERROR_MESSAGES.DEFAULT, 'error');
      }
      // Optionally, show a user-friendly error message in the UI
    }
  };


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
        window.frameElement ||
        document.domain !== window.location.hostname
      );
      setIsTeamsContext(isInTeams);
      if (isInTeams) {
        document.body.classList.add('teams-context');
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
      }
    };
    detectTeamsContext();
    if (window.microsoftTeams) {
      try {
        window.microsoftTeams.initialize();
      } catch (error) {
        console.warn('Teams SDK initialization failed:', error);
      }
    }
  }, []);

  const copyToClipboard = async () => {
  try {
    setCopyStatus('copying');
    let textContent = message.content;

    // Check if the content contains HTML
    if (textContent.includes('<table') || textContent.includes('<img')) {
      // If it's HTML content, extract the plain text and images
      const plainText = extractPlainText(textContent);
      const imageRefs = extractImageReferences(textContent);

      if (isTeamsContext) {
        // For Teams context, copy plain text
        await copyForTeams(plainText);
      } else {
        // For non-Teams context, try to copy rich content
        try {
          const htmlContent = generateRichTextForCopy(textContent);
          const clipboardItems = [
            new ClipboardItem({
              'text/plain': new Blob([plainText], { type: 'text/plain' }),
              'text/html': new Blob([htmlContent], { type: 'text/html' })
            })
          ];

          // Add images to clipboard if available
          for (const imgRef of imageRefs) {
            try {
              const imageBlob = await fetchImageAsBlob(imgRef.url);
              if (imageBlob) {
                clipboardItems.push(
                  new ClipboardItem({ [imageBlob.type]: imageBlob })
                );
              }
            } catch (imgError) {
              console.warn('Could not add image to clipboard:', imgRef.url, imgError);
            }
          }

          await navigator.clipboard.write(clipboardItems);
        } catch (error) {
          // Fallback to plain text if rich content copy fails
          await navigator.clipboard.writeText(plainText);
        }
      }
    } else {
      // If it's plain text, copy as is
      if (isTeamsContext) {
        await copyForTeams(textContent);
      } else {
        await navigator.clipboard.writeText(textContent);
      }
    }

    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 3000);
  } catch (err) {
    console.error('Copy failed:', err);
    setCopyStatus('error');
    setTimeout(() => setCopyStatus('idle'), 3000);
  }
};

// Helper function to extract plain text from HTML content
const extractPlainText = (htmlContent) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  return doc.body.textContent || '';
};
const generateRichTextForCopy = (content) => {
  // Remove script and style tags
  content = content.replace(/<script.*?>.*?<\/script>/gi, '');
  content = content.replace(/<style.*?>.*?<\/style>/gi, '');

  // Make tables visible in the copied content
  content = content.replace(/<table>/gi, '<table border="1" style="border-collapse: collapse;">');
  content = content.replace(/<td>/gi, '<td style="padding: 4px; border: 1px solid #ddd;">');
  content = content.replace(/<th>/gi, '<th style="padding: 4px; border: 1px solid #ddd; background-color: #f0f0f0;">');

  // Make images visible in the copied content
  const imageRegex = /aidn(\d+)/g;
  let formattedContent = content.replace(imageRegex, (match) => {
    const imageSrc = `/api/images/${match}.jpeg`;
    return `<img src="${imageSrc}" alt="Reference ${match}" style="max-width: 300px; max-height: 200px; margin: 4px 0; border-radius: 6px; border: 1px solid #e5e7eb; display: block;">`;
  });

  return formattedContent;
};

  const cleanHtmlContent = (rawHtml) => {
    if (!rawHtml) return '';

    // Remove outer <html>, <body>, whitespace and add responsive table styling
    let cleaned = rawHtml
      .replace(/<\/?(html|body)>/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Add responsive styling to tables with proper overflow handling
    cleaned = cleaned
      .replace(/<table[^>]*>/gi, (match) => {
        return `<div class="table-wrapper" style="width: 100%; overflow-x: auto; margin: 12px 0; border-radius: 8px; border: 1px solid #e5e7eb; background: white;">
          <table style="
            border-collapse: collapse; 
            width: 100%; 
            min-width: 300px; 
            font-size: 14px; 
            background: white;
            margin: 0;
          ">`;
      })
      .replace(/<\/table>/gi, '</table></div>')
      .replace(/<th[^>]*>/gi, (match) => {
        return `<th style="
          border: 1px solid #d1d5db; 
          padding: 8px 12px; 
          background-color: #f8fafc; 
          font-weight: 600; 
          font-size: 13px; 
          text-align: left;
          color: #374151;
          white-space: nowrap;
          min-width: 80px;
        ">`;
      })
      .replace(/<td[^>]*>/gi, (match) => {
        return `<td style="
          border: 1px solid #d1d5db; 
          padding: 8px 12px; 
          font-size: 13px; 
          word-wrap: break-word;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #374151;
          line-height: 1.4;
        ">`;
      })
      .replace(/<tr[^>]*>/gi, '<tr style="background-color: transparent;">');

    return cleaned;
  };


  const copyForTeams = async (textContent) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textContent);
      } else {
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
        if (!success) throw new Error('Copy command failed');
      }
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Teams copy failed:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const extractImageReferences = (content) => {
    const imageRegex = /aidn_(\d+)/g;
    const matches = content.match(imageRegex) || [];
    return [...new Set(matches)].map(match => ({
      ref: match,
      url: `/api/images/${match}.jpeg`,
      alt: `Reference ${match}`
    }));
  };

  const generateRichHtmlContent = async (content, imageRefs) => {
    let htmlContent = content.replace(/\n/g, '<br>');
    for (const imgRef of imageRefs) {
      try {
        const response = await fetch(imgRef.url);
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          const imageHtml = `<img src="${base64}" alt="${imgRef.alt}" style="max-width: 300px; max-height: 200px; margin: 4px 0; border-radius: 6px; border: 1px solid #e5e7eb; display: block;">`;
          htmlContent = htmlContent.replace(new RegExp(imgRef.ref, 'g'), imageHtml);
        }
      } catch (error) {
        console.warn('Failed to embed image:', imgRef.url, error);
      }
    }
    return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">${htmlContent}</div>`;
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const fetchImageAsBlob = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl, { cache: 'force-cache', mode: 'cors' });
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
      setSelectedImage({ src: imageSrc, alt: imageAlt });
      setImageZoom(0.8); // Reset zoom to 0.8 for a good initial fit
      setPanX(0); // Reset pan on new image
      setPanY(0); // Reset pan on new image
      setImageModalOpen(true);
    };
    img.src = imageSrc;
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
    setImageZoom(0.8); // Reset zoom to 0.8 when modal is closed
    setPanX(0); // Reset pan on close
    setPanY(0); // Reset pan on close
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setImageZoom(prev => Math.min(prev * 1.2, 3)); // Max zoom changed to 3
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setImageZoom(prev => {
      const newZoom = Math.max(prev / 1.2, 0.2);
      // If the new zoom level is at or below the initial fit, reset pan
      if (newZoom <= 0.8) {
        setPanX(0);
        setPanY(0);
      }
      return newZoom;
    });
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
    if (onReferencesClick) {
      onReferencesClick(message.id);
    }
  };

  // Pan event handlers
  const handleMouseDown = (e) => {
    if (imageZoom > 0.8) { // Only allow dragging if zoomed in
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setStartPanX(panX);
      setStartPanY(panY);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && imageZoom > 0.8) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      setPanX(startPanX + dx);
      setPanY(startPanY + dy);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };


  const formatContent = (content) => {
    let processedContent = content;

    // 1. Handle ```html code blocks first
    if (processedContent.startsWith('```html')) {
      const startIndex = processedContent.indexOf('```html') + '```html'.length;
      const endIndex = processedContent.indexOf('```', startIndex);
      if (startIndex !== -1 && endIndex !== -1) {
        processedContent = processedContent.substring(startIndex, endIndex).trim();
      } else {
        processedContent = ''; // Malformed HTML block
      }
      // If it was an HTML code block, we assume it's already structured HTML.
      // We will proceed to image processing for raw HTML.
    } else {
      // 2. Apply markdown and aidn_ processing if it's not a ```html block
      const imageRegex = /aidn_(\d+)/g;
      processedContent = processedContent.replace(imageRegex, (match) => {
        const imageSrc = `/api/images/${match}.jpeg`;
        // Increased image size for both Teams and non-Teams contexts
        const imageSize = isTeamsContext ? 'max-width: 350px; max-height: 250px;' : 'max-width: 450px; max-height: 300px;';
        // This creates the span with img, and the img already has inline-image and data attributes
        return `<span class="inline-image-container" style="display: block; margin: 8px auto; vertical-align: top;">
          <img
            src="${imageSrc}"
            alt="Reference ${match}"
            class="inline-image cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105"
            data-image-src="${imageSrc}"
            data-image-alt="Reference ${match}"
            style="${imageSize} border-radius: 8px; border: 2px solid #e5e7eb; margin: 4px; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 100%; height: auto;"
            onerror="this.style.display='none'; console.error('Failed to load image:', '${imageSrc}');"
          />
          <span class="image-reference-label text-xs text-blue-600 font-medium block">[${match}]</span>
        </span>`;
      });

      processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
      processedContent = processedContent.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em style="font-style: italic;">$1</em>');
      processedContent = processedContent.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono border" style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.875rem; border: 1px solid #e5e7eb;">$1</code>');

      // Replace newlines with <br> for plain text rendering
      processedContent = processedContent.replace(/\n/g, '<br>');
    }

    // 3. Now, handle any raw <img> tags that might be in the processedContent
    //    This applies to both original HTML blocks and content after markdown/aidn_ processing.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedContent; // Put the current HTML string into a temporary DOM element

    const images = tempDiv.querySelectorAll('img');
    images.forEach(img => {
      // Ensure all <img> tags have the necessary classes and data attributes for click handling
      // Only add if not already present (e.g., from aidn_ processing)
      if (!img.classList.contains('inline-image')) {
        img.classList.add('inline-image', 'cursor-pointer', 'hover:opacity-80', 'transition-all', 'duration-200', 'hover:scale-105');
      }
      if (!img.hasAttribute('data-image-src')) {
        img.setAttribute('data-image-src', img.src);
      }
      if (!img.hasAttribute('data-image-alt')) {
        img.setAttribute('data-image-alt', img.alt || 'Image');
      }
      // Apply consistent styling for responsiveness and appearance if not already present
      // These styles are applied directly to the img tag to ensure they override browser defaults
      // and provide consistent sizing for images within the chat bubble.
      // Updated max-width and max-height for raw <img> tags as well
      if (!img.style.maxWidth) img.style.maxWidth = isTeamsContext ? '350px' : '450px';
      if (!img.style.maxHeight) img.style.maxHeight = isTeamsContext ? '250px' : '300px';
      if (!img.style.borderRadius) img.style.borderRadius = '8px';
      if (!img.style.border) img.style.border = '2px solid #e5e7eb';
      if (!img.style.margin) img.style.margin = '8px auto'; // Changed to auto for centering block images
      if (!img.style.display) img.style.display = 'block'; // Changed to block for consistent line breaks
      if (!img.style.boxShadow) img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      if (!img.style.width) img.style.width = 'auto'; // Ensure width adjusts to content
      if (!img.style.height) img.style.height = 'auto'; // Ensure height adjusts to content
      img.style.maxWidth = '100%'; // Ensure responsiveness
      img.style.height = 'auto'; // Maintain aspect ratio
      // Removed verticalAlign as it's not relevant for block elements
    });

    // Return the final HTML string
    return tempDiv.innerHTML;
  };

  const getResponsiveClasses = () => {
    return isTeamsContext
      ? 'max-w-[95%] sm:max-w-[88%] md:max-w-[85%] lg:max-w-[80%]'
      : 'max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%]';
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
              <div className="text-sm">
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
        <div className={`flex items-start gap-2 sm:gap-3 ${isGenerating ? 'pt-1' : ''}`}>
          <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center mt-0.5">
            <img src={customBotLogo} alt="Bot" className="w-5 h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>

          <div className={`flex-1 ${getResponsiveClasses()}`}>
            {isGenerating ? (
              <div className="flex items-center gap-2 min-h-[24px] mt-1 ml-1 text-gray-500">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">Generating...</span>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg rounded-tl-sm p-3 shadow-sm overflow-hidden">
                <div className="text-sm text-gray-800 text-sm-leading-relaxed break-words">
                  {/* Use formatContent for all content processing, then dangerouslySetInnerHTML */}
                  {message.content.includes('<table') ? (
                    <div dangerouslySetInnerHTML={{ __html: cleanHtmlContent(message.content) }} />
                  ) : (
                    <div onClick={(e) => {
                      // This click handler will now work for all images processed by formatContent
                      if (e.target.classList.contains('inline-image')) {
                        handleImageClick(e.target.dataset.imageSrc, e.target.dataset.imageAlt);
                      }
                    }} dangerouslySetInnerHTML={{ __html: formatContent(message.content) }} />
                  )}
                </div>
              </div>
            )}

            {!isGenerating && (
              <div className={`flex items-center gap-1 mt-2 ${isTeamsContext ? 'flex-wrap' : ''}`}>
                <button onClick={copyToClipboard} disabled={copyStatus === 'copying'} className={`p-1.5 rounded-md transition-all duration-200 text-xs font-medium
                  ${copyStatus === 'copied' ? 'bg-green-100 text-green-700 border border-green-200'
                    : copyStatus === 'error' ? 'bg-red-100 text-red-700 border border-red-200'
                      : copyStatus === 'copying' ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-transparent'}
                `}>
                  {copyStatus === 'copied' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  data-score="1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeedbackAnchor(e.currentTarget);
                    setIsFeedbackOpen(true);
                    // handleFeedbackSubmit('', 1); // Like = +1
                  }}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-200"
                  title="Like"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>

                <button
                  data-score="-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeedbackAnchor(e.currentTarget);
                    setIsFeedbackOpen(true);
                    // For 'Dislike', popover opens, and feedback is submitted via popover's onSubmit
                  }}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200"
                  title="Dislike"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={handleDeleteMessage}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-100 transition-all duration-200 border border-transparent hover:border-red-200"
                  title="Delete Message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>


                <button
                  onClick={handleReferencesClick}
                  data-references-button="true"
                  className={`p-1.5 rounded-md transition-all duration-200 flex items-center gap-1
                    ${isReferencesOpen ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'}
                  `}
                  title={isReferencesOpen ? 'Hide References' : 'View References'}>
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WarningError component for displaying pop-up messages */}
      <WarningError
        message={alertMessage}
        type={alertType}
        isVisible={alertVisible}
        onClose={() => setAlertVisible(false)}
      />

      {imageModalOpen && selectedImage && createPortal(
        // Outermost div for the full-screen blur effect and buttons
        <div
          className="fixed inset-0 bg-white bg-opacity-10 flex items-center justify-center z-50" // Full screen, semi-transparent black, centered content
          onClick={closeImageModal}
          style={{ zIndex: isTeamsContext ? 99999 : 1000, backdropFilter: 'blur(8px)' }} // Blur applied here
        >
          {/* Buttons moved here */}
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <button onClick={handleZoomOut} className="bg-gray-800 bg-opacity-70 text-white rounded-full p-2 hover:bg-opacity-90 transition-all duration-200" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleZoomIn} className="bg-gray-800 bg-opacity-70 text-white rounded-full p-2 hover:bg-opacity-90 transition-all duration-200" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={handleDownloadImage} className="bg-gray-800 bg-opacity-70 text-white rounded-full p-2 hover:bg-opacity-90 transition-all duration-200" title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={closeImageModal} className="bg-gray-800 bg-opacity-70 text-white rounded-full p-2 hover:bg-opacity-90 transition-all duration-200" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* This is the actual modal container, which will be white and centered */}
          <div
            className="relative flex flex-col items-center justify-center rounded-lg p-4"
            style={{ maxWidth: '98vw', maxHeight: '98vh', margin: 'auto' }} // Constrain size and center within the blur overlay
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-full mx-auto object-contain"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `scale(${imageZoom}) translate(${panX}px, ${panY}px)`,
                transition: 'transform 0.2s ease-in-out',
                cursor: imageZoom > 0.8 ? (isDragging ? 'grabbing' : 'grab') : 'default', // Change cursor based on zoom and drag state
              }}
            />
          </div>
        </div>,
        document.body // Render the modal directly into the document body
      )}
      <FeedbackPopover
        isOpen={isFeedbackOpen}
        anchorRef={{ current: feedbackAnchor }}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={(comment) => {
          const score = feedbackAnchor?.dataset?.score; 
          handleFeedbackSubmit(comment, score || -1); // Default to -1 if no score is stored
        }}
      />
    </>
  );
};

export default ChatMessage;
