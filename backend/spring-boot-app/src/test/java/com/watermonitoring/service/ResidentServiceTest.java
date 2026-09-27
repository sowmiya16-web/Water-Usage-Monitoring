package com.watermonitoring.service;

import com.watermonitoring.dto.resident.ResidentDto;
import com.watermonitoring.entity.Resident;
import com.watermonitoring.repository.ResidentRepository;
import com.watermonitoring.repository.RoleRepository;
import com.watermonitoring.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ResidentServiceTest {

    @Mock
    private ResidentRepository residentRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private ResidentService residentService;

    @Test
    void testGetAllResidents() {
        Resident resident = new Resident("John Doe", "john@example.com", "9876543210", "101", "Block A", "OCCUPIED");
        when(residentRepository.findAll()).thenReturn(Collections.singletonList(resident));

        List<ResidentDto> residents = residentService.getAllResidents();

        assertNotNull(residents);
        assertEquals(1, residents.size());
        assertEquals("John Doe", residents.get(0).getFullName());
        assertEquals("john@example.com", residents.get(0).getEmail());
    }
}
