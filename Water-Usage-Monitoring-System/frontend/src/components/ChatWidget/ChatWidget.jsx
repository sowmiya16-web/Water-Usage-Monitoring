import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { SUPPORTED_LANGUAGES } from "../../context/translationData.js";
import { API_BASE_URL } from "../../services/apiConfig";
import "./ChatWidget.css";

// API_BASE_URL already ends in "/api" (see apiConfig.js), so strip that suffix here
// since this file builds its own "/api/chat/..." paths below.
const API_BASE = API_BASE_URL.replace(/\/api$/, "");

/* ─── Helper: get auth state from localStorage ─── */
function getAuthState() {
  return {
    isAuthenticated: localStorage.getItem("isAuthenticated") === "true",
    userRole: localStorage.getItem("userRole") || "guest",
    token: localStorage.getItem("authToken") || "",
    userName: localStorage.getItem("userName") || "",
  };
}

/**
 * Page & Role Detection (with swapped role names):
 * - /admin/*           -> Community Admin (System-wide management)
 * - /community-admin/* -> Admin (Community/Property scoped)
 * - /resident/*        -> Resident (Personal account)
 * - / or /login        -> Guest (Public website)
 */
function getActivePortalMeta(pathname, authRole) {
  if (pathname.startsWith("/admin")) {
    return {
      portalId: "community_admin",
      roleLabel: "Community Admin",
      badgeClass: "badge-community",
      portalName: "Community Admin Portal",
    };
  }
  if (pathname.startsWith("/community-admin")) {
    return {
      portalId: "admin",
      roleLabel: "Admin",
      badgeClass: "badge-admin",
      portalName: "Admin Portal",
    };
  }
  if (pathname.startsWith("/resident")) {
    return {
      portalId: "resident",
      roleLabel: "Resident",
      badgeClass: "badge-resident",
      portalName: "Resident Portal",
    };
  }
  // Public landing/login pages
  return {
    portalId: "guest",
    roleLabel: "Guest",
    badgeClass: "badge-guest",
    portalName: "Public Website",
  };
}

/* ─── Greetings & quick prompts ───
   Written once in English. AquaBot's own replies are generated natively
   in the chosen language by Gemini (see sendMessage); these static UI
   strings ride along with the site-wide Google Translate widget when a
   non-English site language is active, so no per-language duplication
   is needed here. */
function getGreeting(portalId, userName) {
  const name = userName ? `, ${userName}` : "";

  if (portalId === "community_admin") {
    return `Hello Community Admin${name}! Ask me about system-wide water consumption, total residents, all buildings, active alerts, and billing stats.`;
  }
  if (portalId === "admin") {
    return `Hello Admin${name}! Ask me about your assigned community's residents, smart water meters, and maintenance tasks.`;
  }
  if (portalId === "resident") {
    return `Hello Resident${name}! Ask me about your current bill, meter readings, water consumption, or active alerts.`;
  }
  return "Hello! I am AquaBot. Ask me anything about our Smart Water Usage Monitoring System, website features, workflow, or how to get started!";
}

function getQuickQuestions(portalId) {
  switch (portalId) {
    case "community_admin":
      return ["Which household uses the most water?", "Compare household usage this month", "How many households and residents?", "Pending bills count?"];
    case "admin":
      return ["Which household uses the most water?", "Show a household's usage history", "How do I add a household?", "Billing status of community"];
    case "resident":
      return ["What is my current bill?", "My meter reading", "Do I have any alerts?", "When is bill due?"];
    default:
      return ["What is this system?", "How do smart meters work?", "What features are available?", "How do I log in?"];
  }
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─── SVG Icons ─── */
const IconDroplet = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-13-7-13z" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconBot = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-4 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-4 5c1.5 0 2.5-.67 3-1.5H9c.5.83 1.5 1.5 3 1.5z" />
  </svg>
);

const IconGlobe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

