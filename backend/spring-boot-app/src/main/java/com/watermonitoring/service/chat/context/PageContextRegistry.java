package com.watermonitoring.service.chat.context;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * PageContextRegistry — Maps the route the user is currently viewing
 * (sent by the frontend as ChatRequest.currentPage) to a short, purely
 * server-authored description of what's on that page.
 *
 * SECURITY: the client-supplied path is used ONLY as a lookup key
 * (exact match, then longest-prefix match against this fixed registry).
 * Its raw text is never echoed into the AI prompt, so a client cannot
 * inject instructions via this field — the model only ever sees text
 * written here.
 */
@Component
public class PageContextRegistry {

    private final Map<String, String> exact = new LinkedHashMap<>();
    private final Map<String, String> prefixes = new LinkedHashMap<>();

    public PageContextRegistry() {
        // ── Public / guest pages ──
        exact.put("/", "The public landing page — marketing overview of Aqua Plus: real-time IoT telemetry, multi-tier billing, and 2-Sigma leak detection. Has a \"Sign In\" button and feature highlights.");
        exact.put("/login", "The public landing page.");
        exact.put("/login-page", "The sign-in / create-account page. Has email + password fields, a \"Forgot password?\" link, and a link to create a new resident account.");

        // ── Resident portal ──
        exact.put("/resident/dashboard", "The Resident dashboard — an overview with current bill summary, latest meter reading, recent consumption trend, and active alerts.");
        exact.put("/user-dashboard", "The Resident dashboard — an overview with current bill summary, latest meter reading, recent consumption trend, and active alerts.");
        exact.put("/resident/water-consumption", "The Water Consumption page — shows the resident's real-time and historical water usage charts.");
        exact.put("/resident/usage-history", "The Usage History page — a detailed log of past meter readings and daily/monthly consumption for this resident.");
        exact.put("/resident/meter-details", "The Meter Details page — shows this resident's smart meter serial number, status, battery level, and signal strength.");
        exact.put("/resident/current-bill", "The Current Bill page — shows the resident's latest bill number, total amount, due date, tariff breakdown, and a pay option.");
        exact.put("/resident/billing-history", "The Billing History page — a list of the resident's past bills with amounts, dates, and payment status.");
        exact.put("/resident/payment-history", "The Payment History page — a log of the resident's past payments/transactions.");
        exact.put("/resident/notifications", "The Notifications page — system notifications for this resident's account.");
        exact.put("/resident/alerts", "The Alerts page — active and past leak/anomaly alerts for this resident's apartment.");
        exact.put("/resident/profile", "The My Profile page — the resident's personal account details (name, contact info, apartment).");
        exact.put("/resident/settings", "The Account Settings page — password change and account preferences for the resident.");
        exact.put("/resident/help", "The Help & Support page — FAQs and support contact options for residents.");

        // ── /admin/* = "Community Admin" portal (system-wide, per the app's role naming) ──
        exact.put("/admin/dashboard", "The Community Admin dashboard — system-wide overview: total residents, buildings, active alerts, and billing stats across the whole system.");
        exact.put("/admin/residents", "The Residents management page — a system-wide list of all registered residents.");
        exact.put("/admin/add-resident", "The Add Resident form — for registering a new resident account.");
        exact.put("/admin/user-accounts", "The User Accounts page — manages login accounts across the system.");
        exact.put("/admin/water-meters", "The Water Meters page — a system-wide list of all smart water meters and their status.");
        exact.put("/admin/water-management/water-meters", "The Water Meters page — a system-wide list of all smart water meters and their status.");
        exact.put("/admin/add-water-meter", "The Add Water Meter form — for registering a new smart meter.");
        exact.put("/admin/water-management/add-water-meter", "The Add Water Meter form — for registering a new smart meter.");
        exact.put("/admin/consumption-monitoring", "The Consumption Monitoring page — system-wide real-time water usage monitoring.");
        exact.put("/admin/water-management/consumption-monitoring", "The Consumption Monitoring page — system-wide real-time water usage monitoring.");
        exact.put("/admin/usage-analytics", "The Usage Analytics page — system-wide consumption trends and statistical analysis (including 2-Sigma leak detection insights).");
        exact.put("/admin/water-management/usage-analytics", "The Usage Analytics page — system-wide consumption trends and statistical analysis (including 2-Sigma leak detection insights).");
        exact.put("/admin/billing-management", "The Billing Management page — system-wide bill generation and management.");
        exact.put("/admin/payment-management", "The Payment Management page — system-wide payment records and reconciliation.");
        exact.put("/admin/tariff-management", "The Tariff Management page — configures the multi-tier water pricing rates used system-wide.");
        exact.put("/admin/traffic-management", "The Tariff Management page — configures the multi-tier water pricing rates used system-wide.");
        exact.put("/admin/meter-monitoring", "The Meter Monitoring page — live status/health of smart meters system-wide.");
        exact.put("/admin/alerts-notifications", "The Alerts & Notifications page — system-wide active alerts (leaks, anomalies, offline meters) and notification settings.");
        exact.put("/admin/service-requests", "The Service Requests page — tracks resident-submitted service requests.");
        exact.put("/admin/maintenance-management", "The Maintenance Management page — schedules and tracks maintenance tasks.");
        exact.put("/admin/issue-tracking", "The Issue Tracking page — tracks reported issues/tickets across the system.");
        exact.put("/admin/consumption-reports", "The Consumption Reports page — downloadable/system-wide water usage reports.");
        exact.put("/admin/billing-reports", "The Billing Reports page — system-wide billing report summaries.");
        exact.put("/admin/revenue-reports", "The Revenue Reports page — system-wide revenue and collection-rate reports.");
        exact.put("/admin/households", "The Household Management page: lists every household (apartment) with its residents, water meter, this-month usage vs last month and pending bills. Admins can search, filter, add, edit and delete households here and open any household detail page.");
        exact.put("/admin/household-comparison", "The Household Water-Usage Comparison page: compares every household consumption for a chosen month against the community average and the previous month.");
        exact.put("/admin/meter-readings", "The Meter Readings page: enter a reading for any meter, import readings from CSV, and see recent readings.");
        exact.put("/admin/billing-cycles", "The Billing Cycles page: create billing cycles and close the open one.");
        exact.put("/admin/tariff-versions", "The Tariff Versions page: the current water tariff and the full history of previous versions.");
        exact.put("/admin/bulk-purchases", "The Bulk Water Purchases page: record tanker or municipal water purchases and see purchase history.");
        exact.put("/admin/profile", "The account profile page for this Community Admin.");
        exact.put("/admin/settings", "The account settings page for this Community Admin.");

        // ── /community-admin/* = "Admin" portal (single community/property scoped) ──
        exact.put("/community-admin/dashboard", "The Admin dashboard — an overview scoped to this admin's assigned community/building: residents, meters, and alerts for that community only.");
        exact.put("/community-admin/residents", "The Residents page — the list of residents within this admin's assigned community.");
        exact.put("/community-admin/admin-management", "The Admin Management page — manage admin accounts for this community.");
        exact.put("/community-admin/user-accounts", "The User Accounts page — manage resident login accounts for this community.");
        exact.put("/community-admin/water-meters", "The Water Meters page — smart meters within this admin's assigned community.");
        exact.put("/community-admin/consumption-monitoring", "The Consumption Monitoring page — real-time water usage for this community.");
        exact.put("/community-admin/billing-payments", "The Billing & Payments page — bills and payments for residents in this community.");
        exact.put("/community-admin/tariff-management", "The Tariff Management page — view the water pricing tiers that apply to this community.");
        exact.put("/community-admin/alerts-notifications", "The Alerts & Notifications page — active leak/anomaly alerts for this community.");
        exact.put("/community-admin/reports", "The Reports page — consumption and billing reports scoped to this community.");
        exact.put("/community-admin/settings", "The account settings page for this community's Admin.");

        // Prefix fallbacks (used when the exact path isn't in the map above,
        // e.g. a sub-route added later) — keeps answers roughly grounded
        // without needing every single route hand-written.
        prefixes.put("/admin/households/", "A Household detail page: one household with its residents (add, edit, remove), water meter, monthly usage history chart and table, recent readings, comparison with the community average, and bills.");
        prefixes.put("/resident/", "A page within the Resident Portal (personal water usage, billing, meters, alerts, and account settings).");
        prefixes.put("/admin/", "A page within the Community Admin dashboard (system-wide management: residents, meters, billing, tariffs, and alerts).");
        prefixes.put("/community-admin/", "A page within the Admin dashboard (management scoped to one assigned community/building).");
    }

    /**
     * Returns a short "CURRENT PAGE CONTEXT" block for the given path, or
     * an empty string if no page was reported. Never includes the raw
     * client-supplied path text.
     */
    public String describe(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }

        String normalized = path.trim().toLowerCase(Locale.ROOT);
        // Strip a trailing slash (except for the root path itself).
        if (normalized.length() > 1 && normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        String description = exact.get(normalized);
        if (description == null) {
            for (Map.Entry<String, String> entry : prefixes.entrySet()) {
                if (normalized.startsWith(entry.getKey())) {
                    description = entry.getValue();
                    break;
                }
            }
        }

        if (description == null) {
            return "";
        }

        return "\n=== CURRENT PAGE CONTEXT ===\nThe user is currently looking at: " + description + "\n";
    }
}
