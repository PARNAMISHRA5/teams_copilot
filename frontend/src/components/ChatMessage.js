import React, { useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, Check, MoreHorizontal } from 'lucide-react';
import defaultBotLogo from '../assets/dn logo.png';

const ChatMessage = ({ message, isGenerating = false, customBotLogo = defaultBotLogo }) => {
  const [copyStatus, setCopyStatus] = useState('idle');
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

  const formatContent = (content) => {
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Handle code blocks ```
      if (line.startsWith('```')) {
        return null; // Handle code blocks separately if needed
      }
      
      // Handle bold text (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      let formattedLine = line;
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
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
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
                {formatContent(message.content)}
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
  );
};

export default ChatMessage;