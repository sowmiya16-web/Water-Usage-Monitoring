package com.watermonitoring.service.chat.context;

import com.watermonitoring.entity.Alert;
import com.watermonitoring.entity.Building;
import com.watermonitoring.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * AdminContextProvider — Assembles authorized system-wide metrics and status
 * for the Property/System Administrator.
 */
@Component
public class AdminContextProvider {

    private static final Logger log = LoggerFactory.getLogger(AdminContextProvider.class);

    private final ResidentRepository residentRepository;
    private final ApartmentRepository apartmentRepository;
    private final WaterMeterRepository waterMeterRepository;
    private final BillRepository billRepository;
    private final AlertRepository alertRepository;
    private final BuildingRepository buildingRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final HouseholdContextBuilder householdContextBuilder;

    @Autowired
    public AdminContextProvider(ResidentRepository residentRepository,
                                ApartmentRepository apartmentRepository,
                                WaterMeterRepository waterMeterRepository,
                                BillRepository billRepository,
                                AlertRepository alertRepository,
                                BuildingRepository buildingRepository,
                                MaintenanceRequestRepository maintenanceRequestRepository,
                                HouseholdContextBuilder householdContextBuilder) {
        this.residentRepository = residentRepository;
        this.apartmentRepository = apartmentRepository;
        this.waterMeterRepository = waterMeterRepository;
        this.billRepository = billRepository;
        this.alertRepository = alertRepository;
        this.buildingRepository = buildingRepository;
        this.maintenanceRequestRepository = maintenanceRequestRepository;
        this.householdContextBuilder = householdContextBuilder;
    }

    public String buildContext(String adminEmail) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== SYSTEM-WIDE AUTHORIZED COMMUNITY ADMIN METRICS ===\n");
        sb.append("Authenticated User: ").append(adminEmail).append("\n");
        sb.append("Display Role: COMMUNITY_ADMIN (System-wide authorized view for all buildings & residents)\n\n");

        try {
            long totalResidents = residentRepository.count();
            long totalApartments = apartmentRepository.count();
            long occupiedApartments = apartmentRepository.findByOccupancyStatus("OCCUPIED").size();
            long vacantApartments = apartmentRepository.findByOccupancyStatus("VACANT").size();
            long totalMeters = waterMeterRepository.count();
            long totalBuildings = buildingRepository.count();

            List<Building> buildings = buildingRepository.findAll();
            String buildingList = buildings.stream()
                    .map(b -> b.getBuildingName() + " (" + b.getTotalUnits() + " units, " + b.getTotalFloors() + " floors)")
                    .collect(Collectors.joining("; "));

            long pendingBills = billRepository.findByStatus("PENDING").size();
            long paidBills = billRepository.findByStatus("PAID").size();

            List<Alert> activeAlerts = alertRepository.findAll().stream()
                    .filter(a -> "ACTIVE".equals(a.getStatus()))
                    .collect(Collectors.toList());

            long openMaintenance = maintenanceRequestRepository.findAll().stream()
                    .filter(m -> "OPEN".equals(m.getStatus()) || "IN_PROGRESS".equals(m.getStatus()))
                    .count();

            sb.append("• Total Registered Residents: ").append(totalResidents).append("\n");
            sb.append("• Total Apartments: ").append(totalApartments)
              .append(" (Occupied: ").append(occupiedApartments)
              .append(", Vacant: ").append(vacantApartments).append(")\n");
            sb.append("• Total Smart Water Meters: ").append(totalMeters).append("\n");
            sb.append("• Buildings (").append(totalBuildings).append("): ").append(buildingList).append("\n");
            sb.append("• Bills Summary: ").append(pendingBills).append(" Pending, ").append(paidBills).append(" Paid\n");
            sb.append("• Active Alerts (").append(activeAlerts.size()).append(" total):\n");
            activeAlerts.stream().limit(5).forEach(a ->
                    sb.append("   - [").append(a.getSeverity()).append("] ").append(a.getTitle())
                      .append(" (").append(a.getMessage()).append(")\n"));
            sb.append("• Open Maintenance Tasks: ").append(openMaintenance).append("\n");

        } catch (Exception e) {
            log.warn("Could not load admin context metrics: {}", e.getMessage());
            sb.append("Notice: Some live metric counters are temporarily unavailable.\n");
        }

        sb.append("\n").append(householdContextBuilder.build());
        return sb.toString();
    }
}
