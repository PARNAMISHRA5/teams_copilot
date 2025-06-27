import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Home, PanelRightOpen, PanelRightClose } from 'lucide-react';

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const ChatSidebar = ({
  chats = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isCollapsed,
  onToggleCollapse
}) => {
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowChatDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isCollapsed) {
      setShowChatDropdown(false);
    }
  }, [isCollapsed]);

  const formatDate = (dateObj) => {
    try {
      // Handle both Date objects and timestamp strings/numbers
      const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }

      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const goHome = () => {
    if (onSelectChat) {
      onSelectChat('');
    }
    setShowChatDropdown(false);
  };

  const handleNewChat = () => {
    goHome();
    if (onNewChat) {
      onNewChat();
    }
  };

  const generateChatTitle = (chat) => {
    try {
      if (!chat || !chat.messages || chat.messages.length === 0) {
        return 'New Chat';
      }

      const greetings = [
        'hi', 'hello', 'hey', 'hiya', 'sup', 'yo', 'hii', 'hiii', 'hiiii',
        'good morning', 'good afternoon', 'good evening', 'good night', 
        'morning', 'afternoon', 'evening', 'night',
        'whats up', "what's up", 'wassup', 'how are you', 'how you doing', 
        'howdy', 'greetings', 'salutations',
        'aloha', 'bonjour', 'hola', 'thanks', 'thank you', 'ty', 'thx', 
        'ok', 'okay', 'yes', 'no', 'yep', 'nope',
        'yeah', 'yup', 'cool', 'nice', 'great', 'awesome'
      ];

      const isGreetingMessage = (text) => {
        if (!text || typeof text !== 'string') return true;
        
        const clean = text.replace(/[.,!?;:]+$/, '').trim().toLowerCase();
        return (
          greetings.includes(clean) ||
          greetings.some(g => clean.startsWith(g + ' ') || clean === g) ||
          clean.length <= 3 ||
          /^[.,!?;:\s]+$/.test(clean)
        );
      };

      const cleanTitle = (text) => {
        if (!text || typeof text !== 'string') return '';
        let cleaned = text.replace(/\s+/g, ' ').trim().replace(/[*_`~]/g, '');
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        return cleaned.replace(/[.!?]+$/, '');
      };

      const firstMessage = chat.messages.find(msg =>
        msg &&
        msg.role === 'user' &&
        msg.content &&
        typeof msg.content === 'string' &&
        !isGreetingMessage(msg.content) &&
        msg.content.trim().length >= 4
      );

      if (!firstMessage) return 'New Chat';

      let title = cleanTitle(firstMessage.content);
      if (title.length > 40) {
        const cut = title.substring(0, 37);
        const lastSpace = cut.lastIndexOf(' ');
        title = (lastSpace > 15 ? cut.substring(0, lastSpace) : cut) + '...';
      }
      return title || 'New Chat';
    } catch (error) {
      console.error('Error generating chat title:', error);
      return 'New Chat';
    }
  };

  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      if (onDeleteChat) {
        onDeleteChat(chatId);
      }
    }
  };

  const handleChatSelect = (chatId) => {
    if (onSelectChat) {
      onSelectChat(chatId);
    }
    setShowChatDropdown(false);
  };

  // Ensure chats is always an array
  const validChats = Array.isArray(chats) ? chats : [];

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-12' : 'w-64'}`}>
      <div className="p-2.5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          {!isCollapsed && <h2 className="text-base font-semibold text-gray-800">Chats</h2>}
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center text-gray-700"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {isCollapsed && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowChatDropdown(!showChatDropdown)}
                className="w-full h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-all duration-200"
                title="Chat History"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {showChatDropdown && (
                <div className="absolute left-full top-0 ml-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Recent Chats</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {validChats.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No chats yet</p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {validChats.slice(0, 10).map(chat => {
                          if (!chat || !chat.id) return null;
                          
                          return (
                            <div
                              key={chat.id}
                              className={`group relative rounded-lg transition-all duration-200 mb-1 p-2 ${
                                currentChatId === chat.id
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'hover:bg-gray-50 border border-transparent cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div onClick={() => handleChatSelect(chat.id)} className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${currentChatId === chat.id ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium text-sm truncate ${currentChatId === chat.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                      {generateChatTitle(chat)}
                                    </h4>
                                    <p className="text-xs text-gray-500">{formatDate(chat.updatedAt)}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => handleDeleteChat(chat.id, e)}
                                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all duration-200 flex-shrink-0 opacity-0 group-hover:opacity-100"
                                  title="Delete chat"
                                >
                                  <DeleteIcon />
                                </button>
                              </div>
                            </div>
                          );
                        }).filter(Boolean)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentChatId && (
            <button
              onClick={goHome}
              className={`w-full h-8 flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-all duration-200 font-medium text-sm ${
                isCollapsed ? 'justify-center px-0' : 'justify-start px-2.5 gap-2'
              }`}
              title={isCollapsed ? 'Go Home' : undefined}
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Home</span>}
            </button>
          )}

          <button
            onClick={handleNewChat}
            className={`w-full h-8 flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm font-medium text-sm ${
              isCollapsed ? 'justify-center px-0' : 'justify-start px-2.5 gap-2'
            }`}
            title={isCollapsed ? 'New Chat' : undefined}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>New Chat</span>}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {validChats.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a conversation to see your chat history</p>
            </div>
          ) : (
            <div className="p-1.5">
              {validChats.map(chat => {
                if (!chat || !chat.id) return null;
                
                return (
                  <div
                    key={chat.id}
                    className={`group relative rounded-lg transition-all duration-200 mb-1 p-2.5 ${
                      currentChatId === chat.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full h-full">
                      <div onClick={() => handleChatSelect(chat.id)} className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0 h-full">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${currentChatId === chat.id ? 'bg-blue-600' : 'bg-gray-300'}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-sm truncate leading-tight ${currentChatId === chat.id ? 'text-blue-900' : 'text-gray-900'}`}>
                            {generateChatTitle(chat)}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">{formatDate(chat.updatedAt)}</p>
                          {chat.messages && chat.messages.length > 0 && chat.messages[chat.messages.length - 1] && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {typeof chat.messages[chat.messages.length - 1].content === 'string' 
                                ? chat.messages[chat.messages.length - 1].content.substring(0, 30) + 
                                  (chat.messages[chat.messages.length - 1].content.length > 30 ? '...' : '')
                                : ''
                              }
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="ml-1.5 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 flex-shrink-0"
                        title="Delete chat"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;