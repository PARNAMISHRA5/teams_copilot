import React from 'react';
import { Plus, MessageSquare, Trash2, Menu, X, Home } from 'lucide-react';
import { Chat } from '../types/chat';

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isCollapsed,
  onToggleCollapse
}) => {
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
      'morning', 'afternoon', 'evening', 'night',
      'whats up', "what's up", 'wassup', 'how are you', 'how you doing',
      'howdy', 'greetings', 'salutations', 'aloha', 'bonjour', 'hola',
      'thanks', 'thank you', 'ty', 'thx', 'ok', 'okay', 'yes', 'no',
      'yep', 'nope', 'yeah', 'yup', 'cool', 'nice', 'great', 'awesome'
    ];

    const isGreetingMessage = (text: string) => {
      const cleanText = text.replace(/[.,!?;:]+$/, '').trim().toLowerCase();
      return greetings.includes(cleanText) ||
        greetings.some(greet =>
          cleanText.startsWith(greet + ' ') || cleanText === greet
        ) ||
        cleanText.length <= 3 ||
        /^[.,!?;:\s]+$/.test(cleanText);
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
    if (title.length > 50) {
      const truncated = title.substring(0, 47);
      const lastSpace = truncated.lastIndexOf(' ');
      title = (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) + '...';
    }

    return title;
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      onDeleteChat(chatId);
    }
  };

  return (
    <div className={`
      bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-80'}
    `}>
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={goHome}
            className={`
              flex items-center gap-3 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium
              ${isCollapsed ? 'justify-center' : 'justify-start'}
            `}
            title={isCollapsed ? "Go Home" : undefined}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Home</span>}
          </button>

          <button
            onClick={handleNewChat}
            className={`
              flex items-center gap-3 py-2.5 px-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm font-medium
              ${isCollapsed ? 'justify-center' : 'justify-start'}
            `}
            title={isCollapsed ? "New Chat" : undefined}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>New Chat</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {!isCollapsed ? (
              <>
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No chats yet</p>
                <p className="text-xs text-gray-400 mt-1">Start a conversation to see your chat history</p>
              </>
            ) : (
              <MessageSquare className="w-6 h-6 mx-auto text-gray-300 mt-4" />
            )}
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`
                  group relative rounded-lg transition-all duration-200 mb-1
                  ${currentChatId === chat.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                  }
                  ${isCollapsed ? 'p-2' : 'p-3'}
                `}
                title={isCollapsed ? generateChatTitle(chat) : undefined}
              >
                <div className="flex items-start justify-between w-full">
                  <div 
                    onClick={() => onSelectChat(chat.id)}
                    className="flex items-start gap-3 flex-1 cursor-pointer min-w-0"
                  >
                    <div className={`
                      w-2 h-2 rounded-full flex-shrink-0
                      ${currentChatId === chat.id ? 'bg-blue-600' : 'bg-gray-300'}
                      ${isCollapsed ? 'mt-1' : 'mt-2'}
                    `} />
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <h3 className={`
                          font-semibold text-sm truncate leading-tight
                          ${currentChatId === chat.id ? 'text-blue-900' : 'text-gray-900'}
                        `}>
                          {generateChatTitle(chat)}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(chat.updatedAt)}
                        </p>
                        {chat.messages.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {chat.messages[chat.messages.length - 1].content}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ✅ Trash icon always visible now */}
                  {!isCollapsed && (
                    <button 
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="ml-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 flex-shrink-0"
                      title="Delete chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
