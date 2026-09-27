-- =========================================================
-- Smart Water Usage Monitoring System — Seed Data
-- Database: water_monitoring
-- =========================================================

USE water_monitoring;

-- Seed Roles
INSERT IGNORE INTO roles (role_id, name) VALUES 
(1, 'ROLE_RESIDENT'),
(3, 'ROLE_PROPERTY_ADMIN');

-- Seed Buildings
INSERT IGNORE INTO building (building_id, building_name, total_floors, total_units) VALUES
(1, 'Block A', 4, 8),
(2, 'Block B', 5, 10),
(3, 'Block C', 4, 8);

-- Seed Initial Apartments
INSERT IGNORE INTO apartment (apartment_id, apartment_number, building_name, floor_number, occupancy_status) VALUES
(1, 'A-101', 'Block A', 1, 'OCCUPIED'),
(2, 'A-102', 'Block A', 1, 'OCCUPIED'),
(3, 'B-201', 'Block B', 2, 'OCCUPIED'),
(4, 'C-301', 'Block C', 3, 'VACANT');
