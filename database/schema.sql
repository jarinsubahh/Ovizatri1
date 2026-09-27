
BEGIN;

-- 1. ACCOUNT

CREATE TABLE account (
    account_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT account_type_check
        CHECK (account_type IN ('user', 'agency', 'admin'))
);

-- 2. ADDRESS
-- Used by USER (present/permanent) and AGENCY (registered).

CREATE TABLE address (
    address_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    street_address TEXT NOT NULL,
    thana VARCHAR(100),
    district VARCHAR(100),
    division VARCHAR(100),
    postal_code VARCHAR(20)
);

-- 3. USER / TRAVELER

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

-- 4. ADMIN

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

-- 5. AGENCY

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

-- 6. DESTINATION

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

-- 7. ITINERARY

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


-- 8. ITINERARY_DAY

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

-- 9. DAY_ACTIVITY

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

-- 10. TOUR_PACKAGE

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

-- 11. AMENITY

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

-- 12. TOUR_SCHEDULE

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

-- 13. BOOKING

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

-- 14. PAYMENT

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

-- 14A. DEMO PAYMENTS (new non-destructive table for booking payments)

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES booking(booking_id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(30) CHECK (payment_method IN ('bKash', 'Nagad', 'Rocket', 'Card', 'CashOnArrival')),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING', 'FAILED', 'REFUNDED')),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION calculate_booking_amount(p_package_id INT, p_group_size INT)
RETURNS NUMERIC(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_price NUMERIC(12,2);
    v_discount NUMERIC(5,2);
    v_effective_unit_price NUMERIC(12,2);
    v_total NUMERIC(12,2);
BEGIN
    IF p_package_id IS NULL THEN
        RAISE EXCEPTION 'Package ID is required';
    END IF;

    IF p_group_size IS NULL OR p_group_size <= 0 THEN
        RAISE EXCEPTION 'Group size must be greater than zero';
    END IF;

    SELECT price, COALESCE(discount, 0)
      INTO v_price, v_discount
    FROM tour_package
    WHERE package_id = p_package_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Package not found for booking amount calculation';
    END IF;

    v_effective_unit_price := v_price * (1.0 - (v_discount / 100.0));
    v_total := v_effective_unit_price * p_group_size;

    RETURN ROUND(v_total, 2);
END;
$$;

CREATE OR REPLACE FUNCTION fn_get_package_occupancy_rate(p_package_id INT)
RETURNS NUMERIC(5, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_max_seat INTEGER;
    v_booked_seats BIGINT;
    v_rate NUMERIC(5,2);
BEGIN
    IF p_package_id IS NULL THEN
        RETURN 0.00;
    END IF;

    SELECT max_seat
      INTO v_max_seat
    FROM tour_package
    WHERE package_id = p_package_id;

    IF NOT FOUND OR v_max_seat IS NULL OR v_max_seat <= 0 THEN
        RETURN 0.00;
    END IF;

    SELECT COALESCE(SUM(b.group_size), 0)
      INTO v_booked_seats
    FROM booking b
    WHERE b.package_id = p_package_id
      AND b.payment_status IS DISTINCT FROM 'cancelled'
      AND b.payment_status IS NOT NULL;

    v_rate := (v_booked_seats::NUMERIC / v_max_seat::NUMERIC) * 100.0;
    RETURN ROUND(v_rate, 2);
END;
$$;

CREATE OR REPLACE FUNCTION fn_get_agency_performance_score(p_agency_id INT)
RETURNS NUMERIC(5, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_avg_review_rating NUMERIC(5,2);
    v_total_reviews INTEGER;
    v_total_bookings INTEGER;
    v_paid_bookings INTEGER;
    v_conversion_rate NUMERIC(5,2);
    v_experience_score NUMERIC(5,2);
    v_agency_experience INTEGER;
    v_score NUMERIC(5,2);
BEGIN
    IF p_agency_id IS NULL THEN
        RETURN 0.00;
    END IF;

    SELECT COALESCE(AVG(r.rating), 0)
      INTO v_avg_review_rating
    FROM review r
    JOIN tour_package tp ON tp.package_id = r.package_id
    WHERE tp.agency_id = p_agency_id;

    SELECT COUNT(*), COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN 1 ELSE 0 END), 0)
      INTO v_total_reviews, v_paid_bookings
    FROM booking b
    WHERE b.package_id IN (
        SELECT package_id
        FROM tour_package
        WHERE agency_id = p_agency_id
    );

    v_total_bookings := COALESCE(v_total_reviews, 0);
    v_total_reviews := COALESCE(v_total_reviews, 0);

    IF v_total_bookings > 0 THEN
        v_conversion_rate := (v_paid_bookings::NUMERIC / v_total_bookings::NUMERIC) * 100.0;
    ELSE
        v_conversion_rate := 0.00;
    END IF;

    SELECT COALESCE(experience_years, 0)
      INTO v_agency_experience
    FROM agency
    WHERE agency_id = p_agency_id;

    IF v_agency_experience IS NULL THEN
        v_agency_experience := 0;
    END IF;

    v_experience_score := LEAST((v_agency_experience::NUMERIC / 10.0) * 100.0, 100.0);

    v_score := (
        (COALESCE(v_avg_review_rating, 0) / 5.0) * 40.0
        + COALESCE(v_conversion_rate, 0) * 0.40
        + (LEAST(v_experience_score, 100.0) * 0.20)
    );

    IF v_score < 0 THEN
        v_score := 0.00;
    ELSIF v_score > 100 THEN
        v_score := 100.00;
    END IF;

    RETURN ROUND(v_score, 2);
END;
$$;

CREATE OR REPLACE FUNCTION set_booking_confirmed_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'COMPLETED' THEN
        UPDATE booking
           SET payment_status = 'paid'
         WHERE booking_id = NEW.booking_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_completed_confirms_booking
AFTER INSERT ON payments
FOR EACH ROW
WHEN (NEW.status = 'COMPLETED')
EXECUTE FUNCTION set_booking_confirmed_on_payment();

CREATE OR REPLACE PROCEDURE sp_process_booking_payment(
    IN p_user_id INT,
    IN p_package_id INT,
    IN p_schedule_id INT,
    IN p_group_size INT,
    IN p_payment_method VARCHAR(50),
    IN p_transaction_id VARCHAR(100),
    IN p_amount NUMERIC(12,2),
    OUT p_booking_id INT,
    OUT p_payment_id INT,
    OUT p_status VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_max_seat INT;
    v_booked_seats BIGINT;
    v_total_amount NUMERIC(12,2);
BEGIN
    p_booking_id := NULL;
    p_payment_id := NULL;
    p_status := 'FAILED';

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;

    IF p_package_id IS NULL THEN
        RAISE EXCEPTION 'Package ID is required';
    END IF;

    IF p_schedule_id IS NULL THEN
        RAISE EXCEPTION 'Schedule ID is required';
    END IF;

    IF p_group_size IS NULL OR p_group_size <= 0 THEN
        RAISE EXCEPTION 'Group size must be greater than zero';
    END IF;

    IF p_payment_method IS NULL OR TRIM(p_payment_method) = '' THEN
        RAISE EXCEPTION 'Payment method is required';
    END IF;

    IF p_transaction_id IS NULL OR TRIM(p_transaction_id) = '' THEN
        RAISE EXCEPTION 'Transaction ID is required';
    END IF;

    SELECT max_seat
      INTO v_max_seat
    FROM tour_package
    WHERE package_id = p_package_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Package not found: %', p_package_id;
    END IF;

    SELECT COALESCE(SUM(group_size), 0)
      INTO v_booked_seats
    FROM booking
    WHERE package_id = p_package_id
      AND payment_status IS DISTINCT FROM 'cancelled';

    IF (v_booked_seats + p_group_size) > v_max_seat THEN
        RAISE EXCEPTION 'Not enough available seats for this package. Capacity exceeded.';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        SELECT calculate_booking_amount(p_package_id, p_group_size)
          INTO v_total_amount;
    ELSE
        v_total_amount := p_amount;
    END IF;

    INSERT INTO booking (
        user_id,
        package_id,
        schedule_id,
        group_size,
        total_amount,
        payment_status
    )
    VALUES (
        p_user_id,
        p_package_id,
        p_schedule_id,
        p_group_size,
        v_total_amount,
        'pending'
    )
    RETURNING booking_id INTO p_booking_id;

    INSERT INTO payments (
        booking_id,
        amount,
        payment_method,
        transaction_id,
        status,
        payment_date
    )
    VALUES (
        p_booking_id,
        v_total_amount,
        p_payment_method,
        p_transaction_id,
        'COMPLETED',
        CURRENT_TIMESTAMP
    )
    RETURNING id INTO p_payment_id;

    UPDATE booking
       SET payment_status = 'paid'
     WHERE booking_id = p_booking_id;

    p_status := 'COMPLETED';
END;
$$;

-- 15. REVIEW

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

CREATE OR REPLACE FUNCTION fn_sync_destination_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE destination d
        SET avg_rating = (
            SELECT ROUND(AVG(r.rating)::numeric, 2)
            FROM review r
            JOIN tour_package tp ON tp.package_id = r.package_id
            WHERE tp.destination_id = d.destination_id
        )
        WHERE d.destination_id = (
            SELECT tp.destination_id
            FROM tour_package tp
            WHERE tp.package_id = OLD.package_id
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE destination d
        SET avg_rating = (
            SELECT ROUND(AVG(r.rating)::numeric, 2)
            FROM review r
            JOIN tour_package tp ON tp.package_id = r.package_id
            WHERE tp.destination_id = d.destination_id
        )
        WHERE d.destination_id = (
            SELECT tp.destination_id
            FROM tour_package tp
            WHERE tp.package_id = NEW.package_id
        );
        RETURN NEW;
    ELSE
        UPDATE destination d
        SET avg_rating = (
            SELECT ROUND(AVG(r.rating)::numeric, 2)
            FROM review r
            JOIN tour_package tp ON tp.package_id = r.package_id
            WHERE tp.destination_id = d.destination_id
        )
        WHERE d.destination_id = (
            SELECT tp.destination_id
            FROM tour_package tp
            WHERE tp.package_id = NEW.package_id
        );
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_destination_rating ON review;

CREATE TRIGGER trg_sync_destination_rating
AFTER INSERT OR UPDATE OF rating, package_id OR DELETE
ON review
FOR EACH ROW
EXECUTE FUNCTION fn_sync_destination_rating();

-- 16. BLOG

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

-- 17. AGENCY_AUDIT_LOG

CREATE TABLE agency_audit_log (
    audit_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id INTEGER,
    agency_id INTEGER NOT NULL,
    notes TEXT,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    status_changed_to VARCHAR(30),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
        CHECK (status_changed_to IS NULL OR status_changed_to IN ('pending_review', 'verified', 'rejected', 'suspended'))
);

CREATE OR REPLACE FUNCTION fn_log_agency_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO agency_audit_log (
            admin_id,
            agency_id,
            notes,
            old_status,
            new_status,
            status_changed_to,
            timestamp,
            changed_at
        )
        VALUES (
            NULL,
            NEW.agency_id,
            'Agency status was updated automatically by database trigger.',
            OLD.status,
            NEW.status,
            NEW.status,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_agency_status_change ON agency;

CREATE TRIGGER trg_log_agency_status_change
AFTER UPDATE OF status
ON agency
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION fn_log_agency_status_change();

-- 18. USER SAVED DESTINATIONS

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

-- 19. USER SAVED TOUR PACKAGES

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


-- Helpful indexes for common foreign-key/filter operations

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
-- ========================================================
-- STORED PROCEDURE: Multi-step Booking and Payment Workflow
-- ========================================================
CREATE OR REPLACE PROCEDURE sp_process_booking_payment(
    IN p_user_id INT,
    IN p_package_id INT,
    IN p_schedule_id INT,
    IN p_group_size INT,
    IN p_payment_method VARCHAR(50),
    IN p_transaction_id VARCHAR(100),
    IN p_amount NUMERIC(12,2),
    OUT p_booking_id INT,
    OUT p_payment_id INT,
    OUT p_status VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_max_seat INT;
    v_booked_seats BIGINT;
    v_total_amount NUMERIC(12,2);
    v_valid_method BOOLEAN;
BEGIN
    p_booking_id := NULL;
    p_payment_id := NULL;
    p_status := 'FAILED';

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;

    IF p_package_id IS NULL THEN
        RAISE EXCEPTION 'Package ID is required';
    END IF;

    IF p_schedule_id IS NULL THEN
        RAISE EXCEPTION 'Schedule ID is required';
    END IF;

    IF p_group_size IS NULL OR p_group_size <= 0 THEN
        RAISE EXCEPTION 'Group size must be greater than zero';
    END IF;

    IF p_payment_method IS NULL OR trim(p_payment_method) = '' THEN
        RAISE EXCEPTION 'Payment method is required';
    END IF;

    v_valid_method := p_payment_method IN ('bKash', 'Nagad', 'Rocket', 'Card', 'CashOnArrival');
    IF NOT v_valid_method THEN
        RAISE EXCEPTION 'Unsupported payment method: %', p_payment_method;
    END IF;

    IF p_transaction_id IS NULL OR trim(p_transaction_id) = '' THEN
        RAISE EXCEPTION 'Transaction ID is required';
    END IF;

    -- Concurrency Row-level Lock
    SELECT max_seat
      INTO v_max_seat
    FROM tour_package
    WHERE package_id = p_package_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Package not found: %', p_package_id;
    END IF;

    SELECT COALESCE(SUM(group_size), 0)
      INTO v_booked_seats
    FROM booking
    WHERE package_id = p_package_id
      AND payment_status IS DISTINCT FROM 'cancelled';

    IF (v_booked_seats + p_group_size) > v_max_seat THEN
        RAISE EXCEPTION 'Not enough available seats for this package. Capacity exceeded.';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        SELECT calculate_booking_amount(p_package_id, p_group_size)
          INTO v_total_amount;
    ELSE
        v_total_amount := p_amount;
    END IF;

    -- Step A: Insert Booking
    INSERT INTO booking (
        user_id,
        package_id,
        schedule_id,
        group_size,
        total_amount,
        payment_status
    )
    VALUES (
        p_user_id,
        p_package_id,
        p_schedule_id,
        p_group_size,
        v_total_amount,
        'pending'
    )
    RETURNING booking_id INTO p_booking_id;

    -- Step B: Insert Payment Record
    INSERT INTO payments (
        booking_id,
        amount,
        payment_method,
        transaction_id,
        status,
        payment_date
    )
    VALUES (
        p_booking_id,
        v_total_amount,
        p_payment_method,
        p_transaction_id,
        'COMPLETED',
        CURRENT_TIMESTAMP
    )
    RETURNING id INTO p_payment_id;

    -- Step C: Update Booking to paid
    UPDATE booking
       SET payment_status = 'paid'
     WHERE booking_id = p_booking_id;

    p_status := 'COMPLETED';
END;
$$;