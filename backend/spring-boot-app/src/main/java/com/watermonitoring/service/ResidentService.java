package com.watermonitoring.service;

import com.watermonitoring.dto.resident.ResidentDto;
import com.watermonitoring.entity.*;
import com.watermonitoring.exception.BadRequestException;
import com.watermonitoring.exception.ResourceNotFoundException;
import com.watermonitoring.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ResidentService {

    private final ResidentRepository residentRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApartmentRepository apartmentRepository;
    private final WaterMeterRepository waterMeterRepository;
    private final WaterUsageRepository waterUsageRepository;

    @Autowired
    public ResidentService(
            ResidentRepository residentRepository,
            EmailService emailService,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            ApartmentRepository apartmentRepository,
            WaterMeterRepository waterMeterRepository,
            WaterUsageRepository waterUsageRepository) {

        this.residentRepository = residentRepository;
        this.emailService = emailService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.apartmentRepository = apartmentRepository;
        this.waterMeterRepository = waterMeterRepository;
        this.waterUsageRepository = waterUsageRepository;
    }

    // =========================================================
    // GET ALL RESIDENTS
    // =========================================================

    public List<ResidentDto> getAllResidents() {
        return residentRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // =========================================================
    // GET RESIDENT BY ID
    // =========================================================

    public ResidentDto getResidentById(Long id) {
        Resident resident = residentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Resident not found with ID: " + id));

        return mapToDto(resident);
    }

    // =========================================================
    // CREATE RESIDENT (Transactional with User, Apartment, Meter)
    // =========================================================

    @Transactional
    public ResidentDto createResident(ResidentDto dto) {
        String email = dto.getEmail().trim().toLowerCase();

        // 1. Check duplicate email
        if (residentRepository.existsByEmail(email)) {
            throw new BadRequestException("Resident with email " + email + " already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("A user account with email " + email + " already exists");
        }

        // 2. Determine apartment and building identifiers
        String aptNum = (dto.getFlatNumber() != null && !dto.getFlatNumber().isBlank())
                ? dto.getFlatNumber().trim()
                : (dto.getApartmentNumber() != null && !dto.getApartmentNumber().isBlank()
                    ? dto.getApartmentNumber().trim() : "101");

        String bName = (dto.getBuildingName() != null && !dto.getBuildingName().isBlank())
                ? dto.getBuildingName().trim() : "Block A";

        // 3. Find or Create Apartment in MySQL
        Apartment apartment = apartmentRepository.findByApartmentNumberAndBuildingName(aptNum, bName)
                .orElseGet(() -> {
                    Apartment newApt = new Apartment();
                    newApt.setApartmentNumber(aptNum);
                    newApt.setBuildingName(bName);
                    newApt.setFloorNumber(1);
                    newApt.setOccupancyStatus(dto.getOccupancyStatus() != null ? dto.getOccupancyStatus() : "OCCUPIED");
                    return apartmentRepository.save(newApt);
                });

        // 4. Create User login credentials
        String generatedPassword = generatePassword();
        User user = new User(
                dto.getFullName(),
                email,
                dto.getPhone(),
                passwordEncoder.encode(generatedPassword)
        );

        Role residentRole = roleRepository.findByName("ROLE_RESIDENT")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_RESIDENT")));

        Set<Role> roles = new HashSet<>();
        roles.add(residentRole);
        user.setRoles(roles);
        User savedUser = userRepository.save(user);

        // 5. Link Apartment to User
        apartment.setResidentUserId(savedUser.getUserId());
        apartment.setOccupancyStatus(dto.getOccupancyStatus() != null ? dto.getOccupancyStatus() : "OCCUPIED");
        apartmentRepository.save(apartment);

        // 6. Create Resident record linked to User
        Resident resident = new Resident(
                dto.getFullName(),
                email,
                dto.getPhone(),
                aptNum,
                bName,
                dto.getOccupancyStatus()
        );
        resident.setUserId(savedUser.getUserId());
        resident.setApartmentId(apartment.getApartmentId());
        Resident saved = residentRepository.save(resident);
        dto.setResidentId(saved.getResidentId());

        // 7. Create WaterMeter & baseline WaterUsage if not already present
        String meterSerial = (dto.getMeterNumber() != null && !dto.getMeterNumber().isBlank())
                ? dto.getMeterNumber().trim()
                : (dto.getWaterMeterId() != null && !dto.getWaterMeterId().isBlank()
                    ? dto.getWaterMeterId().trim()
                    : "WM-" + bName.replace(" ", "") + "-" + aptNum.replace(" ", ""));

        WaterMeter meter = waterMeterRepository.findByApartmentId(apartment.getApartmentId())
                .orElseGet(() -> {
                    WaterMeter newMeter = new WaterMeter();
                    newMeter.setSerialNumber(meterSerial);
                    newMeter.setApartmentId(apartment.getApartmentId());
                    newMeter.setBatteryPercentage(98);
                    newMeter.setSignalStrength(95);
                    newMeter.setStatus("ONLINE");
                    return waterMeterRepository.save(newMeter);
                });

        if (dto.getInitialReading() != null && !dto.getInitialReading().isBlank()) {
            try {
                double initialVal = Double.parseDouble(dto.getInitialReading().trim());
                WaterUsage usage = new WaterUsage(meter.getMeterId(), initialVal, initialVal, 0.0, LocalDate.now());
                waterUsageRepository.save(usage);
            } catch (NumberFormatException ignored) {}
        }

        // 8. Email notification dispatch
        if (!Boolean.FALSE.equals(dto.getSendEmail())) {
            boolean emailResult = emailService.sendResidentWelcomeEmail(dto, generatedPassword);
            dto.setEmailSent(emailResult);
        } else {
            dto.setEmailSent(false);
        }

        ResidentDto savedDto = mapToDto(saved);
        savedDto.setSendEmail(dto.getSendEmail());
        savedDto.setEmailSent(dto.getEmailSent());
        savedDto.setMeterNumber(meter.getSerialNumber());
        savedDto.setWaterMeterId(meter.getSerialNumber());

        return savedDto;
    }

    // =========================================================
    // GET RESIDENTS BY BUILDING
    // =========================================================

    public List<ResidentDto> getResidentsByBuilding(String buildingName) {
        return residentRepository
                .findByBuildingName(buildingName)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // =========================================================
    // GENERATE TEMPORARY PASSWORD
    // =========================================================

    private String generatePassword() {
        return UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10);
    }

    // =========================================================
    // ENTITY → DTO (With linked Apartment & Meter enrichment)
    // =========================================================

    private ResidentDto mapToDto(Resident resident) {
        ResidentDto dto = new ResidentDto(
                resident.getResidentId(),
                resident.getFullName(),
                resident.getEmail(),
                resident.getPhone(),
                resident.getApartmentNumber(),
                resident.getBuildingName(),
                resident.getOccupancyStatus()
        );

        if (resident.getUserId() != null) {
            apartmentRepository.findByResidentUserId(resident.getUserId()).ifPresent(apt -> {
                waterMeterRepository.findByApartmentId(apt.getApartmentId()).ifPresent(wm -> {
                    dto.setMeterNumber(wm.getSerialNumber());
                    dto.setWaterMeterId(wm.getSerialNumber());
                });
            });
        }

        return dto;
    }
}