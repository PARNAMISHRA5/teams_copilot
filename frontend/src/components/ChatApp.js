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
const DB_API_BASE = process.env.REACT_APP_API_URL; // Added DB_API_BASE

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
  <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

function App({accesstoken,account,logout}) { // Merged App and ChatApp signatures
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

  const MEMORY_SHOT = parseInt(process.env.REACT_APP_MEMORY_SHOT || '4');
 const token =process.env.REACT_APP_TOKEN;

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
  }, [isReferencesOpen, selectedMessageReferences?.messageId, closeReferences]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentChatId]);

  // Removed localStorage operations entirely
  useEffect(() => {
    if (!account) {
        setCurrentChatId(null);
        sessionStorage.removeItem('hasVisited');
        return;
    }

    const isFirstLoadOfSession = sessionStorage.getItem("hasVisited") !== "true";

    // Initialize chats and currentChatId based on session or default
    if (isFirstLoadOfSession) {
        setCurrentChatId(null); // No chat selected on first load of session
        console.log("DEBUG: First load of session. currentChatId set to null.");
    } else {
        // If not first load, try to maintain current chat if it exists in 'chats' state
        // This part will now rely on the DB fetch to populate 'chats'
        console.log("DEBUG: Not first load of session. Relying on DB fetch for chats.");
    }

    // Set a default project version if none is explicitly set
    setSelectedProjectVersion('v4.2');

    setHasInitialized(true);
    if (account) {
        sessionStorage.setItem('hasVisited', 'true');
    }
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

  const handleReferencesToggle = useCallback((messageId, references) => {
    if (isReferencesOpen && selectedMessageReferences?.messageId === messageId) {
      closeReferences();
    } else {
      setSelectedMessageReferences({ messageId, references });
      setIsReferencesOpen(true); // Corrected typo here
    }
  }, [isReferencesOpen, selectedMessageReferences?.messageId, closeReferences]);

  const createNewChat = useCallback(async () => { // Made async to await API call
    const conversationCreationTime = new Date().toISOString(); // Get current timestamp in ISO format

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

      console.log("DEBUG: New conversation created. API response:", conversationId);

      const newChat = {
        id: String(conversationId), // Ensure ID is a string for local state consistency
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setJustCreatedNewChat(true); // Set flag to prevent immediate message fetch
      console.log("DEBUG: New chat added to state and set as current. Chat ID:", newChat.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
      // Optionally, show an error message to the user
      // For now, it will just log to console and not create a new chat in UI
    }
  }, [token]); // Added token to dependencies

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
      console.log("DEBUG: Generation stopped by user.");
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

    console.log(`DEBUG: Attempting to rename conversation ID ${conversationId} to "${newName}"`);
    console.log("DEBUG: Rename API URL:", `${DB_API_BASE}/chat-history/conversations/name?project_id=${ENV_PROJECT}`);
    console.log("DEBUG: Rename API Payload:", payload);
    console.log("DEBUG: Rename API Token (first 10 chars):", token ? token.substring(0, 10) + '...' : 'N/A');

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
        console.error('ERROR: Failed to rename conversation API response:', errorData);
        throw new Error(`Failed to rename conversation: ${errorData.detail?.[0]?.msg || response.statusText}`);
      }

      // Updated to match the new response schema
      const responseData = await response.json();
      console.log("DEBUG: Conversation rename successful (API response):", responseData);

      // Update the local state to reflect the new name
      setChats(prevChats => prevChats.map(chat =>
        chat.id === conversationId
          ? { ...chat, title: newName.trim(), updatedAt: new Date() }
          : chat
      ));
      console.log(`DEBUG: Conversation ID ${conversationId} renamed to "${newName}" in local state.`);

    } catch (error) {
      console.error('ERROR: Error renaming conversation during fetch:', error);
      // Optionally, display an error to the user
    }
  }, [token]);


  // Merged sendMessage logic
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    let chatId = currentChatId;
    const userMessageTime = new Date().toISOString(); // Timestamp for user message

    // If no current chat, create one using the API call
    if (!chatId) {
      const conversationCreationTime = new Date().toISOString();
      try {
        const response = await fetch(`${DB_API_BASE}/chat-history/conversations?project_id=${ENV_PROJECT}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ conversation_creation_time: conversationCreationTime }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to create conversation: ${errorData.detail?.[0]?.msg || response.statusText}`);
        }

        // Assuming the API returns the conversation ID directly as a string or number
        const responseData = await response.json();
        let newConversationId;
        if (typeof responseData === 'string' || typeof responseData === 'number') {
          newConversationId = responseData;
        } else if (responseData && typeof responseData === 'object' && responseData.conversation_id) {
          newConversationId = responseData.conversation_id;
        } else {
          throw new Error("API did not return a valid conversation_id.");
        }

        console.log("DEBUG: New conversation created (via sendMessage). ID:", newConversationId);

        // Determine the initial title based on the first message
        const initialTitle = generateChatTitle({ messages: [{ role: 'user', content: input.trim() }] });

        const newChat = {
          id: String(newConversationId),
          title: initialTitle, // Set initial title from generateChatTitle
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setChats(prev => [newChat, ...prev]);
        chatId = newChat.id;
        setCurrentChatId(chatId);

        // Immediately rename the conversation in the database with the generated title
        console.log(`DEBUG: Calling renameConversation for new chat. ID: ${chatId}, Title: "${initialTitle}"`);
        await renameConversation(chatId, initialTitle);

        console.log("DEBUG: New chat added to state and set as current. Chat ID:", newChat.id);
      } catch (error) {
        console.error('Error creating new chat before sending message:', error);
        setIsGenerating(false);
        return; // Stop execution if chat creation fails
      }
    }

    const userMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
      conversation_id: chatId // Added conversation_id here
    };

    // --- START MODIFIED LOGIC FOR EXISTING CHAT TITLE UPDATE ---
    let chatToUpdate = chats.find(chat => chat.id === chatId);
    if (!chatToUpdate) {
        // This case should ideally not be hit if chatId is derived from existing state,
        // but adding a safeguard.
        console.error("ERROR: currentChatId points to a non-existent chat, this should not happen if chatId is valid.");
        setIsGenerating(false);
        return;
    }

    const oldTitle = chatToUpdate.title;
    const messagesAfterUserMessage = [...chatToUpdate.messages, userMessage];
    const potentialNewTitle = generateChatTitle({ messages: messagesAfterUserMessage });

    let finalTitleForState = oldTitle;
    let shouldRenameDb = false;

    // Condition to update title: only if current title is 'New Chat' AND new proposed title is genuinely different (non-generic)
    if (oldTitle === 'New Chat' && potentialNewTitle !== 'New Chat') {
      finalTitleForState = potentialNewTitle;
      shouldRenameDb = true; // Flag to rename in DB
    }

    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? {
            ...chat,
            messages: messagesAfterUserMessage,
            title: finalTitleForState, // Use the determined final title
            updatedAt: new Date()
          }
        : chat
    ));
    console.log("DEBUG: User message added to state:", userMessage);
    console.log(`DEBUG: Chat title state updated to: "${finalTitleForState}" (old: "${oldTitle}")`);

    // Perform database rename if flagged
    if (shouldRenameDb) {
      console.log(`DEBUG: Calling renameConversation for existing chat. ID: ${chatId}, Title: "${finalTitleForState}"`);
      await renameConversation(chatId, finalTitleForState);
    }
    // --- END MODIFIED LOGIC ---

    setInput('');
    setIsGenerating(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const MEMORY_SHOT = parseInt(process.env.REACT_APP_MEMORY_SHOT || '4', 10);
      // Use messagesAfterUserMessage which now includes the latest user message
      const allMessages = messagesAfterUserMessage;

      const previousMessages = [];
      let pair = [];

      // Traverse backwards to collect message pairs
      for (let i = allMessages.length - 1; i >= 0; i--) {
        const msg = allMessages[i];

        if (msg.role === 'assistant') {
          pair.push({
            role: 'assistant',
            content: msg.content || ''
          });
        }

        if (msg.role === 'user') {
          pair.push({
            role: 'user',
            content: msg.content || ''
          });

          if (pair.length === 2) {
            if (pair[0].role === 'assistant') pair.reverse();

            previousMessages.push(...pair);
            pair = [];
          }
        }

        if (previousMessages.length >= MEMORY_SHOT * 2) break;
      }

      const payload = {
        message: input.trim(),
        messages: previousMessages,
        user_details: {
          user_id: account?.id || 'user_123',
          user_objectid: account?.oid || 'user_obj_456',
        },
        client: platformInfo.icon || 'web',
        tool_name: 'rag_tool',
        trace_id: '',
        conversation_id: parseInt(chatId, 10), // Pass the conversation ID to the API, ensure it's an integer
      };

      console.log("DEBUG: Sending payload to chat API:", payload);
      console.log("Token:", token);

      const response = await fetch(`${API_BASE}/chat/${ENV_PROJECT}/${selectedProjectVersion}`, { // Using App2.js API endpoint
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error((await response.json()).error || `HTTP ${response.status}`);

      const data = await response.json();
      let aiContent = data.answer || data.choices?.[0]?.message?.content || 'Sorry, I received an empty response.'; // Combined response parsing
      if (data.traceid){
        console.log(aiContent);
        setTraceId(data.traceid);
        console.log("DEBUG: Trace Id noted:", data.traceid); // Log the new trace ID
      }

      // Parse references using the combined logic
      const { images, references } = parseRAGResponse(aiContent, data.source_documents);

            const assistantId = (Date.now() + 1).toString();
      const responseTime = new Date().toISOString(); // Timestamp for AI response

      // const images =[]
      // const references=[]
      // const aiContent=''


      let newMessage = {
        id: assistantId,
        content: aiContent, // Start empty for typing animation
        role: 'assistant',
        timestamp: new Date(),
        images,
        references,
        model: selectedProjectVersion, // Added version to message
        conversation_id: chatId // Added conversation_id here
      };

      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, newMessage], updatedAt: new Date() }
          : chat
      ));
      console.log("DEBUG: Assistant message added to state:", newMessage);


      // Store message in database
      try {
        const messagePayload = {
          conversation_id: parseInt(chatId, 10), // Ensure conversation_id is an integer for the DB API
          user_text: userMessage.content,
          response_text: aiContent,
          reference_text: JSON.stringify(references), // Store references as a JSON string
          user_message_time: userMessageTime,
          response_time: responseTime,
        };

        console.log("DEBUG: Attempting to store message in DB with payload:", messagePayload);
        const dbMessageResponse = await fetch(`${DB_API_BASE}/chat-history/messages?project_id=${ENV_PROJECT}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(messagePayload),
        });

        if (!dbMessageResponse.ok) {
          const errorData = await dbMessageResponse.json();
          console.error('ERROR: Failed to store message in DB:', errorData);
        } else {
          console.log('DEBUG: Message stored in DB successfully.');
        }
      } catch (dbError) {
        console.error('ERROR: Error storing message in DB:', dbError);
      }

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
        references: [],
        conversation_id: chatId // Ensure conversation_id is here for error messages too
      };

      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, errorMessage], updatedAt: new Date() }
          : chat
      ));
      console.error("ERROR: Message generation failed:", error);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
      console.log("DEBUG: Generation process finished.");
    }
  }, [input, isGenerating, currentChatId, chats, generateChatTitle, parseRAGResponse, selectedProjectVersion, platformInfo, account, token, renameConversation]);


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

  // Effect to fetch ALL conversations when component mounts or token/account changes
  useEffect(() => {
    const fetchAllConversations = async () => {
      console.log(token);
      if (token && account && hasInitialized) {
        console.log("DEBUG: Attempting to fetch all conversations.");
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
            throw new Error(`Failed to fetch all conversations: ${errorData.detail?.[0]?.msg || response.statusText}`);
          }

          const data = await response.json();
          console.log("DEBUG: Fetched all conversations:", data);

          // Assuming data is an array of conversation objects
          const formattedChats = data.map(conv => ({
            id: String(conv.conversation_id), // Ensure ID is string for local state
            title: conv.conversation_name || 'New Chat', // Use conversation_name if available
            messages: [], // Messages will be fetched when conversation is selected
            createdAt: new Date(conv.last_message_time || Date.now()), // Use last_message_time or current time
            updatedAt: new Date(conv.last_message_time || Date.now())
          }));
          setChats(formattedChats);
          console.log("DEBUG: All conversations loaded into state:", formattedChats);

          // If there are conversations, set the most recent one as current
          if (formattedChats.length > 0) {
            const mostRecentChat = formattedChats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
            setCurrentChatId(mostRecentChat.id);
            console.log("DEBUG: Setting most recent conversation as current:", mostRecentChat.id);
          } else {
            setCurrentChatId(null);
            console.log("DEBUG: No conversations found, currentChatId set to null.");
          }

        } catch (error) {
          console.error('ERROR: Error fetching all conversations:', error);
        }
      } else if (!token) {
        console.log("DEBUG: No token available, cannot fetch all conversations.");
        setChats([]); // Clear chats if no token
        setCurrentChatId(null);
      } else if (!account) {
        console.log("DEBUG: No account available, cannot fetch all conversations.");
        setChats([]); // Clear chats if no account
        setCurrentChatId(null);
      } else if (!hasInitialized) {
        console.log("DEBUG: App not initialized, deferring fetch of all conversations.");
      }
    };

    fetchAllConversations();
  }, [token, account, hasInitialized]); // Depend on token, account, and hasInitialized


  // Effect to fetch chat messages when currentChatId changes
  useEffect(() => {
    const fetchChatMessages = async () => {
      // Find the current chat object from the 'chats' state
      const chatBeingConsidered = chats.find(chat => chat.id === currentChatId);

      // Condition to skip API call for newly created chats:
      // If a new chat was just created AND it has no messages locally yet,
      // then we don't need to fetch from the DB immediately.
      if (justCreatedNewChat && chatBeingConsidered && chatBeingConsidered.messages.length === 0) {
        console.log("DEBUG: Skipping message fetch for newly created empty chat.");
        setJustCreatedNewChat(false); // Reset the flag
        setIsLoadingMessages(false); // Ensure loading indicator is off
        return;
      }

      if (currentChatId && token) { // Ensure currentChatId and token are available
        console.log(`DEBUG: Fetching messages for conversation ID: ${currentChatId}`);
        setIsLoadingMessages(true); // Set loading state to true
        try {
          // Convert currentChatId to an integer as the API expects it
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
            throw new Error(`Failed to fetch messages: ${errorData.detail?.[0]?.msg || response.statusText}`);
          }

          const data = await response.json();
          console.log("DEBUG: Fetched messages from DB:", data);

          // Process messages: create combined user/assistant message pairs
          const fetchedMessages = [];
          data.messages.forEach(msg => {
            if (msg.user_text !== null) {
              fetchedMessages.push({
                id: msg.message_id.toString(),
                content: msg.user_text,
                role: 'user',
                timestamp: new Date(msg.user_message_time),
                conversation_id: currentChatId // Corrected: Add conversation_id here
              });
            }
            if (msg.response_text !== null) {
              let references = [];
              try {
                // Attempt to parse reference_text as JSON, if it's a non-empty string
                if (msg.reference_text && typeof msg.reference_text === 'string') {
                  const parsedRef = JSON.parse(msg.reference_text);
                  // Ensure parsed result is an array, otherwise default to empty array
                  references = Array.isArray(parsedRef) ? parsedRef : [];
                }
              } catch (parseError) {
                console.error('ERROR: Failed to parse reference_text as JSON:', msg.reference_text, parseError);
                references = []; // Fallback to empty array if parsing fails
              }

              fetchedMessages.push({
                id: `${msg.message_id}-ai`,
                content: msg.response_text,
                role: 'assistant',
                timestamp: new Date(msg.response_time),
                references: references,
                conversation_id: currentChatId // Corrected: Add conversation_id here
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
              console.log("DEBUG: Chats state updated for current chat ID:", currentChatId, updatedChats[chatIndex]);
              return updatedChats;
            }
            console.warn("WARN: Could not find chat with ID", currentChatId, "to update messages.");
            return prev; // Return previous state if chat not found
          });
          console.log("DEBUG: Messages loaded into state for current chat:", fetchedMessages);
          scrollToBottom();

        } catch (error) {
          console.error('ERROR: Error fetching chat messages:', error);
          // Optionally, show an error message to the user
        } finally {
          setIsLoadingMessages(false);
          setJustCreatedNewChat(false); // Reset the flag here too, in case of error during fetch
        }
      } else if (!currentChatId) {
        console.log("DEBUG: No currentChatId, not fetching messages.");
        setChats(prev => prev.map(chat => // Clear messages if no chat selected
          chat.id === currentChatId ? { ...chat, messages: [] } : chat
        ));
      }
    };

    fetchChatMessages();
  }, [currentChatId, token, scrollToBottom, justCreatedNewChat]); // Removed 'chats' from dependencies


  // Event listener for 'version-selected' from App2.js (updated to use selectedProjectVersion)
  useEffect(() => {
    const handler = (e) => {
      const selectedVersion = e.detail;
      setSelectedProjectVersion(selectedVersion);
      console.log("DEBUG: Version changed to:", selectedVersion);

      // This message should be added to the current chat
      const versionMessage = {
        id: (Date.now() + 1).toString(),
        content: `Version has been switched to ${selectedVersion}`,
        role: "assistant",
        timestamp: new Date(),
        conversation_id: currentChatId // Corrected: Add conversation_id here
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
      console.log("DEBUG: Version switch message added to current chat.");
    };

    window.addEventListener("version-selected", handler);
    return () => window.removeEventListener("version-selected", handler);
  }, [currentChatId]);


  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log("DEBUG: Enter key pressed. Initiating send/stop generation.");
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
        isTeams={platformInfo.isTeams}
        onRenameChat={renameConversation} // Pass rename function to sidebar
      />

      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ${
        isReferencesOpen ? 'mr-80' : ''
      }`}>

        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0"> {/* Adjusted py-4 from App1.js, px-4 from App2.js */}
          {isLoadingMessages ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Loading messages...
            </div>
          ) : currentChat?.messages.length === 0 ? (
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
              {console.log("RENDER DEBUG: currentChat:", currentChat)}
              {console.log("RENDER DEBUG: currentChat messages length:", currentChat?.messages?.length)}
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
                  <CompactVersionSelector
                    selectedProjectVersion={selectedProjectVersion}
                    onProjectVersionChange={setSelectedProjectVersion}
                    disabled={isGenerating}
                  />
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
