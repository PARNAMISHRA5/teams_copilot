import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SendHorizontal, Plus, MessageSquare, Sparkles, Menu, Square, Monitor, Smartphone, Globe, ChevronDown, Settings, Dna, Asterisk, HelpCircle, MessageCircle, Trash } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import ChatMessage from './ChatMessage';
import ProfileMenu from './ProfileMenu';
import ReferencesPanel from './ReferencesPanel'; // Using App1.js path
import CompanyLogo from '../assets/DBD_BIG.png';
import WarningError from './WarningError';
import { ERROR_MESSAGES } from './ErrorMessages';
import { getNewToken } from '../utils/authUtils';
import SuggestionCards, { cleanSuggestionsFromContent } from './SuggestionCards';



const ENV_PROJECT = process.env.REACT_APP_SELECTED_PROJECT;
const ENV_CLIENT = process.env.REACT_APP_CLIENT;
const API_BASE = process.env.REACT_APP_API_URL;
const DUMMY_URL = process.env.REACT_APP_DUMMY_URL; // Re-declare or ensure available
const DB_API_BASE = process.env.REACT_APP_API_URL; // Added DB_API_BASE
const MEMORY_SHOT = parseInt(process.env.REACT_APP_MEMORY_SHOT);
const CHAT_MESSAGE_LIMIT =parseInt(process.env.REACT_APP_CHAT_MESSAGE_LIMIT);
const CONVERSATION_MESSAGE_LIMIT =parseInt(process.env.REACT_APP_CONVERSATION_LIMIT);



// VERSIONS_AVAILABLE from App1.js (renamed from AI_MODELS)
// VERSIONS_AVAILABLE from App1.js (renamed from AI_MODELS)
// Replace the existing VERSIONS_AVAILABLE array with this:
// Replace the existing getVersionsFromEnv function with this improved version:


