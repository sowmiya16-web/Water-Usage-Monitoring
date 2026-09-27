package com.watermonitoring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WaterMonitoringApplication {

    public static void main(String[] args) {
        SpringApplication.run(WaterMonitoringApplication.class, args);
        System.out.println("==================================================");
        System.out.println("💧 Water Monitoring Backend Started Successfully!");
        System.out.println("   Server URL : http://localhost:8080");
        System.out.println("   Test API   : http://localhost:8080/api/test");
        System.out.println("   Apartments : http://localhost:8080/api/apartments");
        System.out.println("==================================================");
    }
}
