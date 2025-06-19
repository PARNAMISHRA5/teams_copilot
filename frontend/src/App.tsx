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
      const currentChatMessages = chats.find(c => c.id === chatId)?.messages || [];
      
      const response = await fetch('https://localhost:3001/api/llama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...currentChatMessages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: 2000,
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
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure your Llama server is running on https://localhost:3001`,
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

  // Landing page
  if (showLanding) {
    return (
      <div className="min-h-screen max-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex overflow-hidden">
        {/* Sidebar for previous chats */}
        {chats.length > 0 && (
          <div className={`
            bg-white/80 backdrop-blur-sm border-r border-gray-200/50 transition-all duration-300 ease-in-out flex-shrink-0
            ${isSidebarCollapsed ? 'w-14' : 'w-72'}
          `}>
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                {!isSidebarCollapsed && (
                  <h2 className="text-base font-semibold text-gray-800">Previous Chats</h2>
                )}
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isSidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </button>
              </div>
              
              <button
                onClick={createNewChat}
                className={`w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}
                title={isSidebarCollapsed ? "New Chat" : undefined}
              >
                <Plus className="w-4 h-4" />
                {!isSidebarCollapsed && <span>New Chat</span>}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 max-h-[calc(100vh-100px)]">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  className="group relative p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-1 hover:bg-white/60 border border-transparent hover:border-gray-200/50"
                  title={isSidebarCollapsed ? chat.title : undefined}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-gray-300" />
                    {!isSidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-xs truncate text-gray-800">
                          {chat.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).format(chat.updatedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Main landing area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Teams Copilot
              </h1>
              <p className="text-sm text-gray-600">
                Your AI-powered assistant for Microsoft Teams
              </p>
            </div>

            {/* Input Area */}
            <div className="relative">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isGenerating}
                  className="w-full px-4 py-3 text-sm resize-none border-none outline-none focus:ring-0 min-h-[50px] max-h-24 disabled:opacity-50 bg-transparent"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                  }}
                />
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50/80 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Press Enter to send
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    <Send className="w-3 h-3" />
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

  // Chat interface - simplified single screen
  return (
    <div className="min-h-screen max-h-screen bg-gray-50 flex overflow-hidden">
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

      {/* Main Chat Area - Single screen without header bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
          {currentChat?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  Start a conversation
                </h3>
                <p className="text-sm text-gray-500">
                  Ask me anything to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
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
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isGenerating}
                className="w-full px-3 py-2.5 bg-transparent resize-none border-none outline-none focus:ring-0 min-h-[40px] max-h-24 disabled:opacity-50 text-sm"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                }}
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Press Enter to send
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isGenerating}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  <Send className="w-3 h-3" />
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