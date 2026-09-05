BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ACCOUNT TABLE
CREATE TABLE IF NOT EXISTS account (
    account_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT account_type_check CHECK (account_type IN ('user', 'agency', 'admin'))
);

-- 2. ADDRESS TABLE
CREATE TABLE IF NOT EXISTS address (
    address_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    street_address TEXT NOT NULL,
    thana VARCHAR(100),
    district VARCHAR(100),
    division VARCHAR(100),
    postal_code VARCHAR(20)
);

-- 3. USER / TRAVELER TABLE
CREATE TABLE IF NOT EXISTS app_user (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id INTEGER NOT NULL UNIQUE,
    present_address_id INTEGER,
    permanent_address_id INTEGER,
    username VARCHAR(50) NOT NULL UNIQUE,
    fullname VARCHAR(150) NOT NULL,
    gender VARCHAR(30),
    dob DATE,
    phone VARCHAR(30),
    pfp_url TEXT,
    CONSTRAINT fk_user_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_user_present_address FOREIGN KEY (present_address_id) REFERENCES address(address_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_user_permanent_address FOREIGN KEY (permanent_address_id) REFERENCES address(address_id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 4. ADMIN TABLE
CREATE TABLE IF NOT EXISTS admin (
    admin_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id INTEGER NOT NULL UNIQUE,
    admin_name VARCHAR(150) NOT NULL,
    role_level VARCHAR(50) NOT NULL,
    CONSTRAINT fk_admin_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 5. AGENCY TABLE
CREATE TABLE IF NOT EXISTS agency (
    agency_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id INTEGER NOT NULL UNIQUE,
    registered_address_id INTEGER NOT NULL,
    agency_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    logo_url TEXT,
    experience_years INTEGER NOT NULL DEFAULT 0,
    overview TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_review',
    website_url TEXT,
    trade_license_doc_url TEXT,
    CONSTRAINT fk_agency_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_agency_registered_address FOREIGN KEY (registered_address_id) REFERENCES address(address_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT agency_experience_check CHECK (experience_years >= 0),
    CONSTRAINT agency_status_check CHECK (status IN ('pending_review', 'verified', 'rejected', 'suspended'))
);

-- 6. DESTINATION TABLE
CREATE TABLE IF NOT EXISTS destination (
    destination_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    division VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    avg_rating NUMERIC(3,2),
    CONSTRAINT destination_rating_check CHECK (avg_rating IS NULL OR avg_rating BETWEEN 0 AND 5)
);

-- 7. ITINERARY TABLE
CREATE TABLE IF NOT EXISTS itinerary (
    itinerary_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    destination_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    group_size INTEGER NOT NULL,
    total_budget NUMERIC(12,2),
    transit_mode VARCHAR(100),
    CONSTRAINT fk_itinerary_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_itinerary_destination FOREIGN KEY (destination_id) REFERENCES destination(destination_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT itinerary_group_size_check CHECK (group_size > 0),
    CONSTRAINT itinerary_budget_check CHECK (total_budget IS NULL OR total_budget >= 0)
);

-- 8. TOUR_PACKAGE TABLE
CREATE TABLE IF NOT EXISTS tour_package (
    package_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    agency_id INTEGER NOT NULL,
    destination_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    duration INTEGER NOT NULL,
    max_seat INTEGER NOT NULL,
    discount NUMERIC(5,2) NOT NULL DEFAULT 0,
    description TEXT,
    CONSTRAINT fk_tour_package_agency FOREIGN KEY (agency_id) REFERENCES agency(agency_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tour_package_destination FOREIGN KEY (destination_id) REFERENCES destination(destination_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT tour_package_price_check CHECK (price >= 0),
    CONSTRAINT tour_package_duration_check CHECK (duration > 0),
    CONSTRAINT tour_package_max_seat_check CHECK (max_seat > 0),
    CONSTRAINT tour_package_discount_check CHECK (discount BETWEEN 0 AND 100)
);

-- 9. TOUR_SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS tour_schedule (
    schedule_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    package_id INTEGER NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    CONSTRAINT fk_tour_schedule_package FOREIGN KEY (package_id) REFERENCES tour_package(package_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT tour_schedule_date_check CHECK (return_date >= departure_date),
    CONSTRAINT unique_package_schedule UNIQUE (package_id, departure_date, return_date)
);

-- 10. BOOKING TABLE
CREATE TABLE IF NOT EXISTS booking (
    booking_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    schedule_id INTEGER NOT NULL,
    itinerary_id INTEGER,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    group_size INTEGER NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_booking_package FOREIGN KEY (package_id) REFERENCES tour_package(package_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_booking_schedule FOREIGN KEY (schedule_id) REFERENCES tour_schedule(schedule_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_booking_itinerary FOREIGN KEY (itinerary_id) REFERENCES itinerary(itinerary_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT booking_group_size_check CHECK (group_size > 0),
    CONSTRAINT booking_total_amount_check CHECK (total_amount >= 0),
    CONSTRAINT booking_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'))
);

-- 11. REVIEW TABLE
CREATE TABLE IF NOT EXISTS review (
    review_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_review_package FOREIGN KEY (package_id) REFERENCES tour_package(package_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT review_rating_check CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT unique_user_package_review UNIQUE (user_id, package_id)
);

-- 12. BLOG TABLE
CREATE TABLE IF NOT EXISTS blog (
    blog_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'published',
    image_url TEXT,
    publish_date DATE,
    CONSTRAINT fk_blog_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT blog_status_check CHECK (status IN ('draft', 'published', 'pending', 'rejected'))
);

-- ==========================================================
-- COMPREHENSIVE SEED DATA (Ordered to respect all Foreign Keys)
-- Password for all accounts: 'password123'
-- Hash: $2b$10$wK1Gv5.sYnI0Q5Nl3PzR0O6wA7j9KqV0Qz4E2Yk1E5U6T7N8Y9.2e
-- ==========================================================

-- Seed Accounts (Admin = ID 1, Agency = ID 2, Traveler = ID 3)
INSERT INTO account (email, password_hash, account_type)
VALUES 
    ('admin@ovizatri.com', '$2b$10$wK1Gv5.sYnI0Q5Nl3PzR0O6wA7j9KqV0Qz4E2Yk1E5U6T7N8Y9.2e', 'admin'),
    ('agency@bengaltours.com', '$2b$10$wK1Gv5.sYnI0Q5Nl3PzR0O6wA7j9KqV0Qz4E2Yk1E5U6T7N8Y9.2e', 'agency'),
    ('traveler@gmail.com', '$2b$10$wK1Gv5.sYnI0Q5Nl3PzR0O6wA7j9KqV0Qz4E2Yk1E5U6T7N8Y9.2e', 'user')
ON CONFLICT (email) DO NOTHING;

-- Seed Admin Profile
INSERT INTO admin (account_id, admin_name, role_level)
VALUES (1, 'Super Admin', 'superadmin')
ON CONFLICT (account_id) DO NOTHING;

-- Seed Addresses
INSERT INTO address (street_address, thana, district, division, postal_code)
VALUES 
    ('Gulshan 2', 'Gulshan', 'Dhaka', 'Dhaka', '1212'),
    ('Dhanmondi 27', 'Dhanmondi', 'Dhaka', 'Dhaka', '1209');

-- Seed Agency Profile
INSERT INTO agency (account_id, registered_address_id, agency_name, owner_name, phone, status, experience_years)
VALUES (2, 1, 'Bengal Tours Agency', 'Mr. Kamrul', '01711111111', 'verified', 5)
ON CONFLICT (account_id) DO NOTHING;

-- Seed Traveler User Profile
INSERT INTO app_user (account_id, present_address_id, username, fullname, phone)
VALUES (3, 2, 'rahim_traveler', 'Rahim Ahmed', '01822222222')
ON CONFLICT (account_id) DO NOTHING;

-- Seed Destination
INSERT INTO destination (name, division, description, category, avg_rating)
VALUES 
    ('Cox''s Bazar Beach', 'Chittagong', 'Longest natural sea beach in the world.', 'Beach', 4.8),
    ('Sajek Valley', 'Chittagong', 'Valley of clouds in Rangamati.', 'Hill', 4.9)
ON CONFLICT (name) DO NOTHING;

-- Seed Tour Package
INSERT INTO tour_package (agency_id, destination_id, title, price, duration, max_seat, discount, description)
VALUES 
    (1, 1, 'Cox''s Bazar Luxury Escape', 8500.00, 3, 20, 5.00, 'Enjoy 3 days in luxury beach resorts with guided tours.'),
    (1, 2, 'Sajek Cloud Retreat', 6500.00, 2, 15, 0.00, 'Witness the breathtaking sea of clouds in Sajek.')
ON CONFLICT DO NOTHING;

-- Seed Tour Schedule
INSERT INTO tour_schedule (package_id, departure_date, return_date)
VALUES 
    (1, '2026-10-10', '2026-10-13'),
    (2, '2026-10-15', '2026-10-17')
ON CONFLICT (package_id, departure_date, return_date) DO NOTHING;

-- Seed Booking (Traveler user_id = 1, package_id = 1, schedule_id = 1)
INSERT INTO booking (user_id, package_id, schedule_id, group_size, total_amount, payment_status)
VALUES 
    (1, 1, 1, 2, 17000.00, 'paid');

COMMIT;