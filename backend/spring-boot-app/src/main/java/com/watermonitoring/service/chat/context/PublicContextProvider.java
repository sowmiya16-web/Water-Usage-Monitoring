package com.watermonitoring.service.chat.context;

import org.springframework.stereotype.Component;

/**
 * PublicContextProvider — Assembles static system documentation and feature information
 * for unauthenticated visitors on the landing/login page.
 * Strictly NEVER queries or includes private database records.
 */
@Component
public class PublicContextProvider {

    public String buildContext() {
        return """
                === PUBLIC SYSTEM INFORMATION (Landing & Login Page) ===
                System Name: Smart Water Usage Monitoring System (Aqua Plus)
                Purpose: Real-time IoT water monitoring, automated multi-tier billing, and anomaly/leak detection.
                
                Key Public Features:
                - Real-Time IoT Telemetry: Smart digital water meters monitor consumption per unit.
                - Automated Multi-Tier Tariff Billing: Calculates charges based on tiered thresholds.
                - 2-Sigma Statistical Leak Detection: Automatic leak and burst alert engine.
                - Role-Based Dashboards:
                  * Resident Portal: View personal consumption, bills, due dates, and meter status.
                  * Community Admin Dashboard: Oversee community/building-level consumption, units, and maintenance.
                  * System / Property Admin: Overall management of residents, buildings, meters, tariffs, and alerts.
                
                ACCESS RESTRICTION RULES:
                - You are in PUBLIC GUEST MODE.
                - Do NOT provide private system statistics (e.g., resident names, exact user counts, specific bills, meter readings).
                - If a visitor asks for resident data, billing details, or internal records, politely explain that they must log in with their authorized account to access that information.
                """;
    }
}
