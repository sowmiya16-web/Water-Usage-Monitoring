-- =========================================================
-- Smart Water Usage Monitoring System — MySQL Schema Initializer
-- Database: water_monitoring
-- =========================================================

CREATE DATABASE IF NOT EXISTS water_monitoring;
USE water_monitoring;

-- 1. ROLES & USERS
CREATE TABLE IF NOT EXISTS roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT,
    role_id INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. BUILDINGS & APARTMENTS
CREATE TABLE IF NOT EXISTS building (
    building_id INT PRIMARY KEY AUTO_INCREMENT,
    building_name VARCHAR(100) NOT NULL,
    total_floors INT NOT NULL,
    total_units INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS apartment (
    apartment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    apartment_number VARCHAR(20) NOT NULL,
    building_name VARCHAR(100) NOT NULL DEFAULT 'Block A',
    floor_number INT NOT NULL DEFAULT 1,
    occupancy_status VARCHAR(20) DEFAULT 'OCCUPIED',
    resident_user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resident (
    resident_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    apartment_number VARCHAR(20) NOT NULL,
    building_name VARCHAR(100) NOT NULL,
    occupancy_status VARCHAR(20) DEFAULT 'OCCUPIED',
    registered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. WATER METERS & USAGE
CREATE TABLE IF NOT EXISTS water_meter (
    meter_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    apartment_id BIGINT NOT NULL UNIQUE,
    battery_percentage INT DEFAULT 100,
    signal_strength INT DEFAULT 100,
    status VARCHAR(20) DEFAULT 'ONLINE',
    last_ping_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartment(apartment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS water_usage (
    usage_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    meter_id BIGINT NOT NULL,
    previous_reading DECIMAL(10,2) NOT NULL,
    current_reading DECIMAL(10,2) NOT NULL,
    consumption_kl DECIMAL(10,2) NOT NULL,
    reading_date DATE NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meter_id) REFERENCES water_meter(meter_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. BILLING & PAYMENTS
CREATE TABLE IF NOT EXISTS bill (
    bill_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    apartment_id BIGINT NOT NULL,
    billing_month VARCHAR(20) NOT NULL,
    consumption_kl DECIMAL(10,2) NOT NULL,
    volumetric_amount DECIMAL(10,2) NOT NULL,
    base_charge DECIMAL(10,2) NOT NULL,
    common_water_charge DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartment(apartment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment (
    payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_ref VARCHAR(100) NOT NULL UNIQUE,
    bill_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'SUCCESSFUL',
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bill(bill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoice (
    invoice_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    bill_id BIGINT NOT NULL,
    payment_id BIGINT,
    apartment_id BIGINT NOT NULL,
    pdf_data LONGBLOB NOT NULL,
    sent_to_email VARCHAR(150),
    email_sent BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bill(bill_id),
    FOREIGN KEY (apartment_id) REFERENCES apartment(apartment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. MAINTENANCE & COMPLAINTS
CREATE TABLE IF NOT EXISTS maintenance_request (
    task_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    location VARCHAR(100) NOT NULL,
    assigned_to VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'ROUTINE',
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS complaint (
    complaint_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ticket_ref VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. BILLING CYCLES & TARIFF PLANS
CREATE TABLE IF NOT EXISTS billing_cycle (
    cycle_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cycle_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tariff_plan (
    plan_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    plan_name VARCHAR(100) NOT NULL,
    building_id INT DEFAULT 1,
    tier1_limit_kl DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    tier1_rate_per_kl DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    tier2_limit_kl DECIMAL(10,2) NOT NULL DEFAULT 20.00,
    tier2_rate_per_kl DECIMAL(10,2) NOT NULL DEFAULT 15.00,
    tier3_rate_per_kl DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    fixed_base_charge DECIMAL(10,2) NOT NULL DEFAULT 150.00,
    common_water_charge DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. BULK WATER PURCHASES
CREATE TABLE IF NOT EXISTS bulk_water_purchase (
    purchase_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    supplier_name VARCHAR(100) NOT NULL,
    delivery_date DATE NOT NULL,
    volume_kl DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    water_source VARCHAR(100),
    unit_cost DECIMAL(10,2),
    notes TEXT,
    billing_cycle_id BIGINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. ALERTS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS alerts (
    alert_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    alert_ref VARCHAR(50) NOT NULL UNIQUE,
    apartment_id BIGINT,
    user_id BIGINT,
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    current_value DECIMAL(10,2),
    expected_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    difference_value DECIMAL(10,2),
    severity VARCHAR(20) DEFAULT 'WARNING',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    acknowledged BOOLEAN DEFAULT FALSE,
    bill_id BIGINT,
    usage_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartment(apartment_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



