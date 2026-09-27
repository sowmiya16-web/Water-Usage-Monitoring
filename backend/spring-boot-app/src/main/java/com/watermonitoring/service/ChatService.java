package com.watermonitoring.service;

import com.watermonitoring.dto.ChatRequest;
import com.watermonitoring.dto.ChatResponse;
import com.watermonitoring.service.chat.ChatContextService;
import com.watermonitoring.service.chat.GeminiService;
import com.watermonitoring.service.chat.RateLimiterService;
import com.watermonitoring.service.chat.TranslationService;
import com.watermonitoring.service.chat.context.PageContextRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * ChatService — Main orchestrator for AquaBot AI Chatbot.
 * Pipeline: Rate Limit Check -> Translate to English -> Assemble Scoped Context -> Call Gemini -> Translate Response.
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final RateLimiterService rateLimiterService;
    private final TranslationService translationService;
    private final ChatContextService chatContextService;
    private final GeminiService geminiService;
    private final PageContextRegistry pageContextRegistry;

    @Autowired
    public ChatService(RateLimiterService rateLimiterService,
                       TranslationService translationService,
                       ChatContextService chatContextService,
                       GeminiService geminiService,
                       PageContextRegistry pageContextRegistry) {
        this.rateLimiterService = rateLimiterService;
        this.translationService = translationService;
        this.chatContextService = chatContextService;
        this.geminiService = geminiService;
        this.pageContextRegistry = pageContextRegistry;
    }

    /**
     * Handles unauthenticated public chat from the landing/login page.
     */
    public ChatResponse processPublicChat(ChatRequest request, String clientIp) {
        String lang = request.getLanguage();
        String langName = translationService.getLanguageName(lang);

        if (!rateLimiterService.tryAcquire("ip:" + clientIp)) {
            return new ChatResponse(getRateLimitMessage(lang), lang);
        }

        // 1. Optional Google Translate: User Language -> English for reasoning
        String queryForGemini = translationService.translateToEnglish(request.getMessage(), lang);

        // 2. Assemble Public Context (Strictly no private DB data) + current page
        String context = chatContextService.buildPublicContext() + pageContextRegistry.describe(request.getCurrentPage());

        // 3. Generate response via Gemini (with prior turns for conversational memory)
        String reply = geminiService.generateResponse(context, queryForGemini, lang, langName, request.getHistory());

        // 4. Optional Google Translate: English -> User Language if configured
        if (translationService.isGoogleTranslateConfigured() && !"en".equalsIgnoreCase(lang)) {
            reply = translationService.translateFromEnglish(reply, lang);
        }

        return new ChatResponse(reply, lang);
    }

    /**
     * Handles authenticated chat from the dashboards.
     * The role is passed from the verified Spring Security context.
     */
    public ChatResponse processAuthenticatedChat(String email, String role, ChatRequest request) {
        String lang = request.getLanguage();
        String langName = translationService.getLanguageName(lang);

        if (!rateLimiterService.tryAcquire("user:" + email)) {
            return new ChatResponse(getRateLimitMessage(lang), lang);
        }

        // 1. Optional Google Translate: User Language -> English for reasoning
        String queryForGemini = translationService.translateToEnglish(request.getMessage(), lang);

        // 2. Assemble Role-Authorized Context
        String context;
        if ("ROLE_PROPERTY_ADMIN".equalsIgnoreCase(role)) {
            context = chatContextService.buildAdminContext(email);
        } else if ("ROLE_COMMUNITY_ADMIN".equalsIgnoreCase(role)) {
            context = chatContextService.buildCommunityAdminContext(email);
        } else {
            context = chatContextService.buildResidentContext(email);
        }
        context += pageContextRegistry.describe(request.getCurrentPage());

        // 3. Generate response via Gemini (with prior turns for conversational memory)
        String reply = geminiService.generateResponse(context, queryForGemini, lang, langName, request.getHistory());

        // 4. Optional Google Translate: English -> User Language if configured
        if (translationService.isGoogleTranslateConfigured() && !"en".equalsIgnoreCase(lang)) {
            reply = translationService.translateFromEnglish(reply, lang);
        }

        return new ChatResponse(reply, lang);
    }

    private String getRateLimitMessage(String lang) {
        return switch (lang.toLowerCase()) {
            case "ta" -> "அதிக கோரிக்கைகள் வந்துள்ளன. தயவுசெய்து சிறிது நேரம் காத்திருந்து மீண்டும் முயற்சிக்கவும்.";
            case "hi" -> "बहुत सारे अनुरोध आ रहे हैं। कृपया कुछ समय प्रतीक्षा करके पुनः प्रयास करें।";
            case "te" -> "చాలా అభ్యర్థనలు వస్తున్నాయి. దయచేసి కొద్దిసేపు వేచి ఉండి మళ్లీ ప్రయత్నించండి.";
            case "ml" -> "വളരെ കൂടുതൽ അഭ്യർത്ഥനകൾ. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.";
            case "kn" -> "ಹೆಚ್ಚಿನ ವಿನಂತಿಗಳು ಬಂದಿವೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯ ಕಾಯಿರಿ ಮತ್ತು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";
            default -> "Too many requests. Please wait a moment before sending another message.";
        };
    }
}
