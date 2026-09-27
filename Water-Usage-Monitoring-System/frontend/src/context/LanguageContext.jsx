// @refresh reset
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SUPPORTED_LANGUAGES } from "./translationData.js";

const LanguageContext = createContext(null);

const COOKIE_NAME = "googtrans";

// Every language Google's widget is allowed to translate into.
const GOOGLE_INCLUDED_LANGUAGES = SUPPORTED_LANGUAGES.map((l) => l.code)
  .filter((c) => c !== "en")
  .join(",");

/**
 * React's reconciler and Google Translate's DOM rewriting both mutate the
 * same tree. When Google wraps a text node in a <font> tag and React later
 * tries to remove/insert a node that no longer sits where React expects,
 * the browser throws "Failed to execute 'removeChild'/'insertBefore' on
 * 'Node'" and crashes the app. This is a well-documented interaction
 * between React and the Google Translate website widget; the fix is to
 * make removeChild/insertBefore no-ops when the node isn't actually a
 * child of the given parent, instead of throwing.
 */
function patchDomForGoogleTranslate() {
  if (window.__gtDomPatchApplied) return;
  window.__gtDomPatchApplied = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}

/**
 * Google's widget reads this cookie ("/<source>/<target>") on load and
 * auto-translates the page to match — this is its own public, stable
 * persistence mechanism, independent of any particular DOM layout the
 * widget happens to render internally.
 */
function readGoogTransCookie() {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  if (!match) return "en";
  const parts = decodeURIComponent(match[1]).split("/").filter(Boolean);
  return parts[1] || "en";
}

function writeGoogTransCookie(code) {
  if (code === "en") {
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  } else {
    document.cookie = `${COOKIE_NAME}=/en/${code}; path=/;`;
  }
}

function ensureGoogleTranslateElement() {
  let host = document.getElementById("google_translate_element");
  if (!host) {
    host = document.createElement("div");
    host.id = "google_translate_element";
    host.className = "notranslate";
    host.setAttribute("translate", "no");
    document.body.appendChild(host);
  }
  return host;
}

let loadPromise = null;

/** Injects the official Google Website Translator script and resolves once it's ready. */
function loadGoogleTranslate() {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    if (window.google?.translate?.TranslateElement) {
      resolve();
      return;
    }

    ensureGoogleTranslateElement();

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: GOOGLE_INCLUDED_LANGUAGES,
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element"
      );
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  });

  return loadPromise;
}

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguageState] = useState(() => {
    return localStorage.getItem("system_lang") || localStorage.getItem("aquabot_lang") || "en";
  });
  const [isTranslating, setIsTranslating] = useState(false);

  // Boot Google Translate. If a returning visitor already picked a
  // non-English language (localStorage), make sure Google's own cookie
  // agrees *before* its script runs, so the page comes up already
  // translated instead of flashing English first.
  useEffect(() => {
    patchDomForGoogleTranslate();

    const saved = localStorage.getItem("system_lang") || localStorage.getItem("aquabot_lang") || "en";
    if (readGoogTransCookie() !== saved) {
      writeGoogTransCookie(saved);
    }

    loadGoogleTranslate();
  }, []);

  // Switching the site language re-points Google's cookie and reloads —
  // Google Translate is built for full page loads, not live SPA DOM
  // patching, and a reload is the one mechanism Google documents and
  // guarantees will keep working. The standard language (English) is
  // simply the page as authored: no cookie, no translation applied.
  const setLanguage = useCallback((newLang) => {
    const validated = SUPPORTED_LANGUAGES.some((l) => l.code === newLang) ? newLang : "en";

    setCurrentLanguageState((prev) => {
      if (prev === validated) return prev;

      localStorage.setItem("system_lang", validated);
      localStorage.setItem("aquabot_lang", validated);
      writeGoogTransCookie(validated);
      window.dispatchEvent(new CustomEvent("systemLanguageChange", { detail: validated }));

      setIsTranslating(true);
      setTimeout(() => window.location.reload(), 60);

      return validated;
    });
  }, []);

  // Cross-component sync (e.g. the chat widget's own language picker).
  useEffect(() => {
    const handleLangEvent = (e) => {
      if (e.detail && e.detail !== currentLanguage) {
        setCurrentLanguageState(e.detail);
      }
    };
    window.addEventListener("systemLanguageChange", handleLangEvent);
    return () => window.removeEventListener("systemLanguageChange", handleLangEvent);
  }, [currentLanguage]);

  // Kept for backward compatibility with existing call sites (t("...")).
  // Real translation now happens live on the DOM via Google Translate, so
  // this simply returns the original (standard/default-language) text.
  const t = useCallback((text) => text, []);

  const value = {
    currentLanguage,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    t,
    isTranslating,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
