import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Home, PanelRightOpen, PanelRightClose, Menu, X,Trash2 } from 'lucide-react';
import ProfileMenu from './ProfileMenu';



const ChatSidebar = ({
  chats = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isCollapsed,
  onToggleCollapse,
  isTeams,
  account,
  logout,
  isMobileOpen,
  onMobileToggle,
  platformInfo = { isTeams: false }
}) => {
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click outside for dropdown
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
      const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
      
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
    if (isMobile && onMobileToggle) {
      onMobileToggle(false);
    }
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
    setPendingDeleteChatId(chatId);
    setShowDeleteConfirm(true);

  };

  const handleChatSelect = (chatId) => {
    if (onSelectChat) {
      onSelectChat(chatId);
    }
    setShowChatDropdown(false);
    if (isMobile && onMobileToggle) {
      onMobileToggle(false);
    }
  };

  const validChats = Array.isArray(chats) ? chats : [];

  // Calculate dynamic input area height based on platformInfo
  const getInputAreaHeight = () => {
    if (platformInfo.isTeams) {
      return 'h-12'; // Adjusted height for teams to match input area
    }
    return 'h-14'; // Default height to match input area
  };

  // Mobile sidebar
  if (isMobile) {
    return (
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-80 bg-white border-r border-gray-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Chats</h2>
            <button
              onClick={() => onMobileToggle(false)}
              className="w-8 h-8 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex flex-col gap-2">
            {currentChatId && (
              <button
                onClick={goHome}
                className="w-full h-10 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm border border-gray-200"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </button>
            )}
            <button
              onClick={handleNewChat}
              className="w-full h-10 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm font-medium text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </button>
          </div>
        </div>

        {/* Mobile Chat List */}
        <div className="flex-1 overflow-y-auto">
          {validChats.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No chats yet</p>
              <p className="text-sm text-gray-400">Start a conversation to see your chat history</p>
            </div>
          ) : (
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">Recent Chats</h3>
              {validChats.map(chat => {
                if (!chat || !chat.id) return null;
                
                return (
                  <div
                    key={chat.id}
                    className={`group relative rounded-xl transition-all duration-200 mb-2 p-4 border ${
                      currentChatId === chat.id
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm'
                        : 'hover:bg-gray-50 border-gray-100 hover:border-gray-200 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div onClick={() => handleChatSelect(chat.id)} className="flex items-start gap-3 flex-1 cursor-pointer min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                          currentChatId === chat.id ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-base mb-1 ${
                            currentChatId === chat.id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {generateChatTitle(chat)}
                          </h4>
                          <p className="text-sm text-gray-500 mb-1">{formatDate(chat.updatedAt)}</p>
                          {chat.messages && chat.messages.length > 0 && chat.messages[chat.messages.length - 1] && (
                            <p className="text-sm text-gray-400 line-clamp-2">
                              {typeof chat.messages[chat.messages.length - 1].content === 'string' 
                                ? chat.messages[chat.messages.length - 1].content.substring(0, 80) + 
                                  (chat.messages[chat.messages.length - 1].content.length > 80 ? '...' : '')
                                : ''
                              }
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="ml-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 flex-shrink-0"
                        title="Delete chat"
                      >
                        <Trash2 className="w-4 h-4" />

                      </button>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>

        {/* Mobile Profile Menu at Bottom - with proper height and visible username */}
        <div className={`${getInputAreaHeight()} flex items-center border-t border-gray-100 bg-gray-50 px-4`}>
          <div className="w-full">
            <ProfileMenu 
              account={account} 
              logout={logout}
              isMobile={true}
              showUsername={true}
              platformInfo={platformInfo}
            />
          </div>
        </div>
{showDeleteConfirm && (
  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
<div className="bg-white rounded-xl shadow-xl ring-1 ring-gray-200 w-full max-w-xs p-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 bg-red-100 text-red-600 rounded-full p-2">
          <Trash2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-800">Delete this chat?</h3>
          <p className="text-sm text-gray-500 mt-1">
            This action can’t be undone.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <button
          onClick={() => {
            onDeleteChat(pendingDeleteChatId);
            setShowDeleteConfirm(false);
            setPendingDeleteChatId(null);
          }}
          className="w-full py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
        >
          Delete
        </button>
        <button
          onClick={() => setShowDeleteConfirm(false)}
          className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}


      </div>
    );
  }

  // Desktop sidebar with ProfileMenu at bottom
  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative ${
      isCollapsed ? 'w-12' : 'w-64'
    }`}>
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
                                  <Trash2 className="w-4 h-4" />

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

      {/* Chat List - Only show when not collapsed */}
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
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>
      )}

      {/* Spacer to push profile menu to bottom when collapsed */}
      {isCollapsed && <div className="flex-1" />}

      {/* Desktop Profile Menu at Bottom - with proper height */}
      <div className={`${getInputAreaHeight()} flex items-center  border-gray-100 ${isCollapsed ? '' : 'bg-gray-50'} px-2.5`}>

        <div className="w-full">
          <ProfileMenu 
            account={account} 
            logout={logout}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            showUsername={!isCollapsed}
            platformInfo={platformInfo}
          />
        </div>
        </div>
{showDeleteConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm p-6 animate-fadeIn">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 bg-red-100 text-red-600 rounded-full p-2.5">
          <Trash2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">Delete chat?</h3>
          <p className="text-sm text-gray-500 mt-1">
            This will permanently delete the chat and its messages.
          </p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setShowDeleteConfirm(false)}
          className="px-4 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onDeleteChat(pendingDeleteChatId);
            setShowDeleteConfirm(false);
            setPendingDeleteChatId(null);
          }}
          className="px-4 py-1.5 text-sm bg-red-500 text-white hover:bg-red-600 rounded-lg transition font-medium shadow-sm"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}



    </div>
  );
};

export default ChatSidebar;