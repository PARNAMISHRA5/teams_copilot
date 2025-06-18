import React, { useState } from 'react';
import { User, Bot, Copy, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
  isGenerating?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isGenerating }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const isUser = message.role === 'user';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopyStatus('copied');
      // Reset the copy status after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
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

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatContent = (content: string) => {
    // Split content by lines and process each line
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
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
      const italicRegex = /\*(.*?)\*/g;
      const italicMatches = formattedLine.match(italicRegex);
      
      if (italicMatches) {
        italicMatches.forEach((match) => {
          // Skip if it's part of a bold (already processed)
          if (!match.includes('</strong>') && !match.includes('<strong>')) {
            const italicText = match.replace(/\*/g, '');
            formattedLine = formattedLine.replace(match, `<em>${italicText}</em>`);
          }
        });
      }
      
      return (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          {index < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        }
      `}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`
          inline-block px-4 py-3 rounded-2xl
          ${isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-white border border-gray-200 text-gray-800'
          }
        `}>
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-500">Generating response...</span>
            </div>
          ) : (
            <div className="text-sm leading-relaxed">
              {formatContent(message.content)}
            </div>
          )}
        </div>

        {/* Message Actions */}
        {!isGenerating && (
          <div className={`
            flex items-center gap-2 mt-2 text-xs text-gray-500
            ${isUser ? 'justify-end' : 'justify-start'}
          `}>
            <span>{formatTime(message.timestamp)}</span>
            
            {!isUser && (
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={copyToClipboard}
                  className={`
                    p-1 hover:bg-gray-100 rounded transition-all duration-200 relative
                    ${copyStatus === 'copied' ? 'bg-green-100 text-green-600' : ''}
                  `}
                  title={copyStatus === 'copied' ? 'Copied!' : 'Copy message'}
                >
                  {copyStatus === 'copied' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
                <button
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Like message"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Dislike message"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;