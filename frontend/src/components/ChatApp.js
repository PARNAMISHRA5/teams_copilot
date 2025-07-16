import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  SendHorizontal,
  Plus,
  MessageSquare,
  Sparkles,
  Menu,
  Square,
  Check,
  Monitor,
  Smartphone,
  Globe,
  ChevronDown,
  Settings,
  Dna,
  Asterisk,
} from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import ChatMessage from "./ChatMessage";
import ProfileMenu from "./ProfileMenu";
import ReferencesPanel from "./ReferencesPanel"; // Using App1.js path
import CompanyLogo from "../assets/DBD_BIG.png";

const ENV_PROJECT = process.env.REACT_APP_SELECTED_PROJECT;
const API_BASE = process.env.REACT_APP_API_URL;

// VERSIONS_AVAILABLE from App1.js (renamed from AI_MODELS)
// Replace the existing VERSIONS_AVAILABLE array with this:
// Replace the existing getVersionsFromEnv function with this improved version:

// Replace the existing getVersionsFromEnv function and VERSIONS_AVAILABLE constant with this:

const getVersionsFromEnv = () => {
  const versionsString = process.env.REACT_APP_AVAILABLE_VERSIONS;
  
  console.log('Raw environment variable:', versionsString);
  
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
    
    console.log('Cleaned string:', cleanedString);
    
    // Parse as JSON
    const parsed = JSON.parse(cleanedString);
    console.log('Parsed JSON:', parsed);
    
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
    
    console.log('Final result:', result);
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


// Simplified platform detection from App1.js
const detectPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  const isInTeams =
    window.location.href.includes("teams.microsoft.com") ||
    window.parent !== window ||
    userAgent.includes("teams");

  if (isInTeams) {
    return {
      source: "Microsoft Teams",
      platform: "Teams",
      icon: "teams",
      isTeams: true,
    };
  }

  let browser = "Unknown";
  if (userAgent.includes("chrome") && !userAgent.includes("edg")) {
    browser = "Chrome";
  } else if (userAgent.includes("firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
    browser = "Safari";
  } else if (userAgent.includes("edg")) {
    browser = "Edge";
  }

  return {
    source: "Web Browser",
    platform: browser,
    icon: "web",
    isTeams: false,
  };
};


// Compact Version Selector Component from App1.js (props updated)

// Updated CompactVersionSelector with better mobile integration



// Fixed CompactVersionSelector component
const CompactVersionSelector = ({
  selectedProjectVersion,
  onProjectVersionChange,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);

  /* ---------- screen‑size checker ---------- */
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  /* ---------- disable body scroll when mobile sheet open ---------- */
  useEffect(() => {
    if (isMobile && isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isMobile, isOpen]);

  /* ---------- outside click ---------- */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isOpen]);

  // FIX 2: Improved choose function with proper callback and immediate state update
  // MOVED BEFORE EARLY RETURN TO FIX HOOKS ERROR
  const choose = useCallback((id) => {
    console.log("Choosing version:", id);
    setIsOpen(false);
    
    // Immediately call the callback function to update parent state
    if (onProjectVersionChange && typeof onProjectVersionChange === 'function') {
      console.log("Calling onProjectVersionChange with:", id);
      onProjectVersionChange(id);
    } else {
      console.error("onProjectVersionChange is not a function:", onProjectVersionChange);
    }
  }, [onProjectVersionChange]);

  if (!VERSIONS_AVAILABLE.length) return null;

  // FIX 1: Better selected version finding with fallback
  const selected = VERSIONS_AVAILABLE.find((v) => v.id === selectedProjectVersion) || VERSIONS_AVAILABLE[0];
  
  console.log("Selected Version ID:", selectedProjectVersion);
  console.log("Available IDs:", VERSIONS_AVAILABLE.map(v => v.id));
  console.log("Selected object:", selected);

  /* ---------- shared option list ---------- */
  const options = () => (
    <div className="py-2 overflow-y-auto max-h-[70vh]">
      {VERSIONS_AVAILABLE.map((v) => (
        <button
          key={v.id}
          onClick={() => choose(v.id)}
          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
            selectedProjectVersion === v.id ? "bg-blue-50 text-blue-600" : "text-gray-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">
              {v.name}
            </span>
            {selectedProjectVersion === v.id && (
              <Check className="w-4 h-4 text-blue-500 shrink-0" />
            )}
          </div>
          {v.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {v.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );

  /* ---------- desktop popover ---------- */
  const desktopDropdown = (
    <div
      className="absolute z-[9999] w-80 max-h-96 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
      style={{
        top:
          (containerRef.current?.getBoundingClientRect().bottom || 0) +
          window.scrollY +
          8,
        left:
          (containerRef.current?.getBoundingClientRect().left || 0) +
          window.scrollX,
      }}
    >
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold">Select Project Version</h3>
      </div>
      {options()}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500">
          Choose the version that best fits your needs
        </p>
      </div>
    </div>
  );

  /* ---------- mobile bottom sheet ---------- */
  const mobileSheet = (
    <div className="fixed inset-x-4 bottom-4 z-[10000] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom fade-in">
      <div className="flex justify-center py-3 border-b border-gray-100">
        <div className="w-12 h-1 bg-gray-300 rounded-full" />
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold">Select Project Version</h3>
      </div>
      {options()}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <button
          onClick={() => setIsOpen(false)}
          className="w-full py-3 text-center text-gray-600 font-medium hover:text-gray-800"
        >
          Close
        </button>
      </div>
    </div>
  );

  /* ---------- trigger ---------- */
  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => !disabled && setIsOpen((p) => !p)}
        disabled={disabled}
        title={`Current version: ${selected.name}`}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all border ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${
          isMobile
            ? "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-sm"
        } ${isOpen ? "ring-2 ring-blue-500/20" : ""}`}
        style={{ minWidth: "6rem", maxWidth: "9rem" }}
      >
        <span className="text-xs font-medium text-left whitespace-nowrap overflow-hidden text-ellipsis max-w-[10rem] sm:max-w-[12rem]">
          {selected.name || "Select Version"}
        </span>

        <ChevronDown
          className={`w-3 h-3 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ----- PORTAL CONTENT ----- */}
      {isOpen &&
        createPortal(
          <>
            {/* backdrop */}
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-[9998]"
            />
            {isMobile ? mobileSheet : desktopDropdown}
          </>,
          document.body
        )}
    </div>
  );
};


function App({ account, logout }) {
  // Merged App and ChatApp signatures
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [hasResetToLanding, setHasResetToLanding] = useState(false); // From App2, but renamed to hasResetToLanding for clarity
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [selectedMessageReferences, setSelectedMessageReferences] =
    useState(null);
  const [abortController, setAbortController] = useState(null);

    const [selectedProjectVersion, setSelectedProjectVersion] = useState(() => {
    // Default to first version if available, otherwise empty string
      return VERSIONS_AVAILABLE.length > 0 ? VERSIONS_AVAILABLE[0].id : '';
    });
  const [traceId, setTraceId] = useState(""); // From App2.js

  // From App2.js, related to ProfileMenu dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const referencePanelRef = useRef(null);

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const showLanding = !currentChatId;
  const platformInfo = detectPlatform(); // From App1.js

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const closeReferences = useCallback(() => {
    setIsReferencesOpen(false);
    setSelectedMessageReferences(null);
  }, []);

  // Handle click outside to close references panel (Combined from both, logic is similar)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isReferencesOpen &&
        referencePanelRef.current &&
        !referencePanelRef.current.contains(event.target)
      ) {
        const isReferencesButton = event.target.closest(
          "[data-references-button]"
        );
        if (!isReferencesButton) {
          closeReferences();
        }
      }
    };

    if (isReferencesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isReferencesOpen, closeReferences]);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      sessionStorage.removeItem("hasVisited");
      return;
    }

    const isFirstLoadOfSession =
      sessionStorage.getItem("hasVisited") !== "true";

    try {
      const savedChats = localStorage.getItem("teams-copilot-chats");
      const savedCurrentChatId = localStorage.getItem(
        "teams-copilot-current-chat"
      );
      const savedSidebarState = localStorage.getItem(
        "teams-copilot-sidebar-collapsed"
      );
      const savedProjectVersion = localStorage.getItem(
        "teams-copilot-selected-project-version"
      ); // Updated key

      if (savedChats) {
        const parsedChats = JSON.parse(savedChats).map((chat) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setChats(parsedChats);

        if (isFirstLoadOfSession) {
          setCurrentChatId(null);
        } else {
          if (
            savedCurrentChatId &&
            parsedChats.find((c) => c.id === savedCurrentChatId)
          ) {
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
      // In the localStorage loading useEffect, replace the savedProjectVersion section:
      if (savedProjectVersion && VERSIONS_AVAILABLE.some(v => v.id === savedProjectVersion)) {
        setSelectedProjectVersion(savedProjectVersion);
      } else if (VERSIONS_AVAILABLE.length > 0) {
        setSelectedProjectVersion(VERSIONS_AVAILABLE[0].id);
      }
    } catch (err) {
      console.error("Failed to load from localStorage:", err);
      setCurrentChatId(null);
    }

    setHasInitialized(true);
    if (account) {
      sessionStorage.setItem("hasVisited", "true");
    }
  }, [account]);
  const handleMobileToggle = useCallback((isOpen) => {
    setIsMobileOpen(isOpen);
  }, []);

  // Debounced localStorage saves (Combined from both)
  useEffect(() => {
    if (hasInitialized) {
      const timer = setTimeout(() => {
        localStorage.setItem("teams-copilot-chats", JSON.stringify(chats));
        localStorage.setItem(
          "teams-copilot-selected-project-version",
          selectedProjectVersion
        ); // Updated key
        localStorage.setItem(
          "teams-copilot-sidebar-collapsed",
          JSON.stringify(isSidebarCollapsed)
        );
        if (currentChatId) {
          localStorage.setItem("teams-copilot-current-chat", currentChatId);
        } else {
          localStorage.removeItem("teams-copilot-current-chat");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    chats,
    selectedProjectVersion,
    isSidebarCollapsed,
    currentChatId,
    hasInitialized,
  ]);

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
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const handleReferencesToggle = useCallback(
    (messageId, references) => {
      if (
        isReferencesOpen &&
        selectedMessageReferences?.messageId === messageId
      ) {
        closeReferences();
      } else {
        setSelectedMessageReferences({ messageId, references });
        setIsReferencesOpen(true);
      }
    },
    [isReferencesOpen, selectedMessageReferences?.messageId, closeReferences]
  );

  const createNewChat = useCallback(() => {
    const newChat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  }, []);

  const generateChatTitle = useCallback((chat) => {
    if (!chat.messages?.length) return "New Chat";

    const greetings = ["hi", "hello", "hey", "thanks", "ok", "yes", "no"];
    const isGreetingMessage = (text) => {
      const cleanText = text
        .replace(/[.,!?;:]+$/, "")
        .trim()
        .toLowerCase();
      return greetings.some(
        (greet) =>
          cleanText === greet ||
          cleanText.startsWith(greet + " ") ||
          cleanText.length <= 3
      );
    };

    const firstValidUserMessage = chat.messages.find(
      (msg) =>
        msg.role === "user" &&
        msg.content?.trim() &&
        !isGreetingMessage(msg.content) &&
        msg.content.length >= 4
    );

    if (!firstValidUserMessage) return "New Chat";

    let title = firstValidUserMessage.content.trim().replace(/[*_`~]/g, "");
    if (title.length > 50) {
      const truncated = title.substring(0, 47);
      const lastSpace = truncated.lastIndexOf(" ");
      title =
        (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) +
        "...";
    }

    return (
      title.charAt(0).toUpperCase() + title.slice(1).replace(/[.!?]+$/, "")
    );
  }, []);

  const deleteChat = useCallback(
    (chatId) => {
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (currentChatId === chatId) setCurrentChatId(null);
    },
    [currentChatId]
  );

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
      uniqueImages.forEach((match) => {
        const index = match.split("_")[1];
        images.push({
          index,
          url: `/api/images/${match}.jpeg`,
          alt: `Reference Image ${index}`,
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
              url:
                metadata.url ||
                `${DUMMY_URL}?doc=${encodeURIComponent(
                  metadata.source || "unknown"
                )}`,
              excerpt: doc.page_content || "",
              relevanceScore: parseFloat(
                doc.relevance_score || metadata.score || 0.75
              ),
              type: "document",
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
        {
          keywords: ["api", "endpoint", "rest"],
          ref: {
            id: "ref-api-1",
            title: "REST APIs for OCM Functionality",
            source: "Technical Documentation",
            type: "documentation",
          },
        },
        {
          keywords: ["integrity", "validation"],
          ref: {
            id: "ref-integrity-1",
            title: "Integrity Validation Process",
            source: "System Guide",
            type: "guide",
          },
        },
        {
          keywords: ["authentication", "security"],
          ref: {
            id: "ref-auth-1",
            title: "HTTP Basic Authentication",
            source: "Security Documentation",
            type: "security",
          },
        },
      ];

      refTypes.forEach(({ keywords, ref }) => {
        if (keywords.some((keyword) => contentLower.includes(keyword))) {
          references.push({
            ...ref,
            relevanceScore: Math.random() * 0.3 + 0.7,
          });
        }
      });

      if (references.length === 0) {
        references.push({
          id: "ref-general-1",
          title: "Teams Copilot Documentation",
          source: "User Guide",
          type: "guide",
          relevanceScore: 0.7,
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
        title:
          input.trim().slice(0, 50) + (input.trim().length > 50 ? "..." : ""),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setChats((prev) => [newChat, ...prev]);
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    const userMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              title:
                chat.messages.length === 0
                  ? generateChatTitle({ messages: [userMessage] })
                  : chat.title,
              updatedAt: new Date(),
            }
          : chat
      )
    );

    setInput("");
    setIsGenerating(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const currentChatMessages =
        chats.find((c) => c.id === chatId)?.messages || [];

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
        trace_id: "",
      };

      console.log("🚀 Final Payload to Backend:", payload);

      const response = await fetch(
        VERSIONS_AVAILABLE.length > 0 
          ? `${API_BASE}/chat/${ENV_PROJECT}/${selectedProjectVersion}`
          : `${API_BASE}/chat/${ENV_PROJECT}`,
        {
          // Using App2.js API endpoint
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      if (!response.ok)
        throw new Error(
          (await response.json()).error || `HTTP ${response.status}`
        );

      const data = await response.json();
      let aiContent =
        data.answer ||
        data.choices?.[0]?.message?.content ||
        "Sorry, I received an empty response."; // Combined response parsing
      if (data.traceid) {
        console.log(aiContent);
        setTraceId(data.traceid);
        console.log("Trace Id noted: ", data.traceid); // Log the new trace ID
      }

      // Parse references using the combined logic
      const { images, references } = parseRAGResponse(
        aiContent,
        data.source_documents
      );

      const assistantId = (Date.now() + 1).toString();

      let newMessage = {
        id: assistantId,
        content: aiContent, // Start empty for typing animation
        role: "assistant",
        timestamp: new Date(),
        images,
        references,
        model: selectedProjectVersion, // Added version to message
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, newMessage],
                updatedAt: new Date(),
              }
            : chat
        )
      );

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
      const errorContent =
        error.name === "AbortError"
          ? "Response generation was stopped."
          : `Sorry, I encountered an error: ${error.message}.`;

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: "assistant",
        timestamp: new Date(),
        images: [],
        references: [],
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, errorMessage],
                updatedAt: new Date(),
              }
            : chat
        )
      );
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [
    input,
    isGenerating,
    currentChatId,
    chats,
    generateChatTitle,
    parseRAGResponse,
    selectedProjectVersion,
    platformInfo,
    account,
  ]);

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

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        isGenerating ? stopGeneration() : sendMessage();
      }
    },
    [isGenerating, stopGeneration, sendMessage]
  );

  // Combined handleTextareaInput to include platform-specific max-height from App1.js
  const handleTextareaInput = useCallback(
    (e) => {
      const target = e.target;
      target.style.height = "auto";
      target.style.height =
        Math.min(target.scrollHeight, platformInfo.isTeams ? 32 : 96) + "px"; // Max height 32px for Teams (2 lines) and 96px for web (6 lines based on App2.js)
    },
    [platformInfo.isTeams]
  );

  // Landing page rendering (Combined from both, prioritizing App1.js structure and styling for landing)
if (showLanding) {
  return (
    <div
      className={`min-h-screen max-h-screen flex overflow-hidden ${
        platformInfo.isTeams
          ? "bg-white"
          : "bg-gradient-to-br from-slate-50 to-blue-50"
      }`}
    >
      {/* Mobile Header with Hamburger Menu Only */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <button
            data-hamburger-menu
            onClick={() => handleMobileToggle(true)}
            className="w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" />
      )}

      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
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

      <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
        {isMobile ? (
  /* ===== MOBILE LANDING ===== */
  <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
    {/* Logo */}
    <img
      src={CompanyLogo}
      alt="Company Logo"
      className="w-20 h-20 object-contain mb-6 drop-shadow-md"
    />

    {/* Greeting */}
    <p className="text-gray-600 text-base leading-relaxed mb-8">
      Hello {account?.name || "Guest"}! Welcome to{" "}
      <span className="font-semibold">AI‑DN {ENV_PROJECT}</span>.
    </p>

    {/* Input bar */}
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex items-center gap-2">
        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask me anything..."
          disabled={isGenerating}
          rows={1}
          onInput={handleTextareaInput}
          className="flex-1 resize-none text-sm outline-none placeholder-gray-400 bg-transparent min-h-[20px] max-h-[96px] leading-[1.4]"
          style={{ overflow: 'hidden' }}
        />

        {/* Version selector */}
        <CompactVersionSelector
          selectedProjectVersion={selectedProjectVersion}
          onProjectVersionChange={setSelectedProjectVersion}
          disabled={isGenerating}
        />

        {/* Send / Stop button */}
        <button
          onClick={isGenerating ? stopGeneration : sendMessage}
          disabled={!isGenerating && !input.trim()}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-white transition-all ${
            isGenerating
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          }`}
        >
          {isGenerating ? (
            <Square className="w-4 h-4" />
          ) : (
            <SendHorizontal className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>

    {/* Status */}
    {isGenerating && (
      <p className="text-xs text-gray-400 mt-4">
        AI is generating a response…
      </p>
    )}
  </div>
) :  (
          // Desktop version (unchanged)
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
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
                  Hello {account?.name || "Guest"}! Welcome to{" "}
                  <span className="font-semibold">AI-DN {ENV_PROJECT}</span>.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mx-4 sm:mx-0">
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
                    <div className="min-w-fit max-w-none">
                      <CompactVersionSelector
                        selectedProjectVersion={selectedProjectVersion}
                        onProjectVersionChange={setSelectedProjectVersion}
                        disabled={isGenerating}
                      />
                    </div>
                    <button
                      onClick={isGenerating ? stopGeneration : sendMessage}
                      disabled={!isGenerating && !input.trim()}
                      className={`flex items-center justify-center w-7 h-7 text-white rounded-md transition-all duration-200 flex-shrink-0 ${
                        isGenerating
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {isGenerating ? (
                        <Square className="w-3 h-3" />
                      ) : (
                        <SendHorizontal className="w-3 h-3" />
                      )}
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
        )}
      </div>
    </div>
  );
}



  // Chat interface rendering (Combined from both)
  return (
<div
  className={`min-h-screen max-h-screen flex overflow-hidden ${
    platformInfo.isTeams ? "bg-gray-50" : "bg-white"
  } relative`}
>

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



      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" />
      )}

      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
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

      <div
        className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ${
          isReferencesOpen ? "mr-0 lg:mr-80" : ""
        } ${isMobile ? "pt-16" : ""}`}
      >
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 min-h-0">
          {currentChat?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center px-4">
              <div className="text-center max-w-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-gray-500">
                  Ask me anything reagrding TM Documentation
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
              {currentChat?.messages.map((message) => (
                <div key={message.id} className="w-full">
                  <ChatMessage
                    message={message}
                    onReferencesClick={handleReferencesToggle}
                    isReferencesOpen={
                      isReferencesOpen &&
                      selectedMessageReferences?.messageId === message.id
                    }
                  />
                </div>
              ))}
              {isGenerating && (
                <div className="w-full">
                  <ChatMessage
                    message={{
                      id: "generating",
                      content: "",
                      role: "assistant",
                      timestamp: new Date(),
                      images: [],
                      references: [],
                      model: selectedProjectVersion,
                    }}
                    isGenerating={true}
                    onReferencesClick={handleReferencesToggle}
                  />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

    

{/* Input area */}
<div
  className={`bg-white border-t border-gray-200 flex-shrink-0 ${
    platformInfo.isTeams ? "px-2 sm:px-3 py-2" : "px-2 sm:px-4 py-2"
  }`}
>
  {/* Changed max-w-3xl to max-w-4xl to match chat messages container */}
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
          onChange={(e) => setInput(e.target.value)}
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
                  : "max-w-[120px] sm:max-w-[140px]"
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

    {/* Status indicators and disclaimer */}
    <div className="flex items-center justify-center mt-1">
      {isGenerating ? (
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
          <p
            className={`text-gray-400 ${
              platformInfo.isTeams ? "text-[9px]" : "text-[10px]"
            }`}
          >
            Generating...
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
    </div>
  );
}

export default App;