/* ══════════════════════════════════════════════
   MAIN MULTILINGUAL & PAGE-AWARE CHATWIDGET
══════════════════════════════════════════════ */
export default function ChatWidget() {
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const { currentLanguage: language, setLanguage } = useLanguage();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevPathRef = useRef(location.pathname);

  const { isAuthenticated, userRole, token, userName } = getAuthState();
  const { portalId, roleLabel, badgeClass } = getActivePortalMeta(location.pathname, userRole);
  const quickQuestions = getQuickQuestions(portalId);
  const currentGreeting = getGreeting(portalId, userName);

  /* ── 1. Page Navigation Reset (Fresh Session across portals) ── */
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      // Clear conversation and reset session state for the new portal
      setMessages([]);
      setInput("");
      setIsLoading(false);
      setShowWelcome(true);
      setHasUnread(false);
    }
  }, [location.pathname]);

  /* ── 2. Persist language choice across entire app ── */
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* ── Focus input on open ── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
      setHasUnread(false);
    }
  }, [isOpen]);

  /* ── 3. Close with animation & Clear Session State (Fresh session next time) ── */
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      // Reset chatbot session when closed
      setMessages([]);
      setInput("");
      setIsLoading(false);
      setShowWelcome(true);
      setHasUnread(false);
    }, 220);
  };

  /* ── 4. New Chat (Fresh session manually) ── */
  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setIsLoading(false);
    setShowWelcome(true);
  };

  /* ── 5. Send message ── */
  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text: trimmed,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setShowWelcome(false);

    try {
      let endpoint, headers, body;

      // When in portal routes and authenticated, use /api/chat/message with JWT
      const isPortalRoute = location.pathname.startsWith("/admin") ||
                            location.pathname.startsWith("/community-admin") ||
                            location.pathname.startsWith("/resident");

      if (isAuthenticated && token && isPortalRoute) {
        endpoint = `${API_BASE}/api/chat/message`;
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
      } else {
        endpoint = `${API_BASE}/api/chat/public`;
        headers = { "Content-Type": "application/json" };
      }

      // Recent conversation turns (before this new message) so Gemini can
      // hold context across the chat, ChatGPT-style — e.g. resolve "what
      // about last month's?" against what was just discussed.
      const history = messages.slice(-10).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        text: m.text.slice(0, 2000),
      }));

      body = JSON.stringify({
        message: trimmed,
        language: language,
        currentPage: location.pathname,
        history,
      });

      const res = await fetch(endpoint, { method: "POST", headers, body });
      const data = await res.json();

      const reply =
        data?.data?.reply ||
        data?.reply ||
        "I couldn't get a response. Please try again.";

      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        text: reply,
        time: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
      if (!isOpen) setHasUnread(true);

    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: "⚠️ Connection error. Please make sure the backend is running.",
          time: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isAuthenticated, token, isOpen, language, location.pathname, messages]);

  /* ── Enter key ── */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── Auto-resize textarea ── */
  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  };

  const userInitials = userName
    ? userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : (isAuthenticated ? "U" : "G");

  return (
    <>
      {/* ─── Floating Action Button ─── */}
      <div className="aquabot-fab-wrapper">
        {hasUnread && !isOpen && (
          <span className="aquabot-badge-unread" aria-label="Unread message" />
        )}
        <button
          id="aquabot-fab-btn"
          className={`aquabot-fab ${isOpen ? "open" : ""}`}
          onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
          aria-label={isOpen ? "Close AquaBot" : "Open AquaBot AI Assistant"}
          title="AquaBot AI Assistant"
        >
          <span className="aquabot-fab-icon droplet">
            <IconDroplet />
          </span>
          <span className="aquabot-fab-icon close">
            <IconClose />
          </span>
          <span className="aquabot-fab-ring" />
        </button>
      </div>

      {/* ─── Chat Panel ─── */}
      {isOpen && (
        <div
          id="aquabot-panel"
          className={`aquabot-panel ${isClosing ? "closing" : ""}`}
          role="dialog"
          aria-label="AquaBot AI Chat Window"
        >
          {/* Header */}
          <div className="aquabot-header">
            <div className="aquabot-header-left">
              <div className="aquabot-avatar">
                <IconBot />
                <span className="aquabot-status-dot" />
              </div>
              <div className="aquabot-header-info">
                <div className="aquabot-title-row">
                  <span className="aquabot-title">AquaBot</span>
                  <span className={`aquabot-role-badge ${badgeClass}`}>
                    {roleLabel}
                  </span>
                </div>
                <span className="aquabot-subtitle">
                  <span className="aquabot-online-indicator" />
                  Online • AI Assistant
                </span>
              </div>
            </div>

            <div className="aquabot-header-actions">
              {/* Language Selector Dropdown */}
              <div className="aquabot-lang-selector notranslate" translate="no" title="Choose Language (50+ supported)">
                <IconGlobe />
                <select
                  id="aquabot-lang-select"
                  value={language}
                  onChange={handleLanguageChange}
                  aria-label="Select Language"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fresh Session / New Chat button */}
              <button
                id="aquabot-new-chat-btn"
                className="aquabot-btn-icon"
                onClick={handleNewChat}
                title="New Chat (Fresh Session)"
                aria-label="New Chat Session"
              >
                ↺
              </button>

              {/* Close Button */}
              <button
                id="aquabot-close-btn"
                className="aquabot-btn-icon"
                onClick={handleClose}
                aria-label="Close chat"
                title="Close"
              >
                <IconClose />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="aquabot-body">
            {/* Welcome message card */}
            {showWelcome && messages.length === 0 && (
              <div className="aquabot-welcome-card">
                <div className="aquabot-welcome-avatar">
                  <IconBot />
                </div>
                <div className="aquabot-welcome-text">
                  <strong>AquaBot AI</strong>
                  <p>{currentGreeting}</p>
                </div>
              </div>
            )}

            {/* Quick Prompts Chips */}
            {showWelcome && messages.length === 0 && (
              <div className="aquabot-quick-chips">
                <p className="aquabot-quick-label">Suggested Questions:</p>
                <div className="aquabot-chips-list">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      className="aquabot-chip"
                      onClick={() => sendMessage(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message History */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`aquabot-msg-row ${msg.role === "user" ? "user-row" : "bot-row"}`}
              >
                {msg.role === "bot" && (
                  <div className="aquabot-msg-avatar bot">
                    <IconBot />
                  </div>
                )}

                <div className={`aquabot-bubble ${msg.role} ${msg.isError ? "error" : ""}`}>
                  <div className="aquabot-bubble-text" dir="auto">{msg.text}</div>
                  <span className="aquabot-bubble-time">{formatTime(msg.time)}</span>
                </div>

                {msg.role === "user" && (
                  <div className="aquabot-msg-avatar user">
                    {userInitials}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="aquabot-msg-row bot-row">
                <div className="aquabot-msg-avatar bot">
                  <IconBot />
                </div>
                <div className="aquabot-bubble bot typing">
                  <span className="aquabot-typing-dot" />
                  <span className="aquabot-typing-dot" />
                  <span className="aquabot-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="aquabot-footer">
            <div className="aquabot-input-box">
              <textarea
                ref={inputRef}
                id="aquabot-input"
                className="aquabot-textarea"
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask AquaBot anything..."
                dir="auto"
                aria-label="Chat input"
                maxLength={1000}
                disabled={isLoading}
              />
              <button
                id="aquabot-send-btn"
                className={`aquabot-send-btn ${input.trim() ? "active" : ""}`}
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <IconSend />
              </button>
            </div>
            <div className="aquabot-footer-note">
              <span>Powered by Gemini AI • 100+ Languages • Page & Context-Aware</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
