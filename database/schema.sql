-- ============================================================
-- OVIZATRI - PostgreSQL Database Schema
-- Based on:
--   1) OVIZATRI ERD (erd2.drawio.pdf)
--   2) Current frontend data model and flows
--
-- The schema intentionally stays within the ERD/frontend scope.
-- No frontend files are modified by this file.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ACCOUNT
-- ============================================================
CREATE TABLE account (
    account_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT account_type_check
        CHECK (account_type IN ('user', 'agency', 'admin'))
);

-- ============================================================
-- 2. ADDRESS
-- Used by USER (present/permanent) and AGENCY (registered).
-- ============================================================
CREATE TABLE address (
    address_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    street_address TEXT NOT NULL,
    thana VARCHAR(100),
    district VARCHAR(100),
    division VARCHAR(100),
    postal_code VARCHAR(20)
);

-- ============================================================
-- 3. USER / TRAVELER
-- ACCOUNT 1 : 0..1 USER
-- ============================================================
CREATE TABLE app_user (
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

    CONSTRAINT fk_user_account
        FOREIGN KEY (account_id)
        REFERENCES account(account_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_user_present_address
        FOREIGN KEY (present_address_id)
        REFERENCES address(address_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_user_permanent_address
        FOREIGN KEY (permanent_address_id)
        REFERENCES address(address_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- ============================================================
-- 4. ADMIN
-- ACCOUNT 1 : 0..1 ADMIN
-- ============================================================
CREATE TABLE admin (
    admin_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id INTEGER NOT NULL UNIQUE,
    admin_name VARCHAR(150) NOT NULL,
    role_level VARCHAR(50) NOT NULL,

    CONSTRAINT fk_admin_account
        FOREIGN KEY (account_id)
        REFERENCES account(account_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- ============================================================
-- 5. AGENCY
-- ACCOUNT 1 : 0..1 AGENCY
-- ============================================================
CREATE TABLE agency (
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

    CONSTRAINT fk_agency_account
        FOREIGN KEY (account_id)
        REFERENCES account(account_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_agency_registered_address
        FOREIGN KEY (registered_address_id)
        REFERENCES address(address_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT agency_experience_check
        CHECK (experience_years >= 0),

    CONSTRAINT agency_status_check
        CHECK (status IN ('pending_review', 'verified', 'rejected', 'suspended'))
);

-- ============================================================
-- 6. DESTINATION
-- ============================================================
CREATE TABLE destination (
    destination_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    division VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    avg_rating NUMERIC(3,2),

    CONSTRAINT destination_rating_check
        CHECK (avg_rating IS NULL OR avg_rating BETWEEN 0 AND 5)
);

-- ============================================================
-- 7. ITINERARY
-- Customer-created trip planner.
-- USER 1 : N ITINERARY
-- DESTINATION 1 : N ITINERARY
-- ============================================================
CREATE TABLE itinerary (
    itinerary_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    destination_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    group_size INTEGER NOT NULL,
    total_budget NUMERIC(12,2),
    transit_mode VARCHAR(100),

    CONSTRAINT fk_itinerary_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_itinerary_destination
        FOREIGN KEY (destination_id)
        REFERENCES destination(destination_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT itinerary_group_size_check
        CHECK (group_size > 0),

    CONSTRAINT itinerary_budget_check
        CHECK (total_budget IS NULL OR total_budget >= 0)
);

-- ============================================================
-- 8. ITINERARY_DAY
-- ITINERARY 1 : N ITINERARY_DAY
-- ============================================================
CREATE TABLE itinerary_day (
    itinerary_day_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    itinerary_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    name VARCHAR(200),
    cost_estimate NUMERIC(12,2),

    CONSTRAINT fk_itinerary_day_itinerary
        FOREIGN KEY (itinerary_id)
        REFERENCES itinerary(itinerary_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT itinerary_day_number_check
        CHECK (day_number > 0),

    CONSTRAINT itinerary_day_cost_check
        CHECK (cost_estimate IS NULL OR cost_estimate >= 0),

    CONSTRAINT unique_itinerary_day
        UNIQUE (itinerary_id, day_number)
);

-- ============================================================
-- 9. DAY_ACTIVITY
-- ITINERARY_DAY 1 : N DAY_ACTIVITY
-- ============================================================
CREATE TABLE day_activity (
    activity_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    itinerary_day_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    activity_time TIME,

    CONSTRAINT fk_day_activity_itinerary_day
        FOREIGN KEY (itinerary_day_id)
        REFERENCES itinerary_day(itinerary_day_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- ============================================================
-- 10. TOUR_PACKAGE
-- A package belongs to one destination and is offered by one agency.
-- DESTINATION 1 : N TOUR_PACKAGE
-- AGENCY 1 : N TOUR_PACKAGE
-- ============================================================
CREATE TABLE tour_package (
    package_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    agency_id INTEGER NOT NULL,
    destination_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    duration INTEGER NOT NULL,
    max_seat INTEGER NOT NULL,
    discount NUMERIC(5,2) NOT NULL DEFAULT 0,
    description TEXT,

    CONSTRAINT fk_tour_package_agency
        FOREIGN KEY (agency_id)
        REFERENCES agency(agency_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_tour_package_destination
        FOREIGN KEY (destination_id)
        REFERENCES destination(destination_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT tour_package_price_check
        CHECK (price >= 0),

    CONSTRAINT tour_package_duration_check
        CHECK (duration > 0),

    CONSTRAINT tour_package_max_seat_check
        CHECK (max_seat > 0),

    CONSTRAINT tour_package_discount_check
        CHECK (discount BETWEEN 0 AND 100)
);

-- ============================================================
-- 11. AMENITY
-- Shared amenity catalogue.
-- TOUR_PACKAGE N : M AMENITY through package_amenity.
-- This matches the frontend's amenityIDs arrays and the ERD's
-- "includes" relationship without duplicating amenity data.
-- ============================================================
CREATE TABLE amenity (
    amenity_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    type VARCHAR(100)
);

CREATE TABLE package_amenity (
    package_id INTEGER NOT NULL,
    amenity_id INTEGER NOT NULL,

    PRIMARY KEY (package_id, amenity_id),

    CONSTRAINT fk_package_amenity_package
        FOREIGN KEY (package_id)
        REFERENCES tour_package(package_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_package_amenity_amenity
        FOREIGN KEY (amenity_id)
        REFERENCES amenity(amenity_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- ============================================================
-- 12. TOUR_SCHEDULE
-- TOUR_PACKAGE 1 : N TOUR_SCHEDULE
-- ============================================================
CREATE TABLE tour_schedule (
    schedule_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    package_id INTEGER NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,

    CONSTRAINT fk_tour_schedule_package
        FOREIGN KEY (package_id)
        REFERENCES tour_package(package_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT tour_schedule_date_check
        CHECK (return_date >= departure_date),

    CONSTRAINT unique_package_schedule
        UNIQUE (package_id, departure_date, return_date)
);

-- ============================================================
-- 13. BOOKING
-- USER 1 : N BOOKING
-- TOUR_PACKAGE 1 : N BOOKING
-- TOUR_SCHEDULE 1 : N BOOKING
--
-- The current frontend books a TOUR_PACKAGE + TOUR_SCHEDULE.
-- itinerary_id is included because ITINERARY exists in the ERD and
-- can be associated with a booking later; it is nullable because
-- the current booking flow does not send an itinerary.
-- ============================================================
CREATE TABLE booking (
    booking_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    schedule_id INTEGER NOT NULL,
    itinerary_id INTEGER,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    group_size INTEGER NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',

    CONSTRAINT fk_booking_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_package
        FOREIGN KEY (package_id)
        REFERENCES tour_package(package_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_schedule
        FOREIGN KEY (schedule_id)
        REFERENCES tour_schedule(schedule_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_itinerary
        FOREIGN KEY (itinerary_id)
        REFERENCES itinerary(itinerary_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT booking_group_size_check
        CHECK (group_size > 0),

    CONSTRAINT booking_total_amount_check
        CHECK (total_amount >= 0),

    CONSTRAINT booking_payment_status_check
        CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'))
);

-- ============================================================
-- 14. PAYMENT
-- BOOKING 1 : 0..1 PAYMENT
-- ============================================================
CREATE TABLE payment (
    payment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE,
    transaction_id VARCHAR(150) NOT NULL UNIQUE,
    payment_gateway VARCHAR(100) NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_booking
        FOREIGN KEY (booking_id)
        REFERENCES booking(booking_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT payment_amount_check
        CHECK (amount_paid >= 0)
);

-- ============================================================
-- 15. REVIEW
-- USER 1 : N REVIEW
-- TOUR_PACKAGE 1 : N REVIEW
--
-- Current frontend reviews are package reviews.
-- ============================================================
CREATE TABLE review (
    review_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    review_date DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT fk_review_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_review_package
        FOREIGN KEY (package_id)
        REFERENCES tour_package(package_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT review_rating_check
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT unique_user_package_review
        UNIQUE (user_id, package_id)
);

-- ============================================================
-- 16. BLOG
-- ACCOUNT 1 : N BLOG
-- ============================================================
CREATE TABLE blog (
    blog_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'published',
    image_url TEXT,
    publish_date DATE,

    CONSTRAINT fk_blog_account
        FOREIGN KEY (account_id)
        REFERENCES account(account_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT blog_status_check
        CHECK (status IN ('draft', 'published', 'pending', 'rejected'))
);

-- ============================================================
-- 17. AGENCY_AUDIT_LOG
-- ADMIN 1 : N AUDIT_LOG
-- AGENCY 1 : N AUDIT_LOG
-- ============================================================
CREATE TABLE agency_audit_log (
    audit_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    agency_id INTEGER NOT NULL,
    notes TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_changed_to VARCHAR(30) NOT NULL,

    CONSTRAINT fk_audit_admin
        FOREIGN KEY (admin_id)
        REFERENCES admin(admin_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_audit_agency
        FOREIGN KEY (agency_id)
        REFERENCES agency(agency_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT audit_status_check
        CHECK (status_changed_to IN ('pending_review', 'verified', 'rejected', 'suspended'))
);

-- ============================================================
-- 18. USER SAVED DESTINATIONS
-- USER N : M DESTINATION
-- ============================================================
CREATE TABLE user_saved_destination (
    user_id INTEGER NOT NULL,
    destination_id INTEGER NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, destination_id),

    CONSTRAINT fk_saved_destination_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_saved_destination_destination
        FOREIGN KEY (destination_id)
        REFERENCES destination(destination_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- ============================================================
-- 19. USER SAVED TOUR PACKAGES
-- USER N : M TOUR_PACKAGE
-- ============================================================
CREATE TABLE user_saved_package (
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, package_id),

    CONSTRAINT fk_saved_package_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_saved_package_package
        FOREIGN KEY (package_id)
        REFERENCES tour_package(package_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- ============================================================
-- Helpful indexes for common foreign-key/filter operations
-- ============================================================
CREATE INDEX idx_app_user_account_id
    ON app_user(account_id);

CREATE INDEX idx_agency_account_id
    ON agency(account_id);

CREATE INDEX idx_tour_package_agency_id
    ON tour_package(agency_id);

CREATE INDEX idx_tour_package_destination_id
    ON tour_package(destination_id);

CREATE INDEX idx_tour_schedule_package_id
    ON tour_schedule(package_id);

CREATE INDEX idx_booking_user_id
    ON booking(user_id);

CREATE INDEX idx_booking_package_id
    ON booking(package_id);

CREATE INDEX idx_booking_schedule_id
    ON booking(schedule_id);

CREATE INDEX idx_review_package_id
    ON review(package_id);

CREATE INDEX idx_blog_account_id
    ON blog(account_id);

CREATE INDEX idx_audit_agency_id
    ON agency_audit_log(agency_id);

COMMIT;