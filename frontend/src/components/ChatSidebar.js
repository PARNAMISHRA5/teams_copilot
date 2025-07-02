import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, MessageSquare, Home, PanelRightOpen, PanelRightClose } from 'lucide-react';

const DeleteIcon = React.memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
));

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
  const [isTeamsContext, setIsTeamsContext] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const detectTeamsContext = () => {
      const isInTeams = !!(
        window.parent !== window ||
        window.opener ||
        document.referrer.includes('teams.microsoft.com') ||
        window.location.href.includes('teams.microsoft.com') ||
        navigator.userAgent.includes('Teams') ||
        window.microsoftTeams ||
        window.frameElement ||
        document.domain !== window.location.hostname ||
        (window.location.hostname === 'localhost' && window.parent !== window)
      );
      setIsTeamsContext(isInTeams);
      if (isInTeams) {
        document.body.classList.add('teams-context');
        document.documentElement.style.setProperty('--teams-mode', '1');
      }
    };
    detectTeamsContext();
  }, []);

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

  const formatDate = useCallback((dateObj) => {
    try {
      const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
      if (isNaN(date.getTime())) return 'Unknown';
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  }, []);

  const goHome = useCallback(() => {
    onSelectChat?.('');
    setShowChatDropdown(false);
  }, [onSelectChat]);

  const handleNewChat = useCallback(() => {
    goHome();
    onNewChat?.();
  }, [goHome, onNewChat]);

  const generateChatTitle = useCallback((chat) => {
    try {
      if (!chat?.messages?.length) return 'New Chat';
      const greetings = [
        'hi', 'hello', 'hey', 'hiya', 'sup', 'yo', 'hii', 'hiii', 'hiiii',
        'good morning', 'good afternoon', 'good evening', 'good night',
        'morning', 'afternoon', 'evening', 'night',
        'whats up', "what's up", 'wassup', 'how are you', 'how you doing',
        'howdy', 'greetings', 'salutations', 'aloha', 'bonjour', 'hola',
        'thanks', 'thank you', 'ty', 'thx', 'ok', 'okay', 'yes', 'no', 'yep',
        'nope', 'yeah', 'yup', 'cool', 'nice', 'great', 'awesome'
      ];

      const isGreetingMessage = (text) => {
        if (!text || typeof text !== 'string') return true;
        const clean = text.replace(/[.,!?;:\s]+/g, ' ').trim().toLowerCase();
        return (
          greetings.includes(clean) ||
          greetings.some(g => clean.startsWith(g + ' ') || clean === g) ||
          clean.length <= 3 ||
          /^[.,!?;:\s]*$/.test(clean)
        );
      };

      const cleanTitle = (text) => {
        if (!text || typeof text !== 'string') return '';
        let cleaned = text.replace(/\s+/g, ' ').trim().replace(/[*_`~#]/g, '');
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        return cleaned.replace(/[.!?]+$/, '');
      };

      const firstMessage = chat.messages.find(msg =>
        msg?.role === 'user' &&
        msg?.content &&
        typeof msg.content === 'string' &&
        !isGreetingMessage(msg.content) &&
        msg.content.trim().length >= 4
      );

      if (!firstMessage) return 'New Chat';

      let title = cleanTitle(firstMessage.content);
      const maxLength = isTeamsContext ? 30 : 40;
      if (title.length > maxLength) {
        const cut = title.substring(0, maxLength - 3);
        const lastSpace = cut.lastIndexOf(' ');
        title = (lastSpace > 15 ? cut.substring(0, lastSpace) : cut) + '...';
      }
      return title || 'New Chat';
    } catch (error) {
      return 'New Chat';
    }
  }, [isTeamsContext]);

  const handleDeleteClick = useCallback((chatId, e) => {
    e.stopPropagation();
    setChatToDelete(chatToDelete === chatId ? null : chatId);
  }, [chatToDelete]);

  const confirmDelete = useCallback((chatId) => {
    if (onDeleteChat) {
      onDeleteChat(chatId);
      setChatToDelete(null);
    }
  }, [onDeleteChat]);

  const cancelDelete = useCallback(() => setChatToDelete(null), []);

  const handleChatSelect = useCallback((chatId) => {
    onSelectChat?.(chatId);
    setShowChatDropdown(false);
  }, [onSelectChat]);

  const validChats = useMemo(() => Array.isArray(chats) ? chats.filter(chat => chat?.id) : [], [chats]);

  const getResponsiveClasses = () => {
    if (isTeamsContext) {
      return {
        sidebar: isCollapsed ? 'w-10' : 'w-56',
        padding: isCollapsed ? 'p-1' : 'p-2',
        chatPadding: 'p-1.5',
        text: 'text-xs',
        spacing: 'gap-1',
        buttonHeight: isCollapsed ? 'h-6' : 'h-6',
        iconSize: 'w-3 h-3'
      };
    }
    return {
      sidebar: isCollapsed ? 'w-12' : 'w-64',
      padding: isCollapsed ? 'p-2' : 'p-2.5',
      chatPadding: 'p-2.5',
      text: 'text-sm',
      spacing: 'gap-2',
      buttonHeight: isCollapsed ? 'h-8' : 'h-8',
      iconSize: 'w-4 h-4'
    };
  };

  const classes = getResponsiveClasses();

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative ${classes.sidebar}`}>
      <div className={`${classes.padding} border-b border-gray-100`}>
        <div className={`flex items-center justify-between mb-2 ${classes.spacing}`}>
          {!isCollapsed && (
            <h2 className={`font-semibold text-gray-800 ${isTeamsContext ? 'text-sm' : 'text-base'}`}>
              Chats
            </h2>
          )}
          <button
            onClick={onToggleCollapse}
            className={`${isTeamsContext ? 'w-6 h-6' : 'w-8 h-8'} hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center text-gray-700`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ?
              <PanelRightClose className={classes.iconSize} /> :
              <PanelRightOpen className={classes.iconSize} />}
          </button>
        </div>

        <div className={`flex flex-col ${classes.spacing}`}>
          {currentChatId && (
            <button
              onClick={goHome}
              className={`w-full ${classes.buttonHeight} flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-all duration-200 font-medium ${classes.text} ${isCollapsed ? 'justify-center px-0' : 'justify-start px-2.5 gap-2'}`}
              title="Go Home"
            >
              <Home className={`flex-shrink-0 ${classes.iconSize}`} />
              {!isCollapsed && <span>Home</span>}
            </button>
          )}

          <button
            onClick={handleNewChat}
            className={`w-full ${classes.buttonHeight} flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm font-medium ${classes.text} ${isCollapsed ? 'justify-center px-0' : 'justify-start px-2.5 gap-2'}`}
            title="New Chat"
          >
            <Plus className={`flex-shrink-0 ${classes.iconSize}`} />
            {!isCollapsed && <span>New Chat</span>}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {validChats.map(chat => (
            <div
              key={chat.id}
              className={`group rounded-lg transition-all duration-200 mb-1 p-2 border ${currentChatId === chat.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'}`}
            >
              <div className="flex justify-between items-start">
                <div onClick={() => handleChatSelect(chat.id)} className="flex flex-col flex-1 cursor-pointer min-w-0">
                  <h3 className={`truncate font-semibold ${classes.text} ${currentChatId === chat.id ? 'text-blue-900' : 'text-gray-900'}`}>
                    {generateChatTitle(chat)}
                  </h3>
                  <p className={`text-gray-500 ${classes.text}`}>{formatDate(chat.updatedAt)}</p>
                  
                </div>
                {chatToDelete === chat.id ? (
                  <div className="ml-2 flex flex-col gap-1">
                    <button onClick={() => confirmDelete(chat.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    <button onClick={cancelDelete} className="text-xs text-gray-500 hover:underline">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleDeleteClick(chat.id, e)}
                    className="ml-2 text-gray-400 hover:text-red-500"
                    title="Delete chat"
                  >
                    <DeleteIcon />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
