import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SendHorizontal, Plus, MessageSquare, Sparkles, Menu, Square, Monitor, Smartphone, Globe, ChevronDown, Settings, Dna, Asterisk } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import ChatMessage from './ChatMessage';
import ProfileMenu from './ProfileMenu'; 
import ReferencesPanel from './ReferencesPanel'; // Using App1.js path
import CompanyLogo from '../assets/dn_logo.png'; 


const ENV_PROJECT = process.env.REACT_APP_SELECTED_PROJECT;
const ENV_CLIENT = process.env.REACT_APP_CLIENT;
const API_BASE = process.env.REACT_APP_API_URL;
const DUMMY_URL = process.env.REACT_APP_DUMMY_URL; // Re-declare or ensure available

// VERSIONS_AVAILABLE from App1.js (renamed from AI_MODELS)
const VERSIONS_AVAILABLE = [
  { id: 'v4.2', name: 'v4.2' },
  { id: 'v4.1', name: 'v4.1' },
  { id: 'v4.1_maintenance', name: 'v4.1 Maintenance' },
  { id: 'v4.0', name: 'v4.0' },
  { id: 'v4.0_maintenance', name: 'v4.0 Maintenance' },
  { id: 'v3.4', name: 'v3.4' },
  { id: 'v3.4_maintenance', name: 'v3.4 Maintenance' }
];

// DeleteIcon component from App2.js (though not explicitly used in the final JSX)
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Simplified platform detection from App1.js
const detectPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();

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

// Platform indicator component from App1.js
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

