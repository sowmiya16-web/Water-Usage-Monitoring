package com.watermonitoring.service.chat.context;

import com.watermonitoring.entity.Alert;
import com.watermonitoring.repository.AlertRepository;
import com.watermonitoring.repository.MaintenanceRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CommunityAdminContextProvider — context for the Community Admin. The Community Admin
 * dashboards and APIs cover every household in every building, so the chatbot sees exactly
 * the same data (live from the database) rather than a single hard-coded block.
 */
@Component
public class CommunityAdminContextProvider {

    private static final Logger log = LoggerFactory.getLogger(CommunityAdminContextProvider.class);

    private final HouseholdContextBuilder householdContextBuilder;
    private final AlertRepository alertRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;

    @Autowired
    public CommunityAdminContextProvider(HouseholdContextBuilder householdContextBuilder,
                                         AlertRepository alertRepository,
                                         MaintenanceRequestRepository maintenanceRequestRepository) {
        this.householdContextBuilder = householdContextBuilder;
        this.alertRepository = alertRepository;
        this.maintenanceRequestRepository = maintenanceRequestRepository;
    }

    public String buildContext(String adminEmail) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== COMMUNITY ADMIN AUTHORIZED CONTEXT ===\n");
        sb.append("Authenticated User: ").append(adminEmail).append("\n");
        sb.append("Display Role: COMMUNITY ADMIN (all households and buildings shown on the Community Admin dashboards)\n\n");
        sb.append(householdContextBuilder.build());

        try {
            List<Alert> active = alertRepository.findAll().stream().filter(a -> "ACTIVE".equals(a.getStatus())).collect(Collectors.toList());
            long openMaintenance = maintenanceRequestRepository.findAll().stream()
                    .filter(m -> "OPEN".equals(m.getStatus()) || "IN_PROGRESS".equals(m.getStatus())).count();
            sb.append("\nOTHER OPERATIONS\n");
            sb.append("- Active alerts: ").append(active.size()).append("\n");
            active.stream().limit(5).forEach(a -> sb.append("   - [").append(a.getSeverity()).append("] ").append(a.getTitle()).append("\n"));
            sb.append("- Open maintenance tasks: ").append(openMaintenance).append("\n");
        } catch (Exception e) {
            log.warn("Could not load community admin operations context: {}", e.getMessage());
        }
        return sb.toString();
    }
}
