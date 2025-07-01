import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendHorizontal, Plus, MessageSquare, Sparkles, Menu, Square } from 'lucide-react';
import ChatSidebar from './components/ChatSidebar';
import ChatMessage from './components/ChatMessage';
import ReferencesPanel from './components/ReferencesPanel';

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [selectedMessageReferences, setSelectedMessageReferences] = useState(null);
  const [abortController, setAbortController] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const referencePanelRef = useRef(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const showLanding = !currentChatId;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const closeReferences = useCallback(() => {
    setIsReferencesOpen(false);
    setSelectedMessageReferences(null);
  }, []);

  // Handle click outside to close references panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isReferencesOpen && referencePanelRef.current && !referencePanelRef.current.contains(event.target)) {
        // Check if click is not on a references button
        const isReferencesButton = event.target.closest('[data-references-button]');
        if (!isReferencesButton) {
          closeReferences();
        }
      }
    };

    if (isReferencesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isReferencesOpen, closeReferences]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentChatId]);

  // Optimized localStorage operations
  useEffect(() => {
    try {
      const savedChats = localStorage.getItem('teams-copilot-chats');
      const savedCurrentChatId = localStorage.getItem('teams-copilot-current-chat');
      const savedSidebarState = localStorage.getItem('teams-copilot-sidebar-collapsed');

      if (savedChats) {
        const parsedChats = JSON.parse(savedChats).map(chat => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChats(parsedChats);

        if (savedCurrentChatId && parsedChats.find(chat => chat.id === savedCurrentChatId)) {
          setCurrentChatId(savedCurrentChatId);
        }
      }

      if (savedSidebarState) {
        setIsSidebarCollapsed(JSON.parse(savedSidebarState));
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
    setHasInitialized(true);
  }, []);

  // Debounced localStorage saves
  useEffect(() => {
    if (hasInitialized) {
      const timer = setTimeout(() => {
        localStorage.setItem('teams-copilot-chats', JSON.stringify(chats));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [chats, hasInitialized]);

  useEffect(() => {
    if (hasInitialized) {
      const timer = setTimeout(() => {
        if (currentChatId) {
          localStorage.setItem('teams-copilot-current-chat', currentChatId);
        } else {
          localStorage.removeItem('teams-copilot-current-chat');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentChatId, hasInitialized]);

  useEffect(() => {
    if (hasInitialized) {
      const timer = setTimeout(() => {
        localStorage.setItem('teams-copilot-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSidebarCollapsed, hasInitialized]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const handleReferencesToggle = useCallback((messageId, references) => {
    if (isReferencesOpen && selectedMessageReferences?.messageId === messageId) {
      closeReferences();
    } else {
      setSelectedMessageReferences({ messageId, references });
      setIsReferencesOpen(true);
    }
  }, [isReferencesOpen, selectedMessageReferences?.messageId, closeReferences]);

  const createNewChat = useCallback(() => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  }, []);

  const generateChatTitle = useCallback((chat) => {
    if (!chat.messages?.length) return 'New Chat';
    
    const greetings = ['hi', 'hello', 'hey', 'thanks', 'ok', 'yes', 'no'];
    const isGreetingMessage = (text) => {
      const cleanText = text.replace(/[.,!?;:]+$/, '').trim().toLowerCase();
      return greetings.some(greet => 
        cleanText === greet || cleanText.startsWith(greet + ' ') || cleanText.length <= 3
      );
    };

    const firstValidUserMessage = chat.messages.find(msg =>
      msg.role === 'user' && msg.content?.trim() && 
      !isGreetingMessage(msg.content) && msg.content.length >= 4
    );

    if (!firstValidUserMessage) return 'New Chat';

    let title = firstValidUserMessage.content.trim().replace(/[*_`~]/g, '');
    if (title.length > 50) {
      const truncated = title.substring(0, 47);
      const lastSpace = truncated.lastIndexOf(' ');
      title = (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) + '...';
    }

    return title.charAt(0).toUpperCase() + title.slice(1).replace(/[.!?]+$/, '');
  }, []);

  const deleteChat = useCallback((chatId) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) setCurrentChatId(null);
  }, [currentChatId]);

  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsGenerating(false);
    }
  }, [abortController]);

  // Simplified RAG response parser
  const parseRAGResponse = useCallback((content) => {
    const images = [];
    const references = [];
    
    // Extract image references
    const imageMatches = content.match(/aidn_(\d{3})/g);
    if (imageMatches) {
      const uniqueImages = [...new Set(imageMatches)];
      uniqueImages.forEach(match => {
        const index = match.split('_')[1];
        images.push({
          index,
          url: `/api/images/${match}.jpeg`,
          alt: `Reference Image ${index}`
        });
      });
    }

    // Generate mock references based on content
    const contentLower = content.toLowerCase();
    const refTypes = [
      { keywords: ['api', 'endpoint', 'rest'], ref: { id: 'ref-api-1', title: 'REST APIs for OCM Functionality', source: 'Technical Documentation', type: 'documentation' }},
      { keywords: ['integrity', 'validation'], ref: { id: 'ref-integrity-1', title: 'Integrity Validation Process', source: 'System Guide', type: 'guide' }},
      { keywords: ['authentication', 'security'], ref: { id: 'ref-auth-1', title: 'HTTP Basic Authentication', source: 'Security Documentation', type: 'security' }}
    ];

    refTypes.forEach(({ keywords, ref }) => {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        references.push({ ...ref, relevanceScore: Math.random() * 0.3 + 0.7 });
      }
    });

    if (references.length === 0) {
      references.push({
        id: 'ref-general-1',
        title: 'Teams Copilot Documentation',
        source: 'User Guide',
        type: 'guide',
        relevanceScore: 0.70
      });
    }

    return { images, references };
  }, []);

  const sendMessage = useCallback(async () => {
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
            title: chat.messages.length === 0 ? generateChatTitle({ messages: [userMessage] }) : chat.title,
            updatedAt: new Date()
          }
        : chat
    ));

    setInput('');
    setIsGenerating(true);

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
      let aiContent = data.choices?.[0]?.message?.content || 'Sorry, I received an empty response.';
      
      // Add demo image references
      if (aiContent.toLowerCase().includes('api') || aiContent.toLowerCase().includes('rest')) {
        aiContent += '\n\nHere are some relevant diagrams: aidn_000 aidn_001';
      }
      
      const { images, references } = parseRAGResponse(aiContent);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        role: 'assistant',
        timestamp: new Date(),
        images,
        references
      };

      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, aiMessage], updatedAt: new Date() }
          : chat
      ));
    } catch (error) {
      const errorContent = error.name === 'AbortError' 
        ? 'Response generation was stopped.'
        : `Sorry, I encountered an error: ${error.message}.`;
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: 'assistant',
        timestamp: new Date(),
        images: [],
        references: []
      };
      
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, errorMessage], updatedAt: new Date() }
          : chat
      ));
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [input, isGenerating, currentChatId, chats, generateChatTitle, parseRAGResponse]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      isGenerating ? stopGeneration() : sendMessage();
    }
  }, [isGenerating, stopGeneration, sendMessage]);

  const handleTextareaInput = useCallback((e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 96) + 'px';
  }, []);

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
                  onInput={handleTextareaInput}
                />
                <button
                  onClick={isGenerating ? stopGeneration : sendMessage}
                  disabled={!isGenerating && !input.trim()}
                  className={`flex items-center justify-center w-7 h-7 text-white rounded-lg transition-all duration-200 flex-shrink-0 ${
                    isGenerating 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? <Square className="w-4 h-4" /> : <SendHorizontal className="w-4 h-4" />}
                </button>
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

      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ${
        isReferencesOpen ? 'mr-80' : ''
      }`}>
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
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  onReferencesClick={handleReferencesToggle}
                  isReferencesOpen={isReferencesOpen && selectedMessageReferences?.messageId === message.id}
                />
              ))}
              {isGenerating && (
                <ChatMessage
                  message={{
                    id: 'generating',
                    content: '',
                    role: 'assistant',
                    timestamp: new Date(),
                    images: [],
                    references: []
                  }}
                  isGenerating={true}
                  onReferencesClick={handleReferencesToggle}
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
                  onInput={handleTextareaInput}
                />
                <button
                  onClick={isGenerating ? stopGeneration : sendMessage}
                  disabled={!isGenerating && !input.trim()}
                  className={`flex items-center justify-center w-8 h-8 text-white rounded-lg transition-all duration-200 flex-shrink-0 ${
                    isGenerating 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? <Square className="w-4 h-4" /> : <SendHorizontal className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={referencePanelRef}>
        <ReferencesPanel
          isOpen={isReferencesOpen}
          references={selectedMessageReferences?.references || []}
          onClose={closeReferences}
        />
      </div>
    </div>
  );
}

export default App;