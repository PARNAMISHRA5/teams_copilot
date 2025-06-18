import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Sparkles, Home, Menu, X } from 'lucide-react';
import ChatSidebar from './components/ChatSidebar';
import ChatMessage from './components/ChatMessage';
import { Chat, Message } from './types/chat';

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  // Show landing page when no current chat is selected (not based on chats length)
  const showLanding = !currentChatId;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentChatId]);

  // Load chats from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem('teams-copilot-chats');
    const savedCurrentChatId = localStorage.getItem('teams-copilot-current-chat');
    const savedSidebarState = localStorage.getItem('teams-copilot-sidebar-collapsed');
    
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChats(parsedChats);
        
        // Restore current chat if it exists and is valid
        if (savedCurrentChatId && parsedChats.find((chat: Chat) => chat.id === savedCurrentChatId)) {
          setCurrentChatId(savedCurrentChatId);
        }
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    }

    if (savedSidebarState) {
      setIsSidebarCollapsed(JSON.parse(savedSidebarState));
    }

    setHasInitialized(true);
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (hasInitialized) {
      localStorage.setItem('teams-copilot-chats', JSON.stringify(chats));
    }
  }, [chats, hasInitialized]);

  // Save current chat ID to localStorage
  useEffect(() => {
    if (hasInitialized) {
      if (currentChatId) {
        localStorage.setItem('teams-copilot-current-chat', currentChatId);
      } else {
        localStorage.removeItem('teams-copilot-current-chat');
      }
    }
  }, [currentChatId, hasInitialized]);

  // Save sidebar state to localStorage
  useEffect(() => {
    if (hasInitialized) {
      localStorage.setItem('teams-copilot-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
    }
  }, [isSidebarCollapsed, hasInitialized]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const goHome = () => {
    setCurrentChatId(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    let chatId = currentChatId;

    // If no current chat exists, create one first
    if (!chatId) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: input.trim().slice(0, 50) + (input.trim().length > 50 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setChats(prev => [newChat, ...prev]);
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    };

    // Add user message to the chat
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage],
            title: chat.messages.length === 0 
              ? input.trim().slice(0, 50) + (input.trim().length > 50 ? '...' : '')
              : chat.title,
            updatedAt: new Date()
          }
        : chat
    ));

    setInput('');
    setIsGenerating(true);

    try {
      // Get current chat messages for context
      const currentChatMessages = chats.find(c => c.id === chatId)?.messages || [];
      
      // Call your Llama proxy server
      const response = await fetch('http://localhost:3001/api/llama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...currentChatMessages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: 2000, // Increased from 500 to allow longer responses
          temperature: 0.7,
          top_p: 0.9
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.choices?.[0]?.message?.content || 'Sorry, I received an empty response.',
        role: 'assistant',
        timestamp: new Date()
      };

      // Add AI response to the chat
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, aiMessage],
              updatedAt: new Date()
            }
          : chat
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure your Llama server is running on http://localhost:3001`,
        role: 'assistant',
        timestamp: new Date()
      };

      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, errorMessage],
              updatedAt: new Date()
            }
          : chat
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  // Landing page with previous chats
  if (showLanding) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
        {/* Sidebar showing previous chats - always show if there are chats */}
        {chats.length > 0 && (
          <div className={`
            bg-white/80 backdrop-blur-sm border-r border-gray-200/50 transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'w-16' : 'w-80'}
          `}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                {!isSidebarCollapsed && (
                  <h2 className="text-lg font-semibold text-gray-800">Previous Chats</h2>
                )}
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
              </div>
              
              {!isSidebarCollapsed && (
                <button
                  onClick={createNewChat}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">New Chat</span>
                </button>
              )}
              
              {isSidebarCollapsed && (
                <button
                  onClick={createNewChat}
                  className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                  title="New Chat"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 max-h-[calc(100vh-120px)]">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  className="group relative p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 hover:bg-white/60 border border-transparent hover:border-gray-200/50"
                  title={isSidebarCollapsed ? chat.title : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gray-300" />
                    {!isSidebarCollapsed && (
                      <div className="flex-1 min-w-0 pr-8">
                        <h3 className="font-medium text-sm truncate text-gray-800">
                          {chat.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).format(chat.updatedAt)}
                        </p>
                        {chat.messages.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {chat.messages[chat.messages.length - 1].content}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Main area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Teams Copilot
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Your AI-powered assistant for Microsoft Teams. Ask me anything to get started.
              </p>
            </div>

            {/* Quick Actions */}
            {chats.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={createNewChat}
                    className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white hover:border-gray-300 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">New Chat</h4>
                        <p className="text-sm text-gray-500">Start a fresh conversation</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => chats.length > 0 && selectChat(chats[0].id)}
                    className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white hover:border-gray-300 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Continue Last Chat</h4>
                        <p className="text-sm text-gray-500">Resume recent conversation</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="relative">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isGenerating}
                  className="w-full px-6 py-4 text-lg resize-none border-none outline-none focus:ring-0 min-h-[60px] max-h-32 disabled:opacity-50 bg-transparent"
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '60px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50/80 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    Press Enter to send, Shift + Enter for new line
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Send className="w-4 h-4" />
                    {isGenerating ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={goHome}
                className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200 cursor-pointer"
                title="Go to Home"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="font-semibold text-gray-800">Teams Copilot</h1>
                <p className="text-sm text-gray-500">
                  {currentChat?.title || 'New Chat'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goHome}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Go to home"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={createNewChat}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {currentChat?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500">
                  Ask me anything and I'll help you with information, tasks, or just have a chat.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {currentChat?.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {isGenerating && (
                <ChatMessage
                  message={{
                    id: 'generating',
                    content: '',
                    role: 'assistant',
                    timestamp: new Date()
                  }}
                  isGenerating={true}
                />
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isGenerating}
                className="w-full px-4 py-3 bg-transparent resize-none border-none outline-none focus:ring-0 min-h-[50px] max-h-32 disabled:opacity-50"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Press Enter to send, Shift + Enter for new line
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isGenerating ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;