package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.entity.MaintenanceRequest;
import com.watermonitoring.entity.WaterMeter;
import com.watermonitoring.entity.WaterUsage;
import com.watermonitoring.repository.MaintenanceRequestRepository;
import com.watermonitoring.repository.WaterMeterRepository;
import com.watermonitoring.repository.WaterUsageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/meters")
public class WaterMeterController {

    private final WaterMeterRepository meterRepository;
    private final WaterUsageRepository usageRepository;
    private final MaintenanceRequestRepository maintenanceRepository;

    @Autowired
    public WaterMeterController(WaterMeterRepository meterRepository, 
                                WaterUsageRepository usageRepository,
                                MaintenanceRequestRepository maintenanceRepository) {
        this.meterRepository = meterRepository;
        this.usageRepository = usageRepository;
        this.maintenanceRepository = maintenanceRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WaterMeter>>> getAllMeters() {
        List<WaterMeter> meters = meterRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Meters retrieved successfully", meters));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WaterMeter>> getMeterById(@PathVariable Long id) {
        return meterRepository.findById(id)
                .map(m -> ResponseEntity.ok(ApiResponse.success("Meter retrieved successfully", m)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Meter not found", null)));
    }

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<ApiResponse<WaterMeter>> getMeterByApartmentId(@PathVariable Long apartmentId) {
        return meterRepository.findByApartmentId(apartmentId)
                .map(m -> ResponseEntity.ok(ApiResponse.success("Meter retrieved successfully", m)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Meter not found for apartment", null)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WaterMeter>> createMeter(@RequestBody WaterMeter meter) {
        WaterMeter created = meterRepository.save(meter);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Meter registered successfully", created));
    }

    @GetMapping("/{meterId}/usage")
    public ResponseEntity<ApiResponse<List<WaterUsage>>> getMeterUsageHistory(@PathVariable Long meterId) {
        List<WaterUsage> usageList = usageRepository.findByMeterId(meterId);
        return ResponseEntity.ok(ApiResponse.success("Usage history retrieved", usageList));
    }

    @PostMapping("/{meterId}/usage")
    public ResponseEntity<ApiResponse<WaterUsage>> recordUsage(@PathVariable Long meterId, @RequestBody WaterUsage usage) {
        usage.setMeterId(meterId);
        WaterUsage saved = usageRepository.save(usage);

        // Anomaly / Leak Detection Trigger: if single daily reading exceeds 5.0 KL
        if (usage.getConsumptionKl() != null && usage.getConsumptionKl() > 5.0) {
            meterRepository.findById(meterId).ifPresent(meter -> {
                meter.setStatus("ALERT");
                meterRepository.save(meter);

                String taskNum = "TASK-LEAK-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                MaintenanceRequest leakTask = new MaintenanceRequest(
                        taskNum,
                        "High Consumption Leak Anomaly Detected (" + usage.getConsumptionKl() + " KL)",
                        "Meter ID #" + meterId + " (Apartment #" + meter.getApartmentId() + ")",
                        "Plumbing Emergency Team",
                        "EMERGENCY",
                        "OPEN"
                );
                maintenanceRepository.save(leakTask);
            });
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Water usage recorded successfully", saved));
    }

    @PostMapping(value = "/upload-csv", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<WaterUsage>>> uploadCsvMeterReadings(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Please upload a non-empty CSV file.", null));
        }

        List<WaterUsage> savedReadings = new java.util.ArrayList<>();
        int duplicatesSkipped = 0;

        try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(file.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            boolean isHeader = true;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;
                if (isHeader && (line.toLowerCase().startsWith("meter") || line.toLowerCase().startsWith("serial"))) {
                    isHeader = false;
                    continue;
                }
                isHeader = false;

                String[] columns = line.split(",");
                if (columns.length < 4) continue;

                try {
                    Long meterId = Long.parseLong(columns[0].trim());
                    Double prevReading = Double.parseDouble(columns[1].trim());
                    Double currReading = Double.parseDouble(columns[2].trim());
                    java.time.LocalDate readingDate = java.time.LocalDate.parse(columns[3].trim());

                    if (currReading < prevReading) continue;

                    // Duplicate Reading Check
                    if (usageRepository.existsByMeterIdAndReadingDate(meterId, readingDate)) {
                        duplicatesSkipped++;
                        continue;
                    }

                    Double consumption = Math.round((currReading - prevReading) * 100.0) / 100.0;
                    WaterUsage usage = new WaterUsage(meterId, prevReading, currReading, consumption, readingDate);
                    WaterUsage saved = usageRepository.save(usage);
                    savedReadings.add(saved);

                    // Anomaly Check (> 5.0 KL)
                    if (consumption > 5.0) {
                        meterRepository.findById(meterId).ifPresent(meter -> {
                            meter.setStatus("ALERT");
                            meterRepository.save(meter);
                        });
                    }
                } catch (Exception e) {
                    // Skip malformed rows
                }
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to parse CSV file: " + e.getMessage(), null));
        }

        String msg = "Successfully processed " + savedReadings.size() + " readings from CSV.";
        if (duplicatesSkipped > 0) {
            msg += " (" + duplicatesSkipped + " duplicate entries skipped)";
        }
        return ResponseEntity.ok(ApiResponse.success(msg, savedReadings));
    }
}