const getVersionsFromEnv = () => {
  const versionsString = process.env.REACT_APP_AVAILABLE_VERSIONS;
  
  // console.log('Raw environment variable:', versionsString);
  
  if (!versionsString || versionsString.trim() === '') {
    console.log('No versions string found, returning empty array');
    return [];
  }
  
  try {
    // Clean the string by removing line breaks, extra spaces, and fix common formatting issues
    let cleanedString = versionsString.replace(/\s+/g, ' ').trim();
    
    // Ensure the string is properly closed if it's missing the closing bracket
    if (cleanedString.startsWith('[') && !cleanedString.endsWith(']')) {
      cleanedString += ']';
    }
    
    // console.log('Cleaned string:', cleanedString);
    
    // Parse as JSON
    const parsed = JSON.parse(cleanedString);
    // console.log('Parsed JSON:', parsed);
    
    // Ensure it's an array
    if (!Array.isArray(parsed)) {
      console.warn('Parsed versions is not an array:', parsed);
      return [];
    }
    
    // Map to the expected format
    const result = parsed.map(item => {
      if (!item.id || !item.version) {
        console.warn('Invalid version item:', item);
        return null;
      }
      return {
        id: item.id,
        name: item.version // Map 'version' field to 'name' for consistency
      };
    }).filter(Boolean); // Remove null entries
    
    // console.log('Final result:', result);
    return result;
    
  } catch (error) {
    console.error('Error parsing REACT_APP_AVAILABLE_VERSIONS:', error);
    console.error('Raw string that failed:', versionsString);
    
    // Fallback: try to extract versions manually if JSON parsing fails
    try {
      const matches = versionsString.match(/"id":"([^"]+)","version":"([^"]+)"/g);
      if (matches) {
        const fallbackResult = matches.map(match => {
          const [, id, version] = match.match(/"id":"([^"]+)","version":"([^"]+)"/);
          return { id, name: version };
        });
        console.log('Fallback parsing result:', fallbackResult);
        return fallbackResult;
      }
    } catch (fallbackError) {
      console.error('Fallback parsing also failed:', fallbackError);
    }
    
    return [];
  }
};
const VERSIONS_AVAILABLE = getVersionsFromEnv();
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
            <span className="font-medium text-gray-700 truncate max-w-[120px]">
              {selectedVersionData.name}
            </span>
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
            className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-[240px] overflow-y-auto custom-scrollbar"
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
function App({token,setToken,account,logout,refreshtoken,msalinstance}) { // Merged App and ChatApp signatures
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
  const [isLoadingMessages, setIsLoadingMessages] = useState(false); // New state for message loading
  const [justCreatedNewChat, setJustCreatedNewChat] = useState(false); // New state to prevent immediate message fetch on new chat
  const [showInputSuggestions, setShowInputSuggestions] = useState(true);
  const [inputSuggestions, setInputSuggestions] = useState([]);
  const [chatLimitExceeded, setChatLimitExceeded] = useState(false);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [oldestChatToDelete, setOldestChatToDelete] = useState(false);
  // Consolidated state for project version, initialized to 'v4.2'
  const [selectedProjectVersion, setSelectedProjectVersion] = useState('v4.2');
  const [traceId, setTraceId] = useState(''); // From App2.js

  // From App2.js, related to ProfileMenu dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [lastAiResponse, setLastAiResponse] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const referencePanelRef = useRef(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const showLanding = !currentChatId;
  const platformInfo = detectPlatform(); // From App1.js


const [alertMessage, setAlertMessage] = useState('')
const [alertType, setAlertType] = useState('');
const [alertVisible, setAlertVisible] = useState(false);

const showAlert = (message, type = 'success', duration = 3000) => {
  setAlertMessage(message);
  setAlertType(type);
  setAlertVisible(true);

  setTimeout(() => {
    setAlertVisible(false);
  }, duration);
};

 console.log()
  // const scrollToBottom = useCallback(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, []);
  const scrollToBottom = useCallback(() => {
    const container = messagesEndRef.current?.parentNode;
    if (!container) return;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 5; // tighter threshold
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

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
  }, [isReferencesOpen, selectedMessageReferences?.messageId, closeReferences]);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentChatId]);

  // Handle logout and initial hasInitialized state
  useEffect(() => {
    if (!account) {
        setCurrentChatId(null);
        sessionStorage.removeItem('hasVisited'); // Clear 'hasVisited' on logout
        sessionStorage.removeItem('lastActiveChatId'); // Clear last active chat on logout
    }
    // Set a default project version if none is explicitly set
    setSelectedProjectVersion('v4.2');
    setHasInitialized(true);
  }, [account]);

  // Removed debounced localStorage saves
  useEffect(() => {
    // This useEffect previously handled localStorage saves.
    // Since localStorage is removed, this effect is no longer needed.
    // Data persistence is now handled by the database API calls.
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

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
    setShowInputSuggestions(!e.target.value.trim());
  }, []);

  /**
   * Handles toggling the references panel. If references for the selected message
   * are not already loaded, it fetches them from the new endpoint.
   */
  const handleReferencesToggle = useCallback(async (messageId) => {
    if (isReferencesOpen && selectedMessageReferences?.messageId === messageId) {
      closeReferences();
      return;
    }

    const chat = chats.find(c => c.id === currentChatId);
    const message = chat?.messages.find(m => m.id === messageId);

    if (!message) return;

    if (message.references) {
      setSelectedMessageReferences({ messageId, references: message.references });
      setIsReferencesOpen(true);
    } else {
      try {
        const numericMessageId = messageId.split('-')[0];
        const response = await fetch(`${DB_API_BASE}/chat-history/messages/${numericMessageId}/reference?project_id=${ENV_PROJECT}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
          showAlert('Could not load references.', 'error');
          throw new Error('Failed to fetch references');
        }

        const data = await response.json();
        
        let fetchedReferences = [];
        if (data.reference_text) {
          try {
            fetchedReferences = JSON.parse(data.reference_text);
          } catch (e) {
            console.error("Failed to parse reference_text JSON:", e);
          }
        }
        
        if (fetchedReferences.length === 0) {
          showAlert('No references found for this message.', 'info');
          return;
        }

        setChats(prevChats => prevChats.map(c =>
          c.id === currentChatId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === messageId
                    ? { ...m, references: fetchedReferences }
                    : m
                )
              }
            : c
        ));

        setSelectedMessageReferences({ messageId, references: fetchedReferences });
        setIsReferencesOpen(true);

      } catch (error) {
        console.error("Error fetching references:", error);
      }
    }
  }, [isReferencesOpen, selectedMessageReferences, currentChatId, chats, token, closeReferences]);


  const createNewChat = useCallback(async () => { // Made async to await API call
    const conversationCreationTime = new Date().toISOString(); // Get current timestamp in ISO format
    setChatLimitExceeded(false);
    if (chats.length >= CONVERSATION_MESSAGE_LIMIT) {
      const oldestChat = [...chats].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
      setOldestChatToDelete(oldestChat);
      setShowLimitPopup(true);
      return;
    }

    try {
      const response = await fetch(`${DB_API_BASE}/chat-history/conversations?project_id=${ENV_PROJECT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Assuming 'token' is available in scope
        },
        body: JSON.stringify({ conversation_creation_time: conversationCreationTime }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handling 401 Error
        if (response.status === 401) {
          console.log("INFO: 401 Unauthorized error detected. Attempting to get new token.");
          try {
            const newToken = await getNewToken(refreshtoken,msalinstance);
            setToken(newToken); 
            window.location.reload(); // Refresh the entire page to apply new token and re-fetch data
            return;
          } catch (tokenError) {
            console.error("ERROR: Failed to get new token:", tokenError);
            // Optionally, show a specific error message if token refresh fails
            showAlert("Authentication expired. Please log in again.", 'error');
            return;
          }
        }

        // For other non-OK responses (e.g., 400, 403, 404, 500)
        const errorMessage = ERROR_MESSAGES[response.status] || ERROR_MESSAGES.DEFAULT;
        showAlert(errorMessage, 'error'); // Pass the fetched error message


        throw new Error(`Failed to create conversation: ${errorData.detail?.[0]?.msg || response.statusText}`);
      }

      // Assuming the API returns the conversation ID directly as a string or number
      const responseData = await response.json();
      let conversationId;
      if (typeof responseData === 'string' || typeof responseData === 'number') {
        conversationId = responseData; // API returns a plain string/number ID
      } else if (responseData && typeof responseData === 'object' && responseData.conversation_id) {
        conversationId = responseData.conversation_id; // API returns an object with conversation_id
      } else {
        throw new Error("API did not return a valid conversation_id.");
      }

      // console.log("DEBUG: New conversation created. API response:", conversationId);

      const newChat = {
        id: String(conversationId), // Ensure ID is a string for local state consistency
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      sessionStorage.setItem('lastActiveChatId', newChat.id); // Explicitly save new chat as last active
      setJustCreatedNewChat(true); // Set flag to prevent immediate message fetch
      setInputSuggestions([]);
      setShowInputSuggestions(false);

// setIsLoadingMessages(false);
// console.log("DEBUG: New chat added to state and set as current. Chat ID:", newChat.id);
      // setIsLoadingMessages(false);
      // console.log("DEBUG: New chat added to state and set as current. Chat ID:", newChat.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
      if (!error.message.includes("Failed to get new token") && !error.message.includes("Authentication expired")) {
          showAlert(ERROR_MESSAGES.DEFAULT, 'error');
      }
    }
  }, [token, chats]); // Added token to dependencies

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

  const deleteChat = useCallback(async (chatId) => { 
    try {
      // API call to delete the conversation from the database
      const response = await fetch(`${DB_API_BASE}/chat-history/conversations?project_id=${ENV_PROJECT}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ conversation_id: parseInt(chatId, 10) }), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handling 401 Error
        if (response.status === 401) {
          console.log("INFO: 401 Unauthorized error detected. Attempting to get new token.");
          try {
            const newToken = await getNewToken(refreshtoken,msalinstance);
            setToken(newToken); 
            // console.log("DEBUG: New token received and set. Reloading screen.");
            window.location.reload(); // Refresh the entire page to apply new token and re-fetch data
            return;
          } catch (tokenError) {
            console.error("ERROR: Failed to get new token:", tokenError);
            // Optionally, show a specific error message if token refresh fails
            showAlert("Authentication expired. Please log in again.", 'error');
            return;
          }
        }

        // For other non-OK responses (e.g., 400, 403, 404, 500)
        const errorMessage = ERROR_MESSAGES[response.status] || ERROR_MESSAGES.DEFAULT;
        showAlert(errorMessage, 'error'); // Pass the fetched error message

        
        throw new Error(`Failed to delete conversation: ${errorData.detail?.[0]?.msg || response.statusText}`);
      }

      // If the API call is successful, update the local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        sessionStorage.removeItem('lastActiveChatId'); // Clear if deleted chat was active
      }
      // console.log(`DEBUG: Conversation ID ${chatId} deleted successfully from DB and local state.`);

    } catch (error) {
      console.error('ERROR: Error deleting conversation:', error);
      if (!error.message.includes("Failed to get new token") && !error.message.includes("Authentication expired")) {
          showAlert(ERROR_MESSAGES.DEFAULT, 'error');
      }
      
    }
  }, [currentChatId, token, DB_API_BASE, ENV_PROJECT]); 

  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsGenerating(false);
      // console.log("DEBUG: Generation stopped by user.");
    }
  }, [abortController]);

  // Merged parseRAGResponse - prioritized App2.js's robust logic with DUMMY_URL and source_documents,
  // also integrated image handling from both
  const parseRAGResponse = useCallback((content, sourceDocuments) => {
    const images = [];
    let references = [];
    
    // Use the centralized cleaning function from SuggestionCards
    const cleanedContent = cleanSuggestionsFromContent(content);
    
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

    // Fallback references logic...
    if (references.length === 0) {
      const contentLower = cleanedContent.toLowerCase();
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

    return { images, references, cleanedContent };
  }, []);

  // Function to rename a conversation
  const renameConversation = useCallback(async (conversationId, newName) => {
    if (!token || !conversationId || !newName.trim()) {
      console.warn("WARN: Cannot rename conversation. Missing token, ID, or new name.");
      return;
    }

    const payload = {
      conversation_id: parseInt(conversationId, 10), // Ensure ID is integer for API
      conversation_name: newName.trim()
    };

    // console.log(`DEBUG: Attempting to rename conversation ID ${conversationId} to "${newName}"`);
    // console.log("DEBUG: Rename API URL:", `${DB_API_BASE}/chat-history/conversations/name?project_id=${ENV_PROJECT}`);
    // console.log("DEBUG: Rename API Payload:", payload);
    // console.log("DEBUG: Rename API Token (first 10 chars):", token ? token.substring(0, 10) + '...' : 'N/A');

    try {
      const response = await fetch(`${DB_API_BASE}/chat-history/conversations/name?project_id=${ENV_PROJECT}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
       
        // Handling 401 Error
        if (response.status === 401) {
          console.log("INFO: 401 Unauthorized error detected. Attempting to get new token.");
          try {
            const newToken = await getNewToken(refreshtoken,msalinstance);
            setToken(newToken); 
            // console.log("DEBUG: New token received and set. Reloading screen.");
            window.location.reload(); // Refresh the entire page to apply new token and re-fetch data
            return;
          } catch (tokenError) {
            console.error("ERROR: Failed to get new token:", tokenError);
            // Optionally, show a specific error message if token refresh fails
            showAlert("Authentication expired. Please log in again.", 'error');
            return;
          }
        }

        // For other non-OK responses (e.g., 400, 403, 404, 500)
        const errorMessage = ERROR_MESSAGES[response.status] || ERROR_MESSAGES.DEFAULT;
        showAlert(errorMessage, 'error'); // Pass the fetched error message


        console.error('ERROR: Failed to rename conversation API response:', errorData);
        throw new Error(`Failed to rename conversation: ${errorData.detail?.[0]?.msg || response.statusText}`);
      }

      // Updated to match the new response schema
      const responseData = await response.json();
      // console.log("DEBUG: Conversation rename successful (API response):", responseData);

      // Update the local state to reflect the new name
      setChats(prevChats => prevChats.map(chat =>
        chat.id === conversationId
          ? { ...chat, title: newName.trim(), updatedAt: new Date() }
          : chat
      ));
      // console.log(`DEBUG: Conversation ID ${conversationId} renamed to "${newName}" in local state.`);

    } catch (error) {
      console.error('ERROR: Error renaming conversation during fetch:', error);
      if (!error.message.includes("Failed to get new token") && !error.message.includes("Authentication expired")) {
        showAlert(ERROR_MESSAGES.DEFAULT, 'error');
      }
    }
  }, [token]);


  // Merged sendMessage logic
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isGenerating || (currentChat?.messages.length>= CHAT_MESSAGE_LIMIT ))
      {
        setChatLimitExceeded(true);
        setInput('');
      return;
      }

    let currentInput = input.trim(); // Capture input early
    setInput(''); // Clear input immediately for better UX
    setIsGenerating(true); // Start generation animation immediately

    let chatId = currentChatId;
    const userMessageTime = new Date().toISOString();
    let userMessageId = Date.now().toString(); // Temporary frontend ID for user message

    // Create the user message object
    const userMessage = {
      id: userMessageId,
      content: currentInput,
      role: 'user',
      timestamp: new Date(),
      conversation_id: chatId // Will be updated if new chat is created
    };

    let finalChatId = chatId;
    let initialChatTitle = 'New Chat';
    let shouldRenameDb = false;

    // If no current chat, create one
    if (!chatId) {
      // console.log("SEND_MESSAGE: No current chat ID. Attempting to create new conversation.");
      const conversationCreationTime = new Date().toISOString();
      try {
        const response = await fetch(`${DB_API_BASE}/chat-history/conversations?project_id=${ENV_PROJECT}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ conversation_creation_time: conversationCreationTime }),
        });

        if (!response.ok) { 
          const errorData = await response.json();
          if (response.status === 401) {
            console.log("INFO: 401 Unauthorized error detected. Attempting to get new token.");
            try {
              const newToken = await getNewToken(refreshtoken,msalinstance);
              setToken(newToken); 
              // console.log("DEBUG: New token received and set. Reloading screen.");
              window.location.reload(); 
              return;
            } catch (tokenError) {
              console.error("ERROR: Failed to get new token:", tokenError);
              showAlert("Authentication expired. Please log in again.", 'error');
              return;
            }
          }
          const errorMessage = ERROR_MESSAGES[response.status] || ERROR_MESSAGES.DEFAULT;
          showAlert(errorMessage, 'error'); 
          throw new Error(`Failed to create conversation: ${errorData.detail?.[0]?.msg || response.statusText}`); 
        }

        const responseData = await response.json();
        let newConversationId = responseData.conversation_id || responseData;
        
        finalChatId = String(newConversationId); // Use the new ID
        initialChatTitle = generateChatTitle({ messages: [{ role: 'user', content: currentInput }] });
        shouldRenameDb = true; // Flag to rename in DB after creation

        // Update currentChatId state and justCreatedNewChat flag
        setCurrentChatId(finalChatId);
        sessionStorage.setItem('lastActiveChatId', finalChatId); // Explicitly save new chat as last active
        setJustCreatedNewChat(true);

        // Update the userMessage with the correct conversation_id
        userMessage.conversation_id = finalChatId;

      } catch (error) {
        console.error('Error creating new chat before sending message:', error);
        setIsGenerating(false);
        if (!error.message.includes("Failed to get new token") && !error.message.includes("Authentication expired")) {
            showAlert(ERROR_MESSAGES.DEFAULT, 'error');
        }
        return;
      }
    } else {
        finalChatId = chatId; // Use existing chat ID
        // If existing chat, check if title needs update (e.g., from 'New Chat' to actual title)
        const existingChat = chats.find(chat => chat.id === finalChatId);
        if (existingChat && existingChat.title === 'New Chat') {
            initialChatTitle = generateChatTitle({ messages: [...existingChat.messages, userMessage] });
            if (initialChatTitle !== 'New Chat') {
                shouldRenameDb = true;
            }
        } else if (existingChat) {
            initialChatTitle = existingChat.title; // Keep existing title
        }
    }

    // Now, update the chats state with the user's message.
    // This ensures the message appears on the UI immediately.
    setChats(prevChats => {
        let chatFound = false;
        const updatedChats = prevChats.map(chat => {
            if (chat.id === finalChatId) {
                chatFound = true;
                const newMessages = [...chat.messages, userMessage];
                return {
                    ...chat,
                    messages: newMessages,
                    title: shouldRenameDb ? initialChatTitle : chat.title, // Apply new title if flagged
                    updatedAt: new Date()
                };
            }
            return chat;
        });

        // If it's a completely new chat and wasn't in prevChats (should be rare if !chatId block runs first)
        if (!chatFound && !currentChatId) { // Only add if it's a new chat and not already in prevChats
            const newChatObject = {
                id: finalChatId,
                title: initialChatTitle,
                messages: [userMessage], // Ensure the user message is in its messages
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return [newChatObject, ...prevChats]; // Add new chat to the beginning
        }
        return updatedChats;
    });
    // console.log("DEBUG: User message added to state for display:", userMessage);


    // Perform database rename if flagged (for new chats or initial title update of existing 'New Chat')
    if (shouldRenameDb) {
      // console.log(`DEBUG: Calling renameConversation for chat. ID: ${finalChatId}, Title: "${initialChatTitle}"`);
      await renameConversation(finalChatId, initialChatTitle);
    }

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Get the most up-to-date messages for the AI context.
      // This is crucial because the `setChats` above is asynchronous.
      // We need to ensure the user's message is included in the history sent to the LLM.
      // We can't rely on `chats` state directly here for the *immediate* update.
      // Instead, we build the history based on the previous messages + the current user message.
      const currentChatState = chats.find(chat => chat.id === finalChatId);
      const messagesForAIContext = currentChatState ? [...currentChatState.messages, userMessage] : [userMessage]; // Include the just-added user message

      let previousMessages = [];
      if (MEMORY_SHOT === 0) {
        previousMessages = [];
      } else {
        let pair = [];
        let pairCount = 0;
        // Traverse backwards through allMessagesForAI, excluding the last message (current user message)
        for (let i = messagesForAIContext.length - 2; i >= 0 && pairCount < MEMORY_SHOT; i--) {
          const msg = messagesForAIContext[i];

          if (msg.role === 'assistant') {
            pair.unshift({
              role: 'assistant',
              content: (msg.content || '').replace(/data:image\/[^;]+;base64[^,]*,[A-Za-z0-9+/=]*/g, '')
            });
          }

          if (msg.role === 'user') {
            pair.unshift({
              role: 'user',
              content: (msg.content || '').replace(/data:image\/[^;]+;base64[^,]*,[A-Za-z0-9+/=]*/g, '')
            });

            if (pair.length === 2) {
              previousMessages.unshift(...pair);
              pair = [];
              pairCount++;
            }
          }
        }
      }

      const payload = {
        message: currentInput, // Send the user's original question
        messages: previousMessages,
        client: platformInfo.icon || 'web',
        trace_id: '',
        conversation_id: parseInt(finalChatId, 10),
      };

      // console.log("DEBUG: Sending payload to chat API:", payload);

      const response = await fetch(`${API_BASE}/chat/${ENV_PROJECT}/${selectedProjectVersion}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) { 
        const errorData = await response.json();
        if (response.status === 401) {
          console.log("INFO: 401 Unauthorized error detected. Attempting to get new token.");
          try {
            const newToken = await getNewToken(refreshtoken,msalinstance);
            setToken(newToken); 
            // console.log("DEBUG: New token received and set. Reloading screen.");
            window.location.reload(); 
            return;
          } catch (tokenError) {
            console.error("ERROR: Failed to get new token:", tokenError);
            showAlert("Authentication expired. Please log in again.", 'error');
            return;
          }
        }
        const errorMessage = ERROR_MESSAGES[response.status] || ERROR_MESSAGES.DEFAULT;
        showAlert(errorMessage, 'error'); 
        throw new Error((await response.json()).error || `HTTP ${response.status}`); 
      }

      const data = await response.json();
      let aiContent = data.answer || data.choices?.[0]?.message?.content || 'Sorry, I received an empty response.';
      setLastAiResponse(aiContent);
      setShowInputSuggestions(true)
      if (data.traceid){ setTraceId(data.traceid);
        //console.log("DEBUG: Trace Id noted:", data.traceid);
         }
      const traceidid =data.traceid
      const cleanedContent = cleanSuggestionsFromContent(aiContent)
      const { images, references } = parseRAGResponse(cleanedContent, data.source_documents);
      let assistantId = (Date.now() + 1).toString(); // Temporary frontend ID for assistant message
      const responseTime = new Date().toISOString(); // Define responseTime here

      let newMessage = {
        id: assistantId,
        content: cleanedContent, 
        role: 'assistant',
        timestamp: new Date(),
        images,
        references,
        model: selectedProjectVersion,
        conversation_id: finalChatId
      };

      setChats(prev => prev.map(chat =>
        chat.id === finalChatId
          ? { ...chat, messages: [...chat.messages, newMessage], updatedAt: new Date() }
          : chat
      ));
      // console.log("DEBUG: Assistant message added to state:", newMessage);
      setIsGenerating(false);

      // Store message in database
      try {
        const messagePayload = {
          conversation_id: parseInt(finalChatId, 10),
          user_text: userMessage.content, 
          response_text: cleanedContent, // Use cleaned content here too
          reference_text: JSON.stringify(references),
          user_message_time: userMessageTime,
          response_time: responseTime,
          trace_id: traceidid,
        };
        // console.log("DEBUG: Attempting to store message in DB with payload:", messagePayload);
        const dbMessageResponse = await fetch(`${DB_API_BASE}/chat-history/messages?project_id=${ENV_PROJECT}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(messagePayload),
        });
        if (!dbMessageResponse.ok) { 
            console.error('ERROR: Failed to store message in DB:', await dbMessageResponse.json()); 
        }
        else { 
            const dbResponseData = await dbMessageResponse.json();
            const backendMessageId = dbResponseData.message_id; // <-- CRITICAL: Get the ID from backend!

            // IMPORTANT: Update the IDs of the user and assistant messages in the state
            // with the ID provided by the backend.
            setChats(prev => prev.map(chat => {
                if (chat.id === finalChatId) {
                    const updatedMessages = chat.messages.map(msg => {
                        // If this is the user message we just sent (check by temporary ID)
                        if (msg.role === 'user' && msg.id === userMessageId) {
                            return { ...msg, id: String(backendMessageId) }; // Update with backend ID
                        }
                        // If this is the assistant message we just received (check by temporary ID)
                        if (msg.role === 'assistant' && msg.id === assistantId) {
                            return { ...msg, id: `${backendMessageId}-ai` }; // Update with backend ID + suffix
                        }
                        return msg;
                    });
                    return { ...chat, messages: updatedMessages };
                }
                return chat;
            }));
        }
      } catch (dbError) { console.error('ERROR: Error storing message in DB:', dbError); }

      scrollToBottom();

    } catch (error) {
      if (error.name === 'AbortError') { 
        console.log("DEBUG: Response generation was stopped."); 
      }
      else {
        console.error("ERROR: Message generation failed:", error);
        showAlert(ERROR_MESSAGES.DEFAULT, 'error');
        const errorContent = error.name === 'AbortError' ? 'Response generation was stopped.' : `Sorry, I encountered an error: ${error.message}.`;
        const errorMessage = { id: (Date.now() + 1).toString(), content: errorContent, role: 'assistant', timestamp: new Date(), images: [], references: [], conversation_id: finalChatId };
        setChats(prev => prev.map(chat => chat.id === finalChatId ? { ...chat, messages: [...chat.messages, errorMessage], updatedAt: new Date() } : chat ));
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
      // console.log("DEBUG: Generation process finished.");
    }
  }, [input, isGenerating, currentChatId, chats, generateChatTitle, parseRAGResponse, selectedProjectVersion, platformInfo, account, token, renameConversation]);
  const handleInputSuggestionClick = useCallback((suggestionText) => {
    setInput(suggestionText);
    setShowInputSuggestions(false);
    console.log("my value",setChatLimitExceeded);
    if (inputRef.current)
    {
      inputRef.current.focus();
    }
  }, [sendMessage]);

  // Function to handle message deletion from UI
  const handleDeleteMessageFromUI = useCallback((messageId, conversationId) => {
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === String(conversationId)) {
          const updatedMessages = chat.messages.filter(msg => {
            // Keep messages that are not the target message_id and its associated user message
            // If the deleted button was on an assistant message (id like "X-ai")
            if (msg.role === 'assistant' && msg.id === messageId) {
                return false; // Remove the assistant message
            }
            // If the deleted button was on an assistant message, also remove its paired user message
            if (msg.role === 'user' && messageId.includes('-ai') && msg.id === messageId.replace('-ai', '')) {
                return false; // Remove the corresponding user message
            }
            // If the deleted button was on a user message (id like "X")
            if (msg.role === 'user' && msg.id === messageId && !messageId.includes('-ai')) {
                return false; // Remove the user message
            }
            // If the deleted button was on a user message, also remove its paired assistant message
            if (msg.role === 'assistant' && !messageId.includes('-ai') && msg.id === `${messageId}-ai`) {
                return false; // Remove the corresponding assistant message
            }
            return true; // Keep other messages
          });
          return { ...chat, messages: updatedMessages };
        }
        return chat;
      });
    });
  }, []);

  // Function to handle chat selection from sidebar
  const handleSelectChat = useCallback((chatId) => {
    setCurrentChatId(chatId);
    sessionStorage.setItem('lastActiveChatId', chatId); // Explicitly save selected chat as last active
    // console.log("DEBUG: Chat selected via sidebar, saving ID to session storage:", chatId);

    setInputSuggestions([]);
    setShowInputSuggestions(false);
  }, []);


  // Effect to fetch ALL conversations when component mounts or token/account changes
  useEffect(() => {
    const fetchAllConversations = async () => {
      if (token && account && hasInitialized) {
        // console.log("DEBUG: Attempting to fetch all conversations.");
        try {
          const response = await fetch(`${DB_API_BASE}/chat-history/conversations?project_id=${ENV_PROJECT}`, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();

            // Handling 401 Error
            if (response.status === 401) {
              console.log("INFO: 401 Unauthorized error detected. Attempting to get new token.");
              try {
                const newToken = await getNewToken(refreshtoken,msalinstance);
                setToken(newToken); 
                // console.log("DEBUG: New token received and set. Reloading screen.");
                window.location.reload(); // Refresh the entire page to apply new token and re-fetch data
                return;
              } catch (tokenError) {
                console.error("ERROR: Failed to get new token:", tokenError);
                // Optionally, show a specific error message if token refresh fails
                showAlert("Authentication expired. Please log in again.", 'error');
                return;
              }
            }

            // For other non-OK responses (e.g., 400, 403, 404, 500)
            const errorMessage = ERROR_MESSAGES[response.status] || ERROR_MESSAGES.DEFAULT;
            showAlert(errorMessage, 'error'); // Pass the fetched error message


            throw new Error(`Failed to fetch all conversations: ${errorData.detail?.[0]?.msg || response.statusText}`);
          }

          const data = await response.json();
          // console.log("DEBUG: Fetched all conversations:", data);

          // Assuming data is an array of conversation objects
          const formattedChats = data.map(conv => ({
            id: String(conv.conversation_id), // Ensure ID is string for local state
            title: conv.conversation_name || 'New Chat', // Use conversation_name if available
            messages: [], // Messages will be fetched when conversation is selected
            createdAt: new Date(conv.last_message_time || Date.now()), // Use last_message_time or current time
            updatedAt: new Date(conv.last_message_time || Date.now())
          }));
          setChats(formattedChats);
          // console.log("DEBUG: All conversations loaded into state:", formattedChats);

          const isFirstLoadOfSession = sessionStorage.getItem("hasVisited") !== "true";
          const storedLastActiveChatId = sessionStorage.getItem('lastActiveChatId');
          let chatToSetAsCurrent = null;

          // console.log("DEBUG: Initial check - isFirstLoadOfSession:", isFirstLoadOfSession);
          // console.log("DEBUG: Initial check - storedLastActiveChatId:", storedLastActiveChatId);
          // console.log("DEBUG: Initial check - formattedChats:", formattedChats);


          if (isFirstLoadOfSession) {
            chatToSetAsCurrent = null; // Forces landing page
            // console.log("DEBUG: Decided: First load, setting currentChatId to null (landing page).");
          } else if (storedLastActiveChatId) {
            const foundStoredChat = formattedChats.find(chat => chat.id === storedLastActiveChatId);
            // console.log("DEBUG: Result of finding stored chat:", foundStoredChat);
            if (foundStoredChat) {
              chatToSetAsCurrent = foundStoredChat.id; // Restore specific chat
              // console.log("DEBUG: Decided: Found stored chat, restoring ID:", chatToSetAsCurrent);
            } else {
              // console.log("DEBUG: Decided: Stored last active chat ID not found in fetched conversations. Falling back to most recent.");
              // Fallback to most recent if stored ID is invalid
              if (formattedChats.length > 0) {
                // Sort by updatedAt, descending to get the most recent
                const mostRecentChat = formattedChats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0].id;
                chatToSetAsCurrent = mostRecentChat;
                // console.log("DEBUG: Decided: Falling back to most recent chat ID:", chatToSetAsCurrent);
              } else {
                // console.log("DEBUG: Decided: No chats found at all. Setting currentChatId to null (landing page).");
              }
            }
          } else {
            // No stored chat, fallback to most recent if available
            // console.log("DEBUG: Decided: No stored chat ID found. Falling back to most recent if available.");
            if (formattedChats.length > 0) {
              const mostRecentChat = formattedChats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
              chatToSetAsCurrent = mostRecentChat.id;
              // console.log("DEBUG: Decided: Setting most recent conversation as current:", chatToSetAsCurrent);
            } else {
              // No chats at all, stay on landing page
              // console.log("DEBUG: Decided: No conversations found. Setting currentChatId to null (landing page).");
            }
          }
          
          setCurrentChatId(chatToSetAsCurrent);
          sessionStorage.setItem('hasVisited', 'true'); // Mark as visited for future loads in this session

        } catch (error) {
          console.error('ERROR: Error fetching all conversations:', error);
          if (!error.message.includes("Failed to get new token") && !error.message.includes("Authentication expired")) {
              showAlert(ERROR_MESSAGES.DEFAULT, 'error');
          }
        }
      } else if (!token) {
        // console.log("DEBUG: No token available, cannot fetch all conversations.");
        setChats([]); // Clear chats if no token
        setCurrentChatId(null);
      } else if (!account) {
        // console.log("DEBUG: No account available, cannot fetch all conversations.");
        setChats([]); // Clear chats if no account
        setCurrentChatId(null);
      } else if (!hasInitialized) {
        // console.log("DEBUG: App not initialized, deferring fetch of all conversations.");
      }
    };

    fetchAllConversations();
  }, [token, account, hasInitialized]); // Depend on token, account, and hasInitialized


  // Effect to fetch chat messages when currentChatId changes
  useEffect(() => {
    const fetchChatMessages = async () => {
      if (!currentChatId || !token) {
          setIsLoadingMessages(false);
          // Clear suggestions when no chat is selected
          setInputSuggestions([]);
          setShowInputSuggestions(false);
          return;
      }

      // Clear suggestions when switching to a different chat
      setInputSuggestions([]);
      setShowInputSuggestions(false);

      const chatInState = chats.find(chat => chat.id === currentChatId);

      // If it's a newly created chat and it already has messages (optimistically added user message),
      // then we don't need to fetch from DB.
      if (justCreatedNewChat && chatInState && chatInState.messages.length > 0) {
          // console.log("DEBUG: Skipping message fetch for newly created chat with initial user message.");
          setIsLoadingMessages(false);
          setJustCreatedNewChat(false); // Reset the flag
          return;
      }

      // Only fetch if the chat exists in state and doesn't already have messages (or if it's not a just-created chat)
      if (chatInState && chatInState.messages.length === 0&& !justCreatedNewChat) {
        // console.log(`DEBUG: Fetching messages for conversation ID: ${currentChatId}`);
        setIsLoadingMessages(true); // Set loading state to true
        try {
          const conversationIdInt = parseInt(currentChatId, 10);
          if (isNaN(conversationIdInt)) {
              console.error("ERROR: Invalid currentChatId for fetching messages:", currentChatId);
              setIsLoadingMessages(false);
              return;
          }

          const response = await fetch(`${DB_API_BASE}/chat-history/conversations/${conversationIdInt}/messages?project_id=${ENV_PROJECT}`, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();

            // Handling 401 Error
            if (response.status === 401) {
              console.log("INFO: 401 Unauthorized error detected. Attempting to get new token.");
              try {
                const newToken = await getNewToken(refreshtoken,msalinstance);
                setToken(newToken); 
                // console.log("DEBUG: New token received and set. Reloading screen.");
                window.location.reload(); // Refresh the entire page to apply new token and re-fetch data
                return;
              } catch (tokenError) {
                console.error("ERROR: Failed to get new token:", tokenError);
                // Optionally, show a specific error message if token refresh fails
                showAlert("Authentication expired. Please log in again.", 'error');
                return;
              }
            }

            // For other non-OK responses (e.g., 400, 403, 404, 500)
            const errorMessage = ERROR_MESSAGES[response.status] || ERROR_MESSAGES.DEFAULT;
            showAlert(errorMessage, 'error'); // Pass the fetched error message


            throw new Error(`Failed to fetch messages: ${errorData.detail?.[0]?.msg || response.statusText}`);
          }

          const data = await response.json();
          // console.log("DEBUG: Fetched messages from DB:", data);

          // Process messages: create combined user/assistant message pairs
          const fetchedMessages = [];
          data.messages.forEach(msg => {
            if (msg.user_text !== null) {
              fetchedMessages.push({
                id: msg.message_id.toString(), // Use backend's message_id
                content: msg.user_text,
                role: 'user',
                timestamp: new Date(msg.user_message_time),
                conversation_id: currentChatId 
              });
            }
            if (msg.response_text !== null) {
              // References are no longer included in this response, so we don't look for them here.
              // The `references` property will be added on-demand.

              fetchedMessages.push({
                id: `${msg.message_id}-ai`,
                content: msg.response_text,
                role: 'assistant',
                timestamp: new Date(msg.response_time),
                conversation_id: currentChatId
                // 'references' property is intentionally omitted
              });
            }
          });

          // Sort all messages by timestamp to maintain chronological order
          fetchedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

          setChats(prev => {
            const chatIndex = prev.findIndex(chat => chat.id === currentChatId);
            if (chatIndex > -1) {
              const updatedChats = [...prev];
              updatedChats[chatIndex] = {
                ...updatedChats[chatIndex],
                messages: fetchedMessages,
                updatedAt: new Date()
              };
              // console.log("DEBUG: Chats state updated for current chat ID:", currentChatId, updatedChats[chatIndex]);
              return updatedChats;
            }
            console.warn("WARN: Could not find chat with ID", currentChatId, "to update messages.");
            return prev; // Return previous state if chat not found
          });
          // console.log("DEBUG: Messages loaded into state for current chat:", fetchedMessages);
          scrollToBottom();

        } catch (error) {
          console.error('ERROR: Error fetching chat messages:', error);
          if (!error.message.includes("Failed to get new token") && !error.message.includes("Authentication expired")) {
              showAlert(ERROR_MESSAGES.DEFAULT, 'error');
          }
          // Optionally, show an error message to the user
        } finally {
          setIsLoadingMessages(false);
          setJustCreatedNewChat(false); // Reset the flag here too, in case of error during fetch
        }
      } else {
        // If chatInState exists and already has messages, or if it's not a scenario for fetching.
        setIsLoadingMessages(false);
      }
    };

    fetchChatMessages();
  }, [currentChatId, token, scrollToBottom, justCreatedNewChat]); // Removed 'chats' from dependencies
  useEffect(() => {
    setChatLimitExceeded(false); // ✅ Reset the limit warning when changing chats
  }, [currentChatId]);



  // Event listener for 'version-selected' from App2.js (updated to use selectedProjectVersion)
  useEffect(() => {
    const handler = (e) => {
      const selectedVersion = e.detail;
      setSelectedProjectVersion(selectedVersion);
      // console.log("DEBUG: Version changed to:", selectedVersion);

      // This message should be added to the current chat
      const versionMessage = {
        id: (Date.now() + 1).toString(),
        content: `Version has been switched to ${selectedVersion}`,
        role: "assistant",
        timestamp: new Date(),
        conversation_id: currentChatId 
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
      // console.log("DEBUG: Version switch message added to current chat.");
    };

    window.addEventListener("version-selected", handler);
    return () => window.removeEventListener("version-selected", handler);
  }, [currentChatId]);


  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // console.log("DEBUG: Enter key pressed. Initiating send/stop generation.");
      isGenerating ? stopGeneration() : sendMessage();
    }
  }, [isGenerating, stopGeneration, sendMessage]);

  // Combined handleTextareaInput to include platform-specific max-height from App1.js
  const handleTextareaInput = useCallback((e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, platformInfo.isTeams ? 32 : 96) + 'px'; // Max height 32px for Teams (2 lines) and 96px for web (6 lines based on App2.js)
  }, [platformInfo.isTeams]);

  // Mobile toggle handler
  const handleMobileToggle = useCallback((open) => {
    setIsMobileOpen(open);
  }, []);

  // Landing page rendering (Combined from both, prioritizing App1.js structure and styling for landing)
if (showLanding) {
  return (
    <div className={`min-h-screen max-h-screen flex overflow-hidden ${
      platformInfo.isTeams ? 'bg-white' : 'bg-gradient-to-br from-slate-50 to-blue-50'
    }`}>
      {/* Mobile Hamburger Menu */}
      {isMobile && (
        <button
          data-hamburger-menu
          onClick={() => handleMobileToggle(true)}
          className="fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      )}

      <WarningError
        message={alertMessage}
        type={alertType}
        isVisible={alertVisible}
        onClose={() => setAlertVisible(false)}
        topOffset="top-16" // Or "top-20", "top-[60px]", etc., based on ProfileMenu height
      />

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" />
      )}

      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat} 
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isCollapsed={isMobile ? false : isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isTeams={platformInfo.isTeams}
        account={account}
        logout={logout}
        isMobileOpen={isMobileOpen}
        onMobileToggle={handleMobileToggle}
      />

      <div className={`flex-1 flex flex-col items-center justify-center p-4 overflow-hidden ${
        platformInfo.isTeams ? 'pt-12' : ''
      } ${isMobile ? 'pt-20' : ''}`}>
        <div className="w-full max-w-xl mx-auto">
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="inline-flex items-center justify-center mb-4">
              <img
                src={CompanyLogo}
                alt="Company Logo"
                className="w-16 h-16 sm:w-24 md:w-32 lg:w-40 object-contain mx-auto drop-shadow-md" 
              />
            </div>

            {/* Welcome Message */}
            <p className="text-gray-600 text-sm sm:text-base px-4">
              Hello {account?.name || "Guest"}! Welcome to <span className="font-semibold">AI-DN {ENV_PROJECT}</span>.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mx-4 sm:mx-0">
            <div className="flex items-center gap-2 p-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything to get started..."
                disabled={isGenerating}
                className="flex-1 text-sm resize-none border-none outline-none focus:ring-0 min-h-[20px] max-h-12 disabled:opacity-50 bg-transparent placeholder-gray-400"
                rows={1}
                onInput={handleTextareaInput}
              />
              <div className="flex items-center gap-2">
                <div className={`${platformInfo.isTeams ? "max-w-[100px]" : "max-w-[200px] sm:max-w-[200px]"}`}>
                  <CompactVersionSelector
                    selectedProjectVersion={selectedProjectVersion}
                    onProjectVersionChange={setSelectedProjectVersion}
                    disabled={isGenerating}
                  />
                </div>
                <button
                  onClick={isGenerating ? stopGeneration : sendMessage}
                  disabled={(!isGenerating && !input.trim() )|| (currentChat?.messages.length >= CHAT_MESSAGE_LIMIT)}
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

          <div className="text-center mt-3 px-4 sm:px-0">
            <p className="text-xs text-gray-400">
              {isGenerating ? "AI is generating a response..." : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
  if (showLanding) {
    return (
      <div className={`min-h-screen max-h-screen flex overflow-hidden ${
        platformInfo.isTeams ? 'bg-white' : 'bg-gradient-to-br from-slate-50 to-blue-50'
      }`}>
        <ProfileMenu account={account} logout={logout}/> {/* From App2.js */}

        <WarningError
          message={alertMessage}
          type={alertType}
          isVisible={alertVisible}
          onClose={() => setAlertVisible(false)}
          topOffset="top-16" // Or "top-20", "top-[60px]", etc., based on ProfileMenu height
        />

        <ChatSidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat} 
          onNewChat={createNewChat}
          onDeleteChat={deleteChat}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          isTeams={platformInfo.isTeams}
          onRenameChat={renameConversation} // Pass rename function to sidebar
        />

        <div className={`flex-1 flex col items-center justify-center p-4 overflow-hidden ${
          platformInfo.isTeams ? 'pt-12' : '' // From App1.js
        }`}>
          <div className="w-full max-w-xl mx-auto">

<div className="text-center mb-8">
    {/* Logo */}
    <div className="inline-flex items-center justify-center mb-4">
        <img
            src={CompanyLogo}
            alt="Company Logo"
            className="w-10 sm:w-10 md:w-10 object-contain mx-auto drop-shadow-md"
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
                  onChange={handleInputChange}
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
    platformInfo.isTeams ? 'bg-white' : 'bg-gray-50'
  } relative`}>
    
    {/* Mobile Hamburger Menu */}
    {isMobile && (
      <button
        data-hamburger-menu
        onClick={() => handleMobileToggle(true)}
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
    )}



    <WarningError
      message={alertMessage}
      type={alertType}
      isVisible={alertVisible}
      onClose={() => setAlertVisible(false)}
      topOffset="top-16" // Or "top-20", "top-[60px]", etc., based on ProfileMenu height
    />

    {/* Mobile Overlay */}
    {isMobile && isMobileOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" />
    )}
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat} 
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isCollapsed={isMobile ? false : isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isTeams={platformInfo.isTeams}
        onRenameChat={renameConversation} // Pass rename function to sidebar
	account={account}
      logout={logout}
      isMobileOpen={isMobileOpen}
      onMobileToggle={handleMobileToggle}
      />

      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ${
        isReferencesOpen ? 'mr-0 lg:mr-80' : ''
    } ${isMobile ? 'pt-16' : ''}`}>

        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 min-h-0">
        {isLoadingMessages ?  (
            <div className="h-full flex items-center justify-center text-gray-500">
                Loading messages...
            </div>
        ) : currentChat?.messages.length === 0 ? (
            // Render empty chat interface directly without "Loading messages..."
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <img src={CompanyLogo} alt="Company Logo" className="w-4 h-4 object-contain" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Start a conversation</h3>
                  <p className="text-xs text-gray-500">Ask me anything to get started</p>
              </div>
          </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto"> {/* Adjusted space-y-6 and max-w-4xl from App1.js */}
              {/* {console.log("RENDER DEBUG: currentChat:", currentChat)}
              {console.log("RENDER DEBUG: currentChat messages length:", currentChat?.messages?.length)} */}
              {currentChat?.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  traceId={traceId}
                  selectedProjectVersion={selectedProjectVersion}
                  onReferencesClick={handleReferencesToggle}
                  isReferencesOpen={isReferencesOpen && selectedMessageReferences?.messageId === message.id}
                  token={token}
                  onDeleteMessage={handleDeleteMessageFromUI} // Pass the handler
                  setToken={setToken} 
                  refreshtoken={refreshtoken}
                  msalinstance={msalinstance}
                  onSuggestionClick={handleInputSuggestionClick}
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
                    model: selectedProjectVersion, // Added version to message
                    conversation_id: currentChatId // Pass conversation_id for generating message too
                    
                  }}
                  isGenerating={true}
                  onReferencesClick={handleReferencesToggle}
                      traceId={traceId}
    selectedProjectVersion={selectedProjectVersion}
    token={token}
    onDeleteMessage={handleDeleteMessageFromUI} // Pass the handler to generating message as well, if needed
                  setToken={setToken} 

                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        {/* Suggestions OUTSIDE the white container */}
        {showInputSuggestions && !isGenerating && (
          <div className={`${platformInfo.isTeams ? 'px-3' : 'px-4'}`}>
            <div className="max-w-4xl mx-auto">
              <SuggestionCards
                content={lastAiResponse}
                onSuggestionClick={handleInputSuggestionClick}
                isGenerating={isGenerating}
                showInInputArea={true}
                compact={platformInfo.isTeams}
              />
            </div>
          </div>
        )}
        {/* Smaller input area, combined from both with platform-specific styles */}
       <div
          className={`bg-white border-t border-gray-200 flex-shrink-0 ${
            platformInfo.isTeams ? "px-2 sm:px-3 py-2" : "px-2 sm:px-4 py-2"
          }`}
        >
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div
              className={`bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${
                platformInfo.isTeams ? "rounded-md" : ""
              }`}
            >
              <div
                className={`flex items-center gap-2 ${
                  platformInfo.isTeams ? "p-2" : "p-2.5"
                }`}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isGenerating}
                  className={`flex-1 bg-transparent resize-none border-none outline-none focus:ring-0 min-h-[20px] disabled:opacity-50 placeholder-gray-400 ${
                    platformInfo.isTeams
                      ? "max-h-8 text-xs"
                      : "max-h-16 text-sm"
                  }`}
                  rows={1}
                  onInput={handleTextareaInput}
                />
                <div className="flex items-center gap-1.5">
                {VERSIONS_AVAILABLE.length > 0 && (
                    <div
                      className={`${
                        platformInfo.isTeams
                          ? "max-w-[100px]"
                          : "max-w-[200px] sm:max-w-[200px]"
                      }`}
                    >
                      <CompactVersionSelector
                        selectedProjectVersion={selectedProjectVersion}
                        onProjectVersionChange={setSelectedProjectVersion}
                        disabled={isGenerating}
                      />
                    </div>
                  )}
                  <button
                    onClick={isGenerating ? stopGeneration : sendMessage}
                    disabled={!isGenerating && !input.trim()}
                    className={`flex items-center justify-center text-white rounded-lg transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md ${
                      platformInfo.isTeams
                        ? "w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        : "w-7 h-7 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    } ${isGenerating ? "bg-red-500 hover:bg-red-600" : ""}`}
                  >
                    {isGenerating ? (
                      <Square
                        className={
                          platformInfo.isTeams ? "w-3 h-3" : "w-3.5 h-3.5"
                        }
                      />
                    ) : (
                      <SendHorizontal
                        className={
                          platformInfo.isTeams ? "w-3 h-3" : "w-3.5 h-3.5"
                        }
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Compact status indicator */}
            {/* Status indicators and disclaimer */}
            <div className="flex items-center justify-center mt-1">
              {chatLimitExceeded ? (
                <p
                  className={`text-red-500 font-medium ${
                    platformInfo.isTeams ? "text-[9px]" : "text-[10px]"
                  }`}
                >
                  Chat limit exceeded. Please start a new conversation.
                </p>
              ) : isGenerating ? (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  <p
                    className={`text-gray-400 ${
                      platformInfo.isTeams ? "text-[9px]" : "text-[10px]"
                    }`}
                  >
                    AI is generating response...
                  </p>
                </div>
              ) : (
                <p
                  className={`text-gray-400 ${
                    platformInfo.isTeams ? "text-[9px]" : "text-[10px]"
                  }`}
                >
                  AI can make mistakes. Verify important information.
                </p>
              )}
            </div>
          </div>
        </div>
        
      </div>

    <div ref={referencePanelRef} className="hidden lg:block">
      <ReferencesPanel
        isOpen={isReferencesOpen}
        references={selectedMessageReferences?.references || []}
        onClose={closeReferences}
      />
    </div>
  {isMobile && isReferencesOpen && (
  <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-4">
    <button
      onClick={closeReferences}
      className="absolute top-4 right-4 text-gray-600"
    >
      Close
    </button>
    <ReferencesPanel
      isOpen={isReferencesOpen}
      references={selectedMessageReferences?.references ?? []}
      onClose={closeReferences}
    />
  </div>
)}
{showLimitPopup && oldestChatToDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm p-6 animate-fadeIn">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-red-100 text-red-600 rounded-full p-2.5">
              <Trash className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">Conversation Limit Reached</h3>
              <p className="text-sm text-gray-500 mt-1">
                You already have 50 chats. Would you like to delete the oldest one (<strong>{oldestChatToDelete.title}</strong>) to continue?
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => {
                setShowLimitPopup(false);
                setOldestChatToDelete(null);
              }}
              className="px-4 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium"
            >
              No, I’ll delete manually
            </button>
            <button
              onClick={async () => {
                await deleteChat(oldestChatToDelete.id);
                setShowLimitPopup(false);
                setOldestChatToDelete(null);
              }}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition font-medium shadow-sm"
            >
              Yes, delete and continue
            </button>
          </div>
        </div>
      </div>
)}

  </div>
);
}

export default App;
