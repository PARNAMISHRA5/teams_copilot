import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Sparkles, Home, Menu, X, Square } from 'lucide-react';
import ChatSidebar from './components/ChatSidebar';
import ChatMessage from './components/ChatMessage';

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-3 h-3"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function App() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const showLanding = !currentChatId;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentChatId]);

  useEffect(() => {
    const savedChats = localStorage.getItem('teams-copilot-chats');
    const savedCurrentChatId = localStorage.getItem('teams-copilot-current-chat');
    const savedSidebarState = localStorage.getItem('teams-copilot-sidebar-collapsed');

    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats).map((chat) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChats(parsedChats);

        if (savedCurrentChatId && parsedChats.find((chat) => chat.id === savedCurrentChatId)) {
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

  useEffect(() => {
    if (hasInitialized) {
      localStorage.setItem('teams-copilot-chats', JSON.stringify(chats));
    }
  }, [chats, hasInitialized]);

  useEffect(() => {
    if (hasInitialized) {
      if (currentChatId) {
        localStorage.setItem('teams-copilot-current-chat', currentChatId);
      } else {
        localStorage.removeItem('teams-copilot-current-chat');
      }
    }
  }, [currentChatId, hasInitialized]);

  useEffect(() => {
    if (hasInitialized) {
      localStorage.setItem('teams-copilot-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
    }
  }, [isSidebarCollapsed, hasInitialized]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const generateChatTitle = (chat) => {
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

    const isGreetingMessage = (text) => {
      const cleanText = text.replace(/[.,!?;:]+$/, '').trim().toLowerCase();
      return greetings.includes(cleanText) ||
        greetings.some(greet => cleanText.startsWith(greet + ' ') || cleanText === greet) ||
        cleanText.length <= 3 || /^[.,!?;:\s]+$/.test(cleanText);
    };

    const cleanTitle = (text) => {
      let cleaned = text.replace(/\s+/g, ' ').trim().replace(/[*_`~]/g, '');
      return cleaned.length > 0 ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1).replace(/[.!?]+$/, '') : '';
    };

    const firstValidUserMessage = chat.messages.find(msg =>
      msg.role?.toLowerCase() === 'user' && msg.content?.trim() &&
      !isGreetingMessage(msg.content) && msg.content.length >= 4
    );

    if (!firstValidUserMessage) return 'New Chat';

    let title = cleanTitle(firstValidUserMessage.content.trim());
    if (title.length > 50) {
      const truncated = title.substring(0, 47);
      const lastSpace = truncated.lastIndexOf(' ');
      title = (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) + '...';
    }

    return title;
  };

  const handleDeleteChat = (chatId, e) => {
    e?.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      deleteChat(chatId);
    }
  };

  const deleteChat = (chatId) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) setCurrentChatId(null);
  };

  const stopGeneration = () => {
    if (abortController) {
      console.log('🛑 Stopping generation...');
      abortController.abort();
      setAbortController(null);
      setIsGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    let chatId = currentChatId;

    if (!chatId) {
      const newChat = {
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

    const userMessage = {
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

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const currentChatMessages = chats.find(c => c.id === chatId)?.messages || [];
      const response = await fetch('https://localhost:3001/api/llama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...currentChatMessages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: 2000,
          temperature: 0.7,
          top_p: 0.9
        }),
        signal: controller.signal
      });

      if (!response.ok) throw new Error((await response.json()).error || `HTTP ${response.status}`);

      const data = await response.json();
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: data.choices?.[0]?.message?.content || 'Sorry, I received an empty response.',
        role: 'assistant',
        timestamp: new Date()
      };

      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, aiMessage], updatedAt: new Date() }
          : chat
      ));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, add a message indicating this
        const abortMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Response generation was stopped.',
          role: 'assistant',
          timestamp: new Date()
        };
        setChats(prev => prev.map(chat =>
          chat.id === chatId
            ? { ...chat, messages: [...chat.messages, abortMessage], updatedAt: new Date() }
            : chat
        ));
      } else {
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}.`,
          role: 'assistant',
          timestamp: new Date()
        };
        setChats(prev => prev.map(chat =>
          chat.id === chatId
            ? { ...chat, messages: [...chat.messages, errorMessage], updatedAt: new Date() }
            : chat
        ));
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating) {
        stopGeneration();
      } else {
        sendMessage();
      }
    }
  };

  if (showLanding) {
    return (
      <div className="min-h-screen max-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex overflow-hidden">
        <ChatSidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={setCurrentChatId}
          onNewChat={createNewChat}
          onDeleteChat={deleteChat}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Teams Copilot
            </h1>
            <p className="text-sm text-gray-600 mb-6">Your AI-powered assistant for Microsoft Teams</p>

            <div className="relative">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
                <div className="flex items-end gap-2 p-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything..."
                    disabled={isGenerating}
                    className="flex-1 text-sm resize-none border-none outline-none focus:ring-0 min-h-[24px] max-h-24 disabled:opacity-50 bg-transparent"
                    rows={1}
                    onInput={(e) => {
                      const target = e.target;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                    }}
                  />
                  <button
                    onClick={isGenerating ? stopGeneration : sendMessage}
                    disabled={!isGenerating && !input.trim()}
                    className={`flex items-center justify-center w-7 h-7 text-white rounded-lg transition-all duration-200 flex-shrink-0 ${
                      isGenerating 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                    title={isGenerating ? 'Stop generation' : 'Send message'}
                  >
                    {isGenerating ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
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
    <div className="min-h-screen max-h-screen bg-gray-50 flex overflow-hidden">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
          {currentChat?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">Start a conversation</h3>
                <p className="text-sm text-gray-500">Ask me anything to get started</p>
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

        <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-end gap-2 p-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isGenerating}
                  className="flex-1 bg-transparent resize-none border-none outline-none focus:ring-0 min-h-[24px] max-h-24 disabled:opacity-50 text-sm"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                  }}
                />
                <button
                  onClick={isGenerating ? stopGeneration : sendMessage}
                  disabled={!isGenerating && !input.trim()}
                  className={`flex items-center justify-center w-8 h-8 text-white rounded-lg transition-all duration-200 flex-shrink-0 ${
                    isGenerating 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                  title={isGenerating ? 'Stop generation' : 'Send message'}
                >
                  {isGenerating ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
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