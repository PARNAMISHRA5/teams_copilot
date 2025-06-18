import React from 'react';
import { Plus, MessageSquare, Trash2, Menu, X } from 'lucide-react';
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

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
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
    if (greetings.includes(cleanText)) return true;
    return greetings.some(greet =>
      cleanText.startsWith(greet + ' ') || cleanText === greet
    ) || cleanText.length <= 3 || /^[.,!?;:\s]+$/.test(cleanText);
  };

  const cleanTitle = (text: string) => {
    let cleaned = text.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/[*_`~]/g, '');
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    cleaned = cleaned.replace(/[.!?]+$/, '');
    return cleaned;
  };

  // Find the first non-greeting user message with at least 4 characters
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
    e.stopPropagation(); // Prevent chat selection when clicking delete
    if (window.confirm('Are you sure you want to delete this chat?')) {
      onDeleteChat(chatId);
    }
  };

  return (
    <div className={`
      bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-80'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {!isCollapsed ? (
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </button>
        ) : (
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Chat List */}
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
              <MessageSquare className="w-6 h-6 mx-auto text-gray-300" />
            )}
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`
                  group relative p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1
                  ${currentChatId === chat.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                  }
                `}
                title={isCollapsed ? generateChatTitle(chat) : undefined}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-2 h-2 rounded-full mt-2 flex-shrink-0
                    ${currentChatId === chat.id ? 'bg-blue-600' : 'bg-gray-300'}
                  `} />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 pr-8">
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
                        <p className="text-xs text-gray-400 mt-1 truncate line-clamp-2">
                          {chat.messages[chat.messages.length - 1].content}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Delete button - show on hover only when not collapsed */}
                {!isCollapsed && (
                  <button 
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all duration-200"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;