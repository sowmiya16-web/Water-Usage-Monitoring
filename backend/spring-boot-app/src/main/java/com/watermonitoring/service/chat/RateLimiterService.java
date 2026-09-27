package com.watermonitoring.service.chat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * RateLimiterService — Implements a thread-safe sliding-window rate limiter
 * to protect Gemini and Translation API quotas against excessive requests.
 */
@Service
public class RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterService.class);

    @Value("${chat.rate-limit.rpm:20}")
    private int maxRequestsPerMinute;

    // Stores timestamps of requests per client key (IP or email)
    private final ConcurrentHashMap<String, ConcurrentLinkedQueue<Long>> requestLog = new ConcurrentHashMap<>();

    /**
     * Checks if the request is allowed under the rate limit.
     * @param clientKey identifier for the client (IP or email)
     * @return true if allowed, false if limit exceeded
     */
    public boolean tryAcquire(String clientKey) {
        if (clientKey == null || clientKey.isBlank()) {
            clientKey = "anonymous";
        }

        long now = System.currentTimeMillis();
        long oneMinuteAgo = now - 60_000L;

        ConcurrentLinkedQueue<Long> timestamps = requestLog.computeIfAbsent(clientKey, k -> new ConcurrentLinkedQueue<>());

        // Evict expired timestamps older than 60 seconds
        while (!timestamps.isEmpty() && timestamps.peek() < oneMinuteAgo) {
            timestamps.poll();
        }

        if (timestamps.size() >= maxRequestsPerMinute) {
            log.warn("[RateLimiter] Rate limit exceeded for client '{}'. Requests in last minute: {}", clientKey, timestamps.size());
            return false;
        }

        timestamps.add(now);
        return true;
    }
}
