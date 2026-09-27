-- H2 Seed Data Initializer

INSERT INTO roles (role_id, name) VALUES 
(1, 'ROLE_RESIDENT'),
(3, 'ROLE_PROPERTY_ADMIN');

INSERT INTO building (building_id, building_name, total_floors, total_units) VALUES
(1, 'Block A', 4, 8),
(2, 'Block B', 5, 10),
(3, 'Block C', 4, 8);

INSERT INTO apartment (apartment_id, apartment_number, building_name, floor_number, occupancy_status) VALUES
(1, 'A-101', 'Block A', 1, 'OCCUPIED'),
(2, 'A-102', 'Block A', 1, 'OCCUPIED'),
(3, 'B-201', 'Block B', 2, 'OCCUPIED'),
(4, 'C-301', 'Block C', 3, 'VACANT');

INSERT INTO water_meter (meter_id, serial_number, apartment_id, battery_percentage, signal_strength, status) VALUES
(1, 'WM-1001-A101', 1, 98, 95, 'ONLINE'),
(2, 'WM-1002-A102', 2, 92, 88, 'ONLINE'),
(3, 'WM-1003-B201', 3, 75, 82, 'ONLINE');

-- No static bills pre-seeded; bills are generated dynamically when Admin saves Tariff Plan in Tariff Management

INSERT INTO maintenance_request (task_id, task_number, title, location, assigned_to, priority, status) VALUES
(1, 'MAIN-2026-001', 'Meter Calibration Check', 'Block A - Unit A-101', 'Technician Ramesh', 'ROUTINE', 'IN_PROGRESS'),
(2, 'MAIN-2026-002', 'Pipeline Valve Leak Repair', 'Block B Basement', 'Plumber Suresh', 'HIGH', 'OPEN');

INSERT INTO tariff_plan (plan_id, plan_name, building_id, tier1_limit_kl, tier1_rate_per_kl, tier2_limit_kl, tier2_rate_per_kl, tier3_rate_per_kl, fixed_base_charge, common_water_charge) VALUES
(1, 'Tiered Standard Plan', 1, 10.00, 5.00, 20.00, 15.00, 25.00, 150.00, 100.00);

