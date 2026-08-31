-- ==========================================================
-- OVIZATRI DATABASE SCHEMA & AUTHENTICATION TABLES
-- ==========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & CORE AUTHENTICATION TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(30) NOT NULL DEFAULT 'traveler' CHECK (role IN ('traveler', 'agency', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TRAVELER PROFILES TABLE
CREATE TABLE IF NOT EXISTS traveler_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Bangladesh',
    emergency_contact VARCHAR(50),
    passport_number VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. AGENCY PROFILES TABLE
CREATE TABLE IF NOT EXISTS agency_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_name VARCHAR(200) NOT NULL,
    trade_license VARCHAR(100) UNIQUE,
    contact_person VARCHAR(150),
    office_address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Bangladesh',
    website VARCHAR(255),
    description TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PACKAGE TABLE
-- Assumes the related users exist and have admin role privileges.
CREATE TABLE IF NOT EXISTS package (
    package_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    destination VARCHAR(255) NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    price_per_person NUMERIC(12, 2) NOT NULL CHECK (price_per_person >= 0),
    max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
    available_slots INTEGER NOT NULL CHECK (available_slots >= 0),
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT package_capacity_check
        CHECK (available_slots <= max_capacity)
);

INSERT INTO package (title, description, destination, duration_days, price_per_person, max_capacity, available_slots, created_by)
VALUES (
    'Bali Wellness Escape',
    'A 5-day retreat featuring beach relaxation, yoga, spa treatments, and cultural experiences in Bali.',
    'Bali, Indonesia',
    5,
    899.00,
    20,
    12,
    1
);

INSERT INTO package (title, description, destination, duration_days, price_per_person, max_capacity, available_slots, created_by)
VALUES (
    'Swiss Alps Adventure',
    'A 7-day mountain journey through scenic rail routes, glacier walks, and alpine village stays.',
    'Zermatt, Switzerland',
    7,
    1499.50,
    15,
    8,
    2
);

INSERT INTO package (title, description, destination, duration_days, price_per_person, max_capacity, available_slots, created_by)
VALUES (
    'Kyoto Cultural Discovery',
    'Explore temple heritage, local cuisine, and traditional neighborhoods during this immersive Kyoto tour.',
    'Kyoto, Japan',
    4,
    1099.00,
    18,
    18,
    3
);

-- 5. PACKAGES / TOURS TABLE
CREATE TABLE IF NOT EXISTS tour_packages (
    id SERIAL PRIMARY KEY,
    agency_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    destination VARCHAR(150) NOT NULL,
    duration_days INTEGER NOT NULL,
    duration_nights INTEGER NOT NULL,
    price_per_person NUMERIC(12, 2) NOT NULL,
    max_travelers INTEGER DEFAULT 20,
    start_date DATE,
    end_date DATE,
    image_url TEXT,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES tour_packages(id) ON DELETE CASCADE,
    traveler_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    num_travelers INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(12, 2) NOT NULL,
    booking_status VARCHAR(30) DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_status VARCHAR(30) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
    special_requests TEXT,
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tour_packages_agency ON tour_packages(agency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_traveler ON bookings(traveler_id);
CREATE INDEX IF NOT EXISTS idx_bookings_package ON bookings(package_id);
