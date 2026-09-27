package com.watermonitoring.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS is normally sidestepped entirely in dev: the frontend calls a relative "/api/..."
 * path and Vite's dev proxy (see frontend/vite.config.js) forwards it to this server,
 * so the browser never sees the request as cross-origin regardless of whether the page
 * was opened as http://localhost:5173 (desktop) or http://<LAN-IP>:5173 (phone).
 *
 * This config is the fallback/defense-in-depth path: it covers anything that talks to
 * the backend directly (a device on the same Wi-Fi hitting this API without going
 * through the Vite proxy, an API testing tool, a future separately-hosted frontend).
 * allowedOriginPatterns lets a wildcard stand in for "any port on this private LAN
 * subnet" instead of hardcoding one machine's IP, which would break the moment the app
 * is opened from a different network.
 */
@Configuration
public class CorsConfig {

    // Extra explicit origins (comma-separated) an operator can add without touching code,
    // e.g. a deployed frontend's real domain: CORS_EXTRA_ORIGINS=https://water.example.com
    @Value("${cors.extra-origins:}")
    private String extraOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // NOTE: CorsRegistration.allowedOriginPatterns(...) REPLACES the list on every
                // call, it doesn't append — so the full set has to be assembled first and
                // passed in one call.
                java.util.List<String> patterns = new java.util.ArrayList<>(java.util.List.of(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        // Private LAN ranges (RFC 1918) on any port — covers phones/tablets
                        // opening the dev server from http://<PC-LAN-IP>:5173 on the same Wi-Fi.
                        "http://192.168.*.*:*",
                        "http://10.*.*.*:*",
                        "http://172.16.*.*:*", "http://172.17.*.*:*", "http://172.18.*.*:*",
                        "http://172.19.*.*:*", "http://172.20.*.*:*", "http://172.21.*.*:*",
                        "http://172.22.*.*:*", "http://172.23.*.*:*", "http://172.24.*.*:*",
                        "http://172.25.*.*:*", "http://172.26.*.*:*", "http://172.27.*.*:*",
                        "http://172.28.*.*:*", "http://172.29.*.*:*", "http://172.30.*.*:*",
                        "http://172.31.*.*:*"));

                if (extraOrigins != null && !extraOrigins.isBlank()) {
                    for (String origin : extraOrigins.split(",")) {
                        if (!origin.trim().isEmpty()) patterns.add(origin.trim());
                    }
                }

                registry.addMapping("/api/**")
                        .allowedOriginPatterns(patterns.toArray(String[]::new))
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}
