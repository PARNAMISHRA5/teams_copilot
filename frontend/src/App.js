import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SendHorizontal, Plus, MessageSquare, Sparkles, Menu, Square, Monitor, Smartphone, Globe, ChevronDown, Settings } from 'lucide-react';
import ChatSidebar from './components/ChatSidebar';
import ChatMessage from './components/ChatMessage';
import ReferencesPanel from './components/ReferencesPanel';

// AI Model versions
const AI_MODELS = [
  { id: 'claude-4-sonnet', name: 'Claude 4 Sonnet', description: 'Balanced performance and speed' },
  { id: 'claude-4-opus', name: 'Claude 4 Opus', description: 'Most capable, slower' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Fast and capable' },
  { id: 'llama-3-70b', name: 'Llama 3 70B', description: 'Open source alternative' },
  { id: 'v4.2-maintenance', name: 'v4.2 Maintenance', description: 'Stable model with minimal drift' }
];


// Simplified platform detection
const detectPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check if running in Teams
  const isInTeams = window.location.href.includes('teams.microsoft.com') || 
                   window.parent !== window || 
                   userAgent.includes('teams');
  
  if (isInTeams) {
    return {
      source: 'Microsoft Teams',
      platform: 'Teams',
      icon: 'teams',
      isTeams: true
    };
  }
  
  // Browser detection
  let browser = 'Unknown';
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('edg')) {
    browser = 'Edge';
  }
  
  return {
    source: 'Web Browser',
    platform: browser,
    icon: 'web',
    isTeams: false
  };
};

// Platform indicator component - moved to bottom status bar
const PlatformIndicator = ({ platform }) => {
  if (!platform) return null;

  const getIcon = () => {
    switch (platform.icon) {
      case 'teams': return MessageSquare;
      case 'web': return Globe;
      default: return Globe;
    }
  };

  const IconComponent = getIcon();

  return (
    <div className="flex items-center gap-1 text-xs text-gray-400">
      <IconComponent className="w-3 h-3" />
      {platform.platform}
    </div>
  );
};

// Compact Version Selector Component with better positioning

