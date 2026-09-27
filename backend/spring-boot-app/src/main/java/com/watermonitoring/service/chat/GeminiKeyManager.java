package com.watermonitoring.service.chat;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * GeminiKeyManager — Coordinates and rotates multiple Google Gemini API keys (up to 3 keys or more).
 * Provides round-robin balancing, automatic rate limit detection (HTTP 429 / quota exhaustion),
 * and healthy failover so neither the translation engine nor the chatbot stalls.
 */
@Component
public class GeminiKeyManager {

    private static final Logger log = LoggerFactory.getLogger(GeminiKeyManager.class);

    @Value("${gemini.api.key1:${gemini.api.key:}}")
    private String key1;

    @Value("${gemini.api.key2:}")
    private String key2;

    @Value("${gemini.api.key3:}")
    private String key3;

    @Value("${gemini.api.keys:}")
    private String commaSeparatedKeys;

    private final List<String> activeKeys = new ArrayList<>();
    private final AtomicInteger roundRobinIndex = new AtomicInteger(0);
    private final Map<String, Long> cooldownUntil = new ConcurrentHashMap<>();
    private final Map<String, Integer> failureCounts = new ConcurrentHashMap<>();

    private static final long RATE_LIMIT_COOLDOWN_MS = 60_000L; // 60s cooldown on 429
    private static final long GENERAL_ERROR_COOLDOWN_MS = 15_000L; // 15s cooldown on other errors

    @PostConstruct
    public void init() {
        Set<String> uniqueKeys = new LinkedHashSet<>();

        addIfValid(uniqueKeys, key1);
        addIfValid(uniqueKeys, key2);
        addIfValid(uniqueKeys, key3);

        if (commaSeparatedKeys != null && !commaSeparatedKeys.isBlank()) {
            for (String k : commaSeparatedKeys.split(",")) {
                addIfValid(uniqueKeys, k.trim());
            }
        }

        activeKeys.clear();
        activeKeys.addAll(uniqueKeys);

        log.info("[GeminiKeyManager] Initialized with {} Gemini API key(s)", activeKeys.size());
    }

    private void addIfValid(Set<String> target, String key) {
        if (key != null && !key.isBlank() && !key.startsWith("YOUR_") && !target.contains(key)) {
            target.add(key);
        }
    }

    /**
     * Retrieves the next available healthy key via round-robin.
     * Skips keys currently in cooldown unless all keys are in cooldown.
     */
    public synchronized String getNextKey() {
        if (activeKeys.isEmpty()) {
            return null;
        }

        long now = System.currentTimeMillis();
        int total = activeKeys.size();

        // 1. Try finding a healthy key not in cooldown
        for (int i = 0; i < total; i++) {
            int idx = Math.abs(roundRobinIndex.getAndIncrement() % total);
            String candidate = activeKeys.get(idx);
            Long cd = cooldownUntil.get(candidate);
            if (cd == null || cd <= now) {
                return candidate;
            }
        }

        // 2. If all keys in cooldown, return the one with earliest cooldown expiry
        String earliestKey = activeKeys.get(0);
        long minCooldown = Long.MAX_VALUE;
        for (String k : activeKeys) {
            long cd = cooldownUntil.getOrDefault(k, 0L);
            if (cd < minCooldown) {
                minCooldown = cd;
                earliestKey = k;
            }
        }
        log.warn("[GeminiKeyManager] All {} key(s) in cooldown. Falling back to earliest candidate.", total);
        return earliestKey;
    }

    /**
     * Returns an ordered list of candidate keys to try for a single request,
     * starting from the next round-robin key, allowing immediate failover.
     */
    public synchronized List<String> getCandidateKeysForFailover() {
        if (activeKeys.isEmpty()) {
            return Collections.emptyList();
        }
        int total = activeKeys.size();
        int startIdx = Math.abs(roundRobinIndex.getAndIncrement() % total);

        List<String> candidates = new ArrayList<>(total);
        for (int i = 0; i < total; i++) {
            candidates.add(activeKeys.get((startIdx + i) % total));
        }
        return candidates;
    }

    public void recordSuccess(String key) {
        if (key != null) {
            cooldownUntil.remove(key);
            failureCounts.remove(key);
        }
    }

    public void recordFailure(String key, boolean isRateLimit) {
        if (key == null) return;

        long duration = isRateLimit ? RATE_LIMIT_COOLDOWN_MS : GENERAL_ERROR_COOLDOWN_MS;
        long until = System.currentTimeMillis() + duration;
        cooldownUntil.put(key, until);

        int count = failureCounts.merge(key, 1, Integer::sum);
        String masked = maskKey(key);
        log.warn("[GeminiKeyManager] Key {} failed (rateLimit={}) - count={}. Cooling down for {}s",
                masked, isRateLimit, count, duration / 1000);
    }

    public int getActiveKeyCount() {
        return activeKeys.size();
    }

    public static String maskKey(String key) {
        if (key == null || key.length() < 8) return "****";
        return key.substring(0, 4) + "..." + key.substring(key.length() - 4);
    }
}