// Compact Version Selector Component from App1.js (props updated)
const CompactVersionSelector = ({ selectedProjectVersion, onProjectVersionChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyles, setDropdownStyles] = useState({});
  const [openDirection, setOpenDirection] = useState('bottom'); // Kept for logic, but not directly used in styling here
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 240; // estimated height of dropdown

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const shouldOpenAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

      setOpenDirection(shouldOpenAbove ? 'top' : 'bottom'); // State kept for potential future styling

      setDropdownStyles({
        position: 'absolute',
        top: shouldOpenAbove
          ? rect.top + window.scrollY - dropdownHeight - 8
          : rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 99999
      });
    }
  }, [isOpen]);

  const selectedVersionData = VERSIONS_AVAILABLE.find((v) => v.id === selectedProjectVersion) || VERSIONS_AVAILABLE[0];

  return (
    <>
      <div className="relative w-full" ref={buttonRef}>
        <button
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          className={`w-full flex items-center justify-between gap-1 px-3 py-1 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          title={`Current version: ${selectedVersionData.name}`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700 truncate max-w-[120px]">{selectedVersionData.name}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyles}
            className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-[240px] overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-2 py-1">Select Project Version</div>
              {VERSIONS_AVAILABLE.map((version) => (
                <button
                  key={version.id}
                  onClick={() => {
                    onProjectVersionChange(version.id);
                    console.log('Version changed to:', version.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                    selectedProjectVersion === version.id ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <div className="font-medium text-sm">{version.name}</div>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

function App({account,logout}) { // Merged App and ChatApp signatures
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [hasResetToLanding, setHasResetToLanding] = useState(false); // From App2, but renamed to hasResetToLanding for clarity
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [selectedMessageReferences, setSelectedMessageReferences] = useState(null);
  const [abortController, setAbortController] = useState(null);

  // Consolidated state for project version, initialized to 'v4.2'
  const [selectedProjectVersion, setSelectedProjectVersion] = useState('v4.2');
  const [traceId, setTraceId] = useState(''); // From App2.js

  // From App2.js, related to ProfileMenu dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const referencePanelRef = useRef(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const showLanding = !currentChatId;
  const platformInfo = detectPlatform(); // From App1.js

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const closeReferences = useCallback(() => {
    setIsReferencesOpen(false);
    setSelectedMessageReferences(null);
  }, []);

  // Handle click outside to close references panel (Combined from both, logic is similar)
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

  // Combined and optimized localStorage operations (Prioritizing App2.js's robust logic, adding App1.js's selectedModel)
  useEffect(() => {
    if (!account) {
        setCurrentChatId(null);
        sessionStorage.removeItem('hasVisited');
        return;
    }

    const isFirstLoadOfSession = sessionStorage.getItem("hasVisited") !== "true";

    try {
      const savedChats = localStorage.getItem('teams-copilot-chats');
      const savedCurrentChatId = localStorage.getItem('teams-copilot-current-chat');
      const savedSidebarState = localStorage.getItem('teams-copilot-sidebar-collapsed');
      const savedProjectVersion = localStorage.getItem('teams-copilot-selected-project-version'); // Updated key

      if (savedChats) {
        const parsedChats = JSON.parse(savedChats).map(chat => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        }));
        setChats(parsedChats);

        if (isFirstLoadOfSession) {
          setCurrentChatId(null);
        } else {
          if (savedCurrentChatId && parsedChats.find(c => c.id === savedCurrentChatId)) {
            setCurrentChatId(savedCurrentChatId);
          } else {
            setCurrentChatId(null);
          }
        }
      } else {
        setCurrentChatId(null);
      }

      if (savedSidebarState) {
        setIsSidebarCollapsed(JSON.parse(savedSidebarState));
      }
      if (savedProjectVersion) { // Set saved version
        setSelectedProjectVersion(savedProjectVersion);
      }
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      setCurrentChatId(null);
    }

    setHasInitialized(true);
    if (account) {
        sessionStorage.setItem('hasVisited', 'true');
    }
  }, [account]);

  // Debounced localStorage saves (Combined from both)
  useEffect(() => {
    if (hasInitialized) {
      const timer = setTimeout(() => {
        localStorage.setItem('teams-copilot-chats', JSON.stringify(chats));
        localStorage.setItem('teams-copilot-selected-project-version', selectedProjectVersion); // Updated key
        localStorage.setItem('teams-copilot-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
        if (currentChatId) {
          localStorage.setItem('teams-copilot-current-chat', currentChatId);
        } else {
          localStorage.removeItem('teams-copilot-current-chat');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [chats, selectedProjectVersion, isSidebarCollapsed, currentChatId, hasInitialized]);

  // Handle outside click for ProfileMenu dropdown (from App2.js)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Merged parseRAGResponse - prioritized App2.js's robust logic with DUMMY_URL and source_documents,
  // also integrated image handling from both
  const parseRAGResponse = useCallback((content, sourceDocuments) => {
    const images = [];
    let references = [];

    // Extract image references (common logic from both)
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

    // Process source_documents if available (from App2.js)
    const DUMMY_URL = process.env.REACT_APP_DUMMY_URL;

try {
  if (sourceDocuments) {
    if (typeof sourceDocuments === "string") {
      sourceDocuments = JSON.parse(sourceDocuments);
    }

    if (Array.isArray(sourceDocuments)) {
      references = sourceDocuments.map((doc, index) => {
        const metadata = doc.metadata || {};
        return {
          id: `ref-${index + 1}`,
          title: metadata["Header 1"] || "Reference Document",
          source: metadata.source || "Unknown Source",
          url: metadata.url || `${DUMMY_URL}?doc=${encodeURIComponent(metadata.source || 'unknown')}`,
          excerpt: doc.page_content || "",
          relevanceScore: parseFloat(doc.relevance_score || metadata.score || 0.75),
          type: "document"
        };
      });
    }
  }
} catch (e) {
  console.warn("⚠️ Failed to parse source_documents:", e);
  references = [];
}


    // Fallback/additional mock references if none from source_documents (from App1.js)
    if (references.length === 0) {
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
    }

    return { images, references };
  }, []);


  // Merged sendMessage logic
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

      const lastAssistantMessage = [...currentChatMessages]
        .reverse()
        .find((msg) => msg.role === "assistant");


      const payload = {
        message: input.trim(),
        // selected_project: ENV_PROJECT,
        // selected_version: selectedProjectVersion,
        user_details: {
          user_id: account?.id || "user123", // Using actual account info if available
          user_objectid: account?.oid || "objectid123",
        },
        client: platformInfo.icon,
        messages: lastAssistantMessage ? [lastAssistantMessage] : [],
        trace_id: '',
      };

      console.log("🚀 Final Payload to Backend:", payload);

      const response = await fetch(`${API_BASE}/chat/${ENV_PROJECT}/${selectedProjectVersion}`, { // Using App2.js API endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error((await response.json()).error || `HTTP ${response.status}`);

      const data = await response.json();
      let aiContent = data.answer || data.choices?.[0]?.message?.content || 'Sorry, I received an empty response.'; // Combined response parsing
      if (data.traceid){
        console.log(aiContent);
        setTraceId(data.traceid);
        console.log("Trace Id noted: ", data.traceid); // Log the new trace ID
      }


      // Parse references using the combined logic
      const { images, references } = parseRAGResponse(aiContent, data.source_documents);

      const assistantId = (Date.now() + 1).toString();

      let newMessage = {
        id: assistantId,
        content: aiContent, // Start empty for typing animation
        role: 'assistant',
        timestamp: new Date(),
        images,
        references,
        model: selectedProjectVersion // Added version to message
      };

      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, newMessage], updatedAt: new Date() }
          : chat
      ));

      // Simulate typing animation from App2.js
      // let index = 0;
      // const typeNextChar = () => {
      //   setChats(prev => prev.map(chat => {
      //     if (chat.id !== chatId) return chat;

      //     const updatedMessages = chat.messages.map(msg => {
      //       if (msg.id !== assistantId) return msg;

      //       return {
      //         ...msg,
      //         content: aiContent.slice(0, index + 1)
      //       };
      //     });

      //     return {
      //       ...chat,
      //       messages: updatedMessages,
      //       updatedAt: new Date()
      //     };
      //   }));

      //   index++;

      //   if (index < aiContent.length) {
      //     setTimeout(typeNextChar, 12); // adjust typing speed here (ms per char)
      //   }
      // };
      // typeNextChar();
      scrollToBottom();

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
  }, [input, isGenerating, currentChatId, chats, generateChatTitle, parseRAGResponse, selectedProjectVersion, platformInfo, account]);


  // Event listener for 'version-selected' from App2.js (updated to use selectedProjectVersion)
  useEffect(() => {
    const handler = (e) => {
      const selectedVersion = e.detail;
      setSelectedProjectVersion(selectedVersion);
      console.log("✅ Version changed to:", selectedVersion);

      // This message should be added to the current chat
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


  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      isGenerating ? stopGeneration() : sendMessage();
    }
  }, [isGenerating, stopGeneration, sendMessage]);

  // Combined handleTextareaInput to include platform-specific max-height from App1.js
  const handleTextareaInput = useCallback((e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, platformInfo.isTeams ? 32 : 96) + 'px'; // Max height 32px for Teams (2 lines) and 96px for web (6 lines based on App2.js)
  }, [platformInfo.isTeams]);

  // Landing page rendering (Combined from both, prioritizing App1.js structure and styling for landing)
  if (showLanding) {
    return (
      <div className={`min-h-screen max-h-screen flex overflow-hidden ${
        platformInfo.isTeams ? 'bg-white' : 'bg-gradient-to-br from-slate-50 to-blue-50'
      }`}>
        <ProfileMenu account={account} logout={logout}/> {/* From App2.js */}
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
          platformInfo.isTeams ? 'pt-12' : '' // From App1.js
        }`}>
          <div className="w-full max-w-xl mx-auto">

<div className="text-center mb-8">
    {/* Logo */}
    <div className="inline-flex items-center justify-center mb-4">
        <img
            src={CompanyLogo}
            alt="Company Logo"
            className="w-24 sm:w-32 md:w-40 object-contain mx-auto drop-shadow-md"
        />
    </div>


    {/* Welcome Message */}
    <p className="text-gray-600 text-sm sm:text-base">
        Hello {account?.name || "Guest"}! Welcome to <span className="font-semibold">AI-DN {ENV_PROJECT}</span>.
    </p>
</div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 p-3">
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
                    selectedProjectVersion={selectedProjectVersion}
                    onProjectVersionChange={setSelectedProjectVersion}
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

            <div className="text-center mt-3">
              <p className="text-xs text-gray-400">
                {isGenerating
                  ? "AI is generating a response..."
                  : ""
                }
              </p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Chat interface rendering (Combined from both)
  return (
    <div className={`min-h-screen max-h-screen flex overflow-hidden ${
      platformInfo.isTeams ? 'bg-white' : 'bg-gray-50' // Used gray-50 from App2, if not Teams
    } relative`}> {/* Added relative from App2 */}

      <ProfileMenu account={account} logout={logout}/> {/* From App2.js */}

      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isTeams={platformInfo.isTeams} // From App1.js
      />

      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ${
        isReferencesOpen ? 'mr-80' : ''
      }`}>

        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0"> {/* Adjusted py-4 from App1.js, px-4 from App2.js */}
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
            <div className="space-y-6 max-w-4xl mx-auto"> {/* Adjusted space-y-6 and max-w-4xl from App1.js */}
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
                    model: selectedProjectVersion // Added version to message
                  }}
                  isGenerating={true}
                  onReferencesClick={handleReferencesToggle}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Smaller input area, combined from both with platform-specific styles */}
        <div className={`bg-white border-t border-gray-200 flex-shrink-0 ${
          platformInfo.isTeams ? 'px-3 py-2' : 'px-4 py-3'
        }`}>
          <div className="max-w-4xl mx-auto">
            <div className={`bg-gray-50 rounded-lg border border-gray-200 overflow-hidden ${
              platformInfo.isTeams ? 'rounded-md' : ''
            }`}>
              <div className={`flex items-center gap-2 ${
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
                    platformInfo.isTeams ? 'max-h-12 text-xs' : 'max-h-24 text-sm' // Max height 24 from App2, but min-h is 20 for Teams
                  }`}
                  rows={1}
                  onInput={handleTextareaInput}
                />
                <div className="flex items-center gap-2">
                  <div className={platformInfo.isTeams ? 'max-w-[150px]' : 'max-w-xs'}>
                    <CompactVersionSelector
                      selectedProjectVersion={selectedProjectVersion}
                      onProjectVersionChange={setSelectedProjectVersion}
                      disabled={isGenerating}
                    />
                  </div>
                  <button
                    onClick={isGenerating ? stopGeneration : sendMessage}
                    disabled={!isGenerating && !input.trim()}
                    className={`flex items-center justify-center text-white rounded-md transition-all duration-200 flex-shrink-0 ${
                      platformInfo.isTeams
                        ? 'w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                        : 'w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed' // From App2 w-8 h-8
                    } ${
                      isGenerating
                        ? 'bg-red-600 hover:bg-red-700'
                        : ''
                    }`}
                  >
                    {isGenerating ? (
                      <Square className={platformInfo.isTeams ? "w-3 h-3" : "w-4 h-4"} /> // Changed to w-4 h-4 from App2
                    ) : (
                      <SendHorizontal className={platformInfo.isTeams ? "w-3 h-3" : "w-4 h-4"} /> // Changed to w-4 h-4 from App2
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom status bar with platform info - centered disclaimer */}
            <div className={`flex items-center justify-between ${
              platformInfo.isTeams ? 'mt-1' : 'mt-2'
            }`}>
              {/* <div className="w-20">
                <PlatformIndicator platform={platformInfo} />
              </div> */}
              <div className="flex-1 text-center">
                <p className={`text-gray-400 ${
                  platformInfo.isTeams ? 'text-[10px]' : 'text-xs'
                }`}>
                  {isGenerating
                    ? "AI is generating a response..."
                    : ""
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