const CompactVersionSelector = ({ selectedModel, onModelChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => setIsOpen(false);

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  const selectedModelData = AI_MODELS.find(model => model.id === selectedModel) || AI_MODELS[0];

  return (
    <div className="relative w-full max-w-xs">
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        title={`Current model: ${selectedModelData.name}`}
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">{selectedModelData.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            // Adjusted positioning for dropdown: left-0 and w-full for better alignment in compact spaces
            className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-[99999]"
          >
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 px-2 py-1">Select AI Model</div>
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                  selectedModel === model.id ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <div className="font-medium text-sm">{model.name}</div>
                <div className="text-xs text-gray-500">{model.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [selectedModel, setSelectedModel] = useState('claude-4-sonnet');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const referencePanelRef = useRef(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const showLanding = !currentChatId;
  const platformInfo = detectPlatform();

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

  // Load saved data
  useEffect(() => {
    try {
      const savedChats = JSON.parse(localStorage.getItem('teams-copilot-chats') || '[]');
      const savedCurrentChatId = localStorage.getItem('teams-copilot-current-chat');
      const savedSidebarState = JSON.parse(localStorage.getItem('teams-copilot-sidebar-collapsed') || 'false');
      const savedModel = localStorage.getItem('teams-copilot-selected-model') || 'claude-4-sonnet';

      if (savedChats.length > 0) {
        const parsedChats = savedChats.map(chat => ({
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

      setIsSidebarCollapsed(savedSidebarState);
      setSelectedModel(savedModel);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
    setHasInitialized(true);
  }, []);

  // Save data
  useEffect(() => {
    if (hasInitialized) {
      const timer = setTimeout(() => {
        localStorage.setItem('teams-copilot-chats', JSON.stringify(chats));
        localStorage.setItem('teams-copilot-selected-model', selectedModel);
        localStorage.setItem('teams-copilot-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
        if (currentChatId) {
          localStorage.setItem('teams-copilot-current-chat', currentChatId);
        } else {
          localStorage.removeItem('teams-copilot-current-chat');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [chats, selectedModel, isSidebarCollapsed, currentChatId, hasInitialized]);

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

  const parseRAGResponse = useCallback((content) => {
    const images = [];
    const references = [];

    // Extract image references and fix paths
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

    // Generate references based on content
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

      const requestPayload = {
        messages: [...currentChatMessages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        model: selectedModel,
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
        platform: platformInfo
      };

      console.log('Sending request with model:', selectedModel, 'platform:', platformInfo);

      const response = await fetch('https://localhost:3001/api/llama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });

      if (!response.ok) throw new Error((await response.json()).error || `HTTP ${response.status}`);

      const data = await response.json();
      let aiContent = data.choices?.[0]?.message?.content || 'Sorry, I received an empty response.';

      // Add demo image references for testing
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
        references,
        model: selectedModel
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
  }, [input, isGenerating, currentChatId, chats, generateChatTitle, parseRAGResponse, selectedModel, platformInfo]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      isGenerating ? stopGeneration() : sendMessage();
    }
  }, [isGenerating, stopGeneration, sendMessage]);

  const handleTextareaInput = useCallback((e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, platformInfo.isTeams ? 48 : 64) + 'px'; // Max height 48px for Teams (3 lines of text @ text-xs with line-height) and 64px for web (4 lines @ text-sm)
  }, [platformInfo.isTeams]);

  // Landing page when no chat is selected
  if (showLanding) {
    return (
      <div className={`min-h-screen max-h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50'
      }`}>
        

        <ChatSidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={setCurrentChatId}
          onNewChat={createNewChat}
          onDeleteChat={deleteChat}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          isTeams={platformInfo.isTeams}
        />

        <div className={`flex-1 flex flex-col items-center justify-center p-4 overflow-hidden ${
          platformInfo.isTeams ? 'pt-12' : ''
        }`}>
          <div className="w-full max-w-xl mx-auto">
            {/* Logo and title section */}
            <div className="text-center mb-6">
              {
                <div className="inline-flex items-center justify-center w-10 h-10 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
              }
              <h1 className={`font-bold mb-2 ${
                platformInfo.isTeams 
                  ? 'text-lg text-gray-900' 
                  : 'text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                Teams Copilot
              </h1>
              <p className="text-gray-600 text-sm">
                Your AI-powered assistant for Microsoft Teams
              </p>
            </div>

            {/* Input area - smaller and cleaner */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-end gap-2 p-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything to get started..."
                  disabled={isGenerating}
                  className="flex-1 text-sm resize-none border-none outline-none focus:ring-0 min-h-[20px] max-h-12 disabled:opacity-50 bg-transparent placeholder-gray-400"
                  rows={1}
                  onInput={handleTextareaInput}
                />
                <div className="flex items-center gap-2">
                  <CompactVersionSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    disabled={isGenerating}
                  />

                  <button
                    onClick={isGenerating ? stopGeneration : sendMessage}
                    disabled={!isGenerating && !input.trim()}
                    className={`flex items-center justify-center w-7 h-7 text-white rounded-md transition-all duration-200 flex-shrink-0 ${
                      isGenerating 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? <Square className="w-3 h-3" /> : <SendHorizontal className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Centered disclaimer */}
            <div className="text-center mt-3">
              <p className="text-xs text-gray-400">
                {isGenerating 
                  ? "AI is generating a response..." 
                  : "AI can make mistakes. Please verify important information."
                }
              </p>
            </div>
          </div>

          {/* Bottom status bar */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <PlatformIndicator platform={platformInfo} />
          </div>
        </div>
      </div>
    );
  }

  // Chat interface
  return (
    <div className={`min-h-screen max-h-screen flex overflow-hidden'bg-white' 
    }`}>
    

      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isTeams={platformInfo.isTeams}
      />

      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ${
        isReferencesOpen ? 'mr-80' : ''
      } `}>      
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          {currentChat?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Start a conversation</h3>
                <p className="text-xs text-gray-500">Ask me anything to get started</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
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
                    references: [],
                    model: selectedModel
                  }}
                  isGenerating={true}
                  onReferencesClick={handleReferencesToggle}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Smaller input area */}
    {/* Smaller input area */}
    <div className={`bg-white border-t border-gray-200 flex-shrink-0 ${
      platformInfo.isTeams ? 'px-3 py-2' : 'px-4 py-3'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className={`bg-gray-50 rounded-lg border border-gray-200 overflow-hidden ${
          platformInfo.isTeams ? 'rounded-md' : ''
        }`}>
          <div className={`flex items-end gap-2 ${
            platformInfo.isTeams ? 'p-2' : 'p-3'
          }`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isGenerating}
              className={`flex-1 bg-transparent resize-none border-none outline-none focus:ring-0 min-h-[20px] disabled:opacity-50 ${
                platformInfo.isTeams ? 'max-h-12 text-xs' : 'max-h-16 text-sm'
              }`}
              rows={1}
              onInput={handleTextareaInput}
            />
            <div className="flex items-center gap-2">
              {/* Ensure CompactVersionSelector width is responsive or fixed for Teams */}
              <div className={platformInfo.isTeams ? 'max-w-[150px]' : 'max-w-xs'}> {/* Adjusted max-w for Teams */}
                <CompactVersionSelector
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  disabled={isGenerating}
                />
              </div>
              <button
                onClick={isGenerating ? stopGeneration : sendMessage}
                disabled={!isGenerating && !input.trim()}
                className={`flex items-center justify-center text-white rounded-md transition-all duration-200 flex-shrink-0 ${
                  platformInfo.isTeams 
                    ? 'w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'w-7 h-7 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                } ${
                  isGenerating 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : ''
                }`}
              >
                {isGenerating ? (
                  <Square className={platformInfo.isTeams ? "w-3 h-3" : "w-3 h-3"} />
                ) : (
                  <SendHorizontal className={platformInfo.isTeams ? "w-3 h-3" : "w-3 h-3"} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom status bar with platform info - centered disclaimer */}
        <div className={`flex items-center justify-between ${
          platformInfo.isTeams ? 'mt-1' : 'mt-2'
        }`}>
          <div className="w-20">
            <PlatformIndicator platform={platformInfo} />
          </div>
          <div className="flex-1 text-center">
            <p className={`text-gray-400 ${
              platformInfo.isTeams ? 'text-[10px]' : 'text-xs'
            }`}>
              {isGenerating 
                ? "AI is generating a response..." 
                : "AI can make mistakes. Please verify important information."
              }
            </p>
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