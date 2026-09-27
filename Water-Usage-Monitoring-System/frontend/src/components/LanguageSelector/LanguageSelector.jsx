import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import "./LanguageSelector.css";

export default function LanguageSelector({ variant = "default" }) {
  const { currentLanguage, setLanguage, supportedLanguages, isTranslating } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef(null);

  const currentMeta = supportedLanguages.find((l) => l.code === currentLanguage) || supportedLanguages[0];

  const filteredLanguages = query.trim()
    ? supportedLanguages.filter((l) => {
        const q = query.trim().toLowerCase();
        return l.label.toLowerCase().includes(q) || l.native.toLowerCase().includes(q) || l.code.toLowerCase().includes(q);
      })
    : supportedLanguages;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const handleSelect = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div
      className={`lang-selector-container ${variant} notranslate`}
      ref={dropdownRef}
      translate="no"
    >
      <button
        type="button"
        className={`lang-selector-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Select Language"
        title="Change Language"
      >
        <span className="lang-globe-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </span>

        <span className="lang-current-label">
          <span className="lang-native-text">{currentMeta.native}</span>
          <span className="lang-code-tag">({currentMeta.code.toUpperCase()})</span>
        </span>

        {isTranslating && <span className="lang-pulse-indicator" title="Translating via Google Translate..." />}

        <span className="lang-chevron-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="lang-dropdown-menu">
          <div className="lang-dropdown-header">
            <span>🌐 SELECT SYSTEM LANGUAGE</span>
          </div>

          <input
            type="text"
            className="lang-search-input"
            placeholder="Search 50+ languages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          <div className="lang-dropdown-list">
            {filteredLanguages.length === 0 && (
              <div className="lang-no-results">No languages match "{query}"</div>
            )}
            {filteredLanguages.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={`lang-option-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(lang.code)}
                >
                  <span className="lang-option-left">
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-names">
                      <strong className="lang-native">{lang.native}</strong>
                      <small className="lang-english">{lang.label}</small>
                    </span>
                  </span>

                  {isSelected && (
                    <span className="lang-check-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
