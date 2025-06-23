import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Menu, X, Home, Square } from 'lucide-react';
import { Chat } from '../types/chat';
import { PanelRightOpen } from 'lucide-react';
import { PanelRightClose } from 'lucide-react';

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

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

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isCollapsed,
  onToggleCollapse
}) => {
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowChatDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when sidebar expands
  useEffect(() => {
    if (!isCollapsed) {
      setShowChatDropdown(false);
    }
  }, [isCollapsed]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    else if (days === 1) return 'Yesterday';
    else if (days < 7) return `${days} days ago`;
    else return date.toLocaleDateString();
  };

  const goHome = () => {
    onSelectChat('');
    setShowChatDropdown(false);
  };

  const handleNewChat = () => {
    goHome();
    onNewChat();
  };

  const generateChatTitle = (chat: Chat): string => {
    if (!chat.messages || chat.messages.length === 0) return 'New Chat';
    const greetings = [
      'hi', 'hello', 'hey', 'hiya', 'sup', 'yo', 'hii', 'hiii', 'hiiii',
      'good morning', 'good afternoon', 'good evening', 'good night',
      'morning', 'afternoon', 'evening', 'night', 'whats up', "what's up",
      'wassup', 'how are you', 'how you doing', 'howdy', 'greetings',
      'salutations', 'aloha', 'bonjour', 'hola', 'thanks', 'thank you',
      'ty', 'thx', 'ok', 'okay', 'yes', 'no', 'yep', 'nope', 'yeah', 'yup',
      'cool', 'nice', 'great', 'awesome'
    ];

    const isGreetingMessage = (text: string) => {
      const cleanText = text.replace(/[.,!?;:]+$/, '').trim().toLowerCase();
      return greetings.includes(cleanText) ||
        greetings.some(greet =>
          cleanText.startsWith(greet + ' ') || cleanText === greet
        ) || cleanText.length <= 3 || /^[.,!?;:\s]+$/.test(cleanText);
    };

    const cleanTitle = (text: string) => {
      let cleaned = text.replace(/\s+/g, ' ').trim();
      cleaned = cleaned.replace(/[*_`~]/g, '');
      if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
      return cleaned.replace(/[.!?]+$/, '');
    };

    const firstValidUserMessage = chat.messages.find(msg => {
      const role = msg.role?.toLowerCase();
      const content = msg.content?.trim();
      return role === 'user' && content && !isGreetingMessage(content) && content.length >= 4;
    });

    if (!firstValidUserMessage) return 'New Chat';

    let title = cleanTitle(firstValidUserMessage.content.trim());
    if (title.length > 40) {
      const truncated = title.substring(0, 37);
      const lastSpace = truncated.lastIndexOf(' ');
      title = (lastSpace > 15 ? truncated.substring(0, lastSpace) : truncated) + '...';
    }

    return title;
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      onDeleteChat(chatId);
    }
  };

  const handleChatSelect = (chatId: string) => {
    onSelectChat(chatId);
    setShowChatDropdown(false);
  };

  return (
    <div className={`
      bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative
      ${isCollapsed ? 'w-12' : 'w-64'}
    `}>
      {/* Header Section */}
      <div className="p-2.5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          {!isCollapsed && (
            <h2 className="text-base font-semibold text-gray-800">Chats</h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center text-gray-700"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5">
          {/* Chat History Button - Only show when collapsed */}
          {isCollapsed && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowChatDropdown(!showChatDropdown)}
                className="w-full h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-all duration-200"
                title="Chat History"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Chat Dropdown */}
              {showChatDropdown && (
                <div className="absolute left-full top-0 ml-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Recent Chats</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {chats.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No chats yet</p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {chats.slice(0, 10).map((chat) => (
                          <div
                            key={chat.id}
                            className={`
                              group relative rounded-lg transition-all duration-200 mb-1 p-2
                              ${currentChatId === chat.id
                                ? 'bg-blue-50 border border-blue-200'
                                : 'hover:bg-gray-50 border border-transparent cursor-pointer'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div 
                                onClick={() => handleChatSelect(chat.id)}
                                className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
                              >
                                <div className={`
                                  w-1.5 h-1.5 rounded-full flex-shrink-0
                                  ${currentChatId === chat.id ? 'bg-blue-600' : 'bg-gray-300'}
                                `} />
                                <div className="flex-1 min-w-0">
                                  <h4 className={`
                                    font-medium text-sm truncate
                                    ${currentChatId === chat.id ? 'text-blue-900' : 'text-gray-900'}
                                  `}>
                                    {generateChatTitle(chat)}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(chat.updatedAt)}
                                  </p>
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Only show Home button when not on landing page */}
          {currentChatId && (
            <button
              onClick={goHome}
              className={`
                w-full h-8 flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-all duration-200 font-medium text-sm
                ${isCollapsed ? 'justify-center px-0' : 'justify-start px-2.5 gap-2'}
              `}
              title={isCollapsed ? "Go Home" : undefined}
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Home</span>}
            </button>
          )}

          <button
            onClick={handleNewChat}
            className={`
              w-full h-8 flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm font-medium text-sm
              ${isCollapsed ? 'justify-center px-0' : 'justify-start px-2.5 gap-2'}
            `}
            title={isCollapsed ? "New Chat" : undefined}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>New Chat</span>}
          </button>
        </div>
      </div>

      {/* Chat List Section - Only show when NOT collapsed */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a conversation to see your chat history</p>
            </div>
          ) : (
            <div className="p-1.5">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`
                    group relative rounded-lg transition-all duration-200 mb-1 p-2.5
                    ${currentChatId === chat.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center justify-between w-full h-full">
                    <div 
                      onClick={() => onSelectChat(chat.id)}
                      className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0 h-full"
                    >
                      <div className={`
                        w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1
                        ${currentChatId === chat.id ? 'bg-blue-600' : 'bg-gray-300'}
                      `} />
                      <div className="flex-1 min-w-0">
                        <h3 className={`
                          font-semibold text-sm truncate leading-tight
                          ${currentChatId === chat.id ? 'text-blue-900' : 'text-gray-900'}
                        `}>
                          {generateChatTitle(chat)}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(chat.updatedAt)}
                        </p>
                        {chat.messages.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {chat.messages[chat.messages.length - 1].content.substring(0, 30)}
                            {chat.messages[chat.messages.length - 1].content.length > 30 ? '...' : ''}
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;