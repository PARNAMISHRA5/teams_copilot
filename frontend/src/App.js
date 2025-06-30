import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal , Plus, MessageSquare, Sparkles, Home, Menu, X, Square } from 'lucide-react';
import ChatSidebar from './components/ChatSidebar';
import ChatMessage from './components/ChatMessage';
import ReferencesPanel from './components/ReferencesPanel';

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
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [selectedMessageReferences, setSelectedMessageReferences] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

    const [project_version, setProjectVersion] = useState("v4.2");
  const [showDropdown, setShowDropdown] = useState(false);
  //   const [selectedOption, setSelectedOption] = useState("View Prompts");
  const options = [
    {
      heading: "Switch Version",
      description: "Select the TM Documentation version",
    },
    {
      heading: "New Session",
      description: "Starts new session with AI-DN",
    },
  ];
  const handleSelect = (option) => {
    setInput(option); // ✅ insert into input
    setShowDropdown(false); // ✅ close dropdown
  };

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

  const handleReferencesToggle = (messageId, references) => {
    if (isReferencesOpen && selectedMessageReferences?.messageId === messageId) {
      // Close if same message clicked
      setIsReferencesOpen(false);
      setSelectedMessageReferences(null);
    } else {
      // Open with new references
      setSelectedMessageReferences({ messageId, references });
      setIsReferencesOpen(true);
    }
  };

  const closeReferences = () => {
    setIsReferencesOpen(false);
    setSelectedMessageReferences(null);
  };

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

  // Enhanced function to parse RAG response and extract images/references
  const parseRAGResponse = (content) => {
    const images = [];
    const references = [];
    
    // Extract image references (format: aidn_000, aidn_001, etc.)
    const imageRegex = /aidn_(\d{3})/g;
    let imageMatch;
    const foundImages = new Set(); // Prevent duplicates
    
    while ((imageMatch = imageRegex.exec(content)) !== null) {
      const imageIndex = imageMatch[1];
      if (!foundImages.has(imageIndex)) {
        foundImages.add(imageIndex);
        images.push({
          index: imageIndex,
          url: `/api/images/aidn_${imageIndex}.jpeg`,// This will be your actual image endpoint
          alt: `Reference Image ${imageIndex}`,
          placeholder: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlICR7aW1hZ2VJbmRleH08L3RleHQ+PC9zdmc+`
        });
      }
    }

    // Generate mock references based on content analysis
    // In real implementation, these would come from your RAG pipeline
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('api') || contentLower.includes('endpoint') || contentLower.includes('rest')) {
      references.push({
        id: 'ref-api-1',
        title: 'REST APIs for OCM Functionality',
        source: 'Technical Documentation',
        url: '/docs/rest-apis-ocm-v4',
        excerpt: 'Managing Integrity Validation Using RESTful API. The TM server application provides integrity validation functions...',
        relevanceScore: 0.95,
        type: 'documentation'
      });
    }

    if (contentLower.includes('integrity') || contentLower.includes('validation') || contentLower.includes('sealing')) {
      references.push({
        id: 'ref-integrity-1',
        title: 'Integrity Validation and Sealing Process',
        source: 'System Administration Guide',
        url: '/docs/integrity-validation',
        excerpt: 'Sealing critical resources including managing snapshots, clean reference state, critical resources DB...',
        relevanceScore: 0.88,
        type: 'guide'
      });
    }

    if (contentLower.includes('authentication') || contentLower.includes('security') || contentLower.includes('user')) {
      references.push({
        id: 'ref-auth-1',
        title: 'HTTP Basic Authentication Implementation',
        source: 'Security Documentation',
        url: '/docs/authentication',
        excerpt: 'RESTful endpoints TM product secured HTTP Basic Authentication leverage TM user management...',
        relevanceScore: 0.82,
        type: 'security'
      });
    }

    if (contentLower.includes('json') || contentLower.includes('format') || contentLower.includes('response')) {
      references.push({
        id: 'ref-json-1',
        title: 'API Response Format Specification',
        source: 'API Reference',
        url: '/docs/api-response-format',
        excerpt: 'The API return data JSON format. The format requested based HTTP except header...',
        relevanceScore: 0.75,
        type: 'reference'
      });
    }

    // Always add at least one reference for demo purposes
    if (references.length === 0) {
      references.push({
        id: 'ref-general-1',
        title: 'Teams Copilot Documentation',
        source: 'User Guide',
        url: '/docs/teams-copilot-guide',
        excerpt: 'Comprehensive guide for using Teams Copilot and its various features...',
        relevanceScore: 0.70,
        type: 'guide'
      });
    }

    return { images, references };
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

    if (input.trim().toLowerCase() === "new session") {
      // Trigger new chat
      const newChat = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [
          {
            id: (Date.now() + 1).toString(),
            content: "New session started.",
            role: "assistant",
            timestamp: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setChats((prev) => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setInput("");
      return;
    }

    if (input.trim().toLowerCase() === "switch version") {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: "__version_selection__",
        role: "assistant",
        timestamp: new Date(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, userMessage, aiMessage],
                updatedAt: new Date(),
              }
            : chat
        )
      );

      setInput("");
      return;
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              title:
                chat.messages.length === 0
                  ? input.trim().slice(0, 50) +
                    (input.trim().length > 50 ? "..." : "")
                  : chat.title,
              updatedAt: new Date(),
            }
          : chat
      )
    );

    setInput("");
    setIsGenerating(true);

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);
    console.log("ENV CHECK:", {
      SELECTED_PROJECT: process.env.REACT_APP_SELECTED_PROJECT,
      CLIENT: process.env.REACT_APP_CLIENT,
      TRACE_ID: process.env.REACT_APP_TRACE_ID,
    });


    try {
      const currentChatMessages =
        chats.find((c) => c.id === chatId)?.messages || [];

      const ENV_PROJECT = process.env.REACT_APP_SELECTED_PROJECT;
      const ENV_CLIENT = process.env.REACT_APP_CLIENT;
      const TRACE_ID = process.env.REACT_APP_TRACE_ID;

      const lastAssistantMessage = [...currentChatMessages]
        .reverse()
        .find((msg) => msg.role === "assistant");

      const payload = {
        message: input.trim(),
        selected_project: ENV_PROJECT,
        project_version: project_version,
        user_details: {
          user_id: "user123",
          user_objectid: "objectid123",
        },
        client: ENV_CLIENT,
        messages: lastAssistantMessage ? [lastAssistantMessage] : [],
        trace_id: TRACE_ID,
      };

      console.log("🚀 Final Payload to Backend:", payload);

      const response = await fetch("http://localhost:3001/api/llama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok)
        throw new Error(
          (await response.json()).error || `HTTP ${response.status}`
        );

      const data = await response.json();
      let aiContent = data.choices?.[0]?.message?.content || 'Sorry, I received an empty response.';
      
      // For demo purposes, add some image references to responses about APIs or technical topics
      if (aiContent.toLowerCase().includes('api') || aiContent.toLowerCase().includes('rest') || aiContent.toLowerCase().includes('endpoint')) {
        aiContent += '\n\nHere are some relevant diagrams: aidn_000 aidn_001';
      }
      
      // Parse the response for images and references
      const { images, references } = parseRAGResponse(aiContent);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        role: 'assistant',
        timestamp: new Date(),
        images: images,
        references: references
      };

      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, aiMessage], updatedAt: new Date() }
          : chat
      ));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const abortMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Response generation was stopped.',
          role: 'assistant',
          timestamp: new Date(),
          images: [],
          references: []
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
          timestamp: new Date(),
          images: [],
          references: []
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


    useEffect(() => {
    const handler = (e) => {
      const selectedVersion = e.detail;
      setProjectVersion(selectedVersion);
      console.log("✅ Version changed to:", selectedVersion);

      const versionMessage = {
        id: (Date.now() + 1).toString(),
        content: `Version has been switched to ${selectedVersion}`,
        role: "assistant",
        timestamp: new Date(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [...chat.messages, versionMessage],
                updatedAt: new Date(),
              }
            : chat
        )
      );
    };

    window.addEventListener("version-selected", handler);
    return () => window.removeEventListener("version-selected", handler);
  }, [currentChatId]);



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
                    {isGenerating ? <Square className="w-4 h-4" /> : <SendHorizontal className="w-4 h-4" />}
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

        <div className="view-prompts-container right-4 sm:right-6 md:right-8 lg:right-16 xl:right-24 2xl:right-30 bottom-[6.8rem] z-20 absolute">
          <div className="relative group z-30">
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="view-prompts-button inline-flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              View Prompts
            </button>

            {showDropdown && (
              <div className="view-prompts-menu absolute bottom-full mb-2 w-56 bg-white border border-gray-200 rounded-md shadow-md z-40">
                {options.map((option) => (
                  <div
                    key={option.heading}
                    onClick={() => handleSelect(option.heading)}
                    className="view-prompts-item"
                  >
                    <div className="font-semibold text-sm">
                      {option.heading}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  {isGenerating ? <Square className="w-4 h-4" /> : <SendHorizontal className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* References Panel */}
      <ReferencesPanel
        isOpen={isReferencesOpen}
        references={selectedMessageReferences?.references || []}
        onClose={closeReferences}
      />
    </div>
  );
}

export default App;