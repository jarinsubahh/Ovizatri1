CREATE TABLE account (
	account_id VARCHAR(30) PRIMARY KEY,
	account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('user', 'agency', 'admin')),
	email VARCHAR(320) NOT NULL,
	password_hash TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE address (
	address_id VARCHAR(30) PRIMARY KEY,
	street_address TEXT,
	thana VARCHAR(100),
	district VARCHAR(100) NOT NULL,
	division VARCHAR(100) NOT NULL,
	postal_code VARCHAR(20)
);

CREATE TABLE app_user (
	user_id VARCHAR(30) PRIMARY KEY,
	account_id VARCHAR(30) NOT NULL UNIQUE REFERENCES account(account_id) ON DELETE CASCADE,
	username VARCHAR(80) NOT NULL UNIQUE,
	fullname VARCHAR(200) NOT NULL,
	gender VARCHAR(20) NOT NULL CHECK (gender IN ('Female', 'Male', 'Other')),
	dob DATE NOT NULL,
	phone VARCHAR(30) NOT NULL,
	pfp_url TEXT,
	permanent_address_id VARCHAR(30) REFERENCES address(address_id) ON DELETE SET NULL,
	present_address_id VARCHAR(30) REFERENCES address(address_id) ON DELETE SET NULL
);

CREATE TABLE admin (
	admin_id VARCHAR(30) PRIMARY KEY,
	account_id VARCHAR(30) NOT NULL UNIQUE REFERENCES account(account_id) ON DELETE CASCADE,
	admin_name VARCHAR(200) NOT NULL,
	role_level VARCHAR(50) NOT NULL
);

CREATE TABLE agency (
	agency_id VARCHAR(30) PRIMARY KEY,
	account_id VARCHAR(30) NOT NULL UNIQUE REFERENCES account(account_id) ON DELETE CASCADE,
	agency_name VARCHAR(200) NOT NULL UNIQUE,
	owner_name VARCHAR(200) NOT NULL,
	phone VARCHAR(30) NOT NULL,
	logo_url TEXT,
	experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
	overview TEXT,
	status VARCHAR(30) NOT NULL DEFAULT 'pending_review'
		CHECK (status IN ('pending_review', 'verified', 'suspended')),
	website_url TEXT,
	trade_license_doc_url TEXT,
	registered_address_id VARCHAR(30) REFERENCES address(address_id) ON DELETE SET NULL
);

CREATE TABLE destination (
	destination_id VARCHAR(30) PRIMARY KEY,
	name VARCHAR(200) NOT NULL UNIQUE,
	division VARCHAR(100) NOT NULL,
	category VARCHAR(100) NOT NULL,
	description TEXT NOT NULL,
	avg_rating NUMERIC(3, 2) NOT NULL DEFAULT 0 CHECK (avg_rating BETWEEN 0 AND 5),
	image_url TEXT
);

CREATE TABLE amenity (
	amenity_id VARCHAR(30) PRIMARY KEY,
	name VARCHAR(150) NOT NULL UNIQUE,
	type VARCHAR(50) NOT NULL
);

CREATE TABLE tour_package (
	package_id VARCHAR(30) PRIMARY KEY,
	destination_id VARCHAR(30) NOT NULL REFERENCES destination(destination_id) ON DELETE RESTRICT,
	agency_id VARCHAR(30) NOT NULL REFERENCES agency(agency_id) ON DELETE RESTRICT,
	title VARCHAR(250) NOT NULL,
	price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
	duration INTEGER NOT NULL CHECK (duration >= 1),
	max_seat INTEGER NOT NULL CHECK (max_seat >= 1),
	discount NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (discount BETWEEN 0 AND 100),
	description TEXT NOT NULL,
	CONSTRAINT tour_package_agency_title_unique UNIQUE (agency_id, title)
);

CREATE TABLE package_amenity (
	package_id VARCHAR(30) NOT NULL REFERENCES tour_package(package_id) ON DELETE CASCADE,
	amenity_id VARCHAR(30) NOT NULL REFERENCES amenity(amenity_id) ON DELETE RESTRICT,
	PRIMARY KEY (package_id, amenity_id)
);

CREATE TABLE itinerary (
	itinerary_id VARCHAR(30) PRIMARY KEY,
	user_id VARCHAR(30) NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
	destination_id VARCHAR(30) REFERENCES destination(destination_id) ON DELETE SET NULL,
	name VARCHAR(200) NOT NULL,
	total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_budget >= 0),
	transit_mode VARCHAR(100)
);

CREATE TABLE itinerary_day (
	itinerary_id VARCHAR(30) NOT NULL REFERENCES itinerary(itinerary_id) ON DELETE CASCADE,
	day_number INTEGER NOT NULL CHECK (day_number >= 1),
	description TEXT,
	PRIMARY KEY (itinerary_id, day_number)
);

CREATE TABLE day_activity (
	activity_id VARCHAR(30) PRIMARY KEY,
	itinerary_id VARCHAR(30) NOT NULL,
	day_number INTEGER NOT NULL,
	description TEXT NOT NULL,
	activity_time TIME,
	cost_estimate NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cost_estimate >= 0),
	CONSTRAINT day_activity_day_fk FOREIGN KEY (itinerary_id, day_number)
		REFERENCES itinerary_day(itinerary_id, day_number) ON DELETE CASCADE
);

CREATE TABLE tour_schedule (
	schedule_id VARCHAR(30) PRIMARY KEY,
	package_id VARCHAR(30) NOT NULL REFERENCES tour_package(package_id) ON DELETE CASCADE,
	departure_date DATE NOT NULL,
	return_date DATE NOT NULL,
	CONSTRAINT tour_schedule_dates_check CHECK (return_date >= departure_date),
	CONSTRAINT tour_schedule_package_dates_unique UNIQUE (package_id, departure_date, return_date)
);

CREATE TABLE booking (
	booking_id VARCHAR(30) PRIMARY KEY,
	user_id VARCHAR(30) NOT NULL REFERENCES app_user(user_id) ON DELETE RESTRICT,
	package_id VARCHAR(30) NOT NULL REFERENCES tour_package(package_id) ON DELETE RESTRICT,
	schedule_id VARCHAR(30) NOT NULL REFERENCES tour_schedule(schedule_id) ON DELETE RESTRICT,
	itinerary_id VARCHAR(30) REFERENCES itinerary(itinerary_id) ON DELETE SET NULL,
	address_id VARCHAR(30) REFERENCES address(address_id) ON DELETE SET NULL,
	booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
	group_size INTEGER NOT NULL CHECK (group_size >= 1),
	total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
	payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
		CHECK (payment_status IN ('pending', 'paid'))
);

CREATE TABLE payment (
	payment_id VARCHAR(30) PRIMARY KEY,
	booking_id VARCHAR(30) NOT NULL UNIQUE REFERENCES booking(booking_id) ON DELETE CASCADE,
	transaction_id VARCHAR(100) NOT NULL UNIQUE,
	amount_paid NUMERIC(12, 2) NOT NULL CHECK (amount_paid >= 0),
	payment_gateway VARCHAR(20) NOT NULL CHECK (payment_gateway IN ('bKash', 'Nagad', 'Card')),
	timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review (
	review_id VARCHAR(30) PRIMARY KEY,
	package_id VARCHAR(30) NOT NULL REFERENCES tour_package(package_id) ON DELETE CASCADE,
	user_id VARCHAR(30) NOT NULL REFERENCES app_user(user_id) ON DELETE RESTRICT,
	rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
	comment TEXT NOT NULL,
	review_date DATE NOT NULL DEFAULT CURRENT_DATE,
	CONSTRAINT review_user_package_unique UNIQUE (user_id, package_id)
);

CREATE TABLE blog (
	blog_id VARCHAR(30) PRIMARY KEY,
	account_id VARCHAR(30) NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
	title VARCHAR(300) NOT NULL,
	category VARCHAR(50) NOT NULL
		CHECK (category IN ('Hills', 'Beach', 'Wildlife', 'Rivers', 'Food', 'Culture', 'General')),
	status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
	publish_date DATE,
	image_url TEXT,
	content TEXT NOT NULL
);

CREATE TABLE user_saved_destination (
	user_id VARCHAR(30) NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
	destination_id VARCHAR(30) NOT NULL REFERENCES destination(destination_id) ON DELETE CASCADE,
	saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, destination_id)
);

CREATE TABLE user_saved_package (
	user_id VARCHAR(30) NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
	package_id VARCHAR(30) NOT NULL REFERENCES tour_package(package_id) ON DELETE CASCADE,
	saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, package_id)
);

CREATE TABLE agency_audit_log (
	id VARCHAR(30) PRIMARY KEY,
	agency_id VARCHAR(30) NOT NULL REFERENCES agency(agency_id) ON DELETE CASCADE,
	admin_id VARCHAR(30) NOT NULL REFERENCES admin(admin_id) ON DELETE RESTRICT,
	notes TEXT NOT NULL,
	timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	status_changed_to VARCHAR(30) NOT NULL
		CHECK (status_changed_to IN ('pending_review', 'verified', 'suspended'))
);

CREATE INDEX tour_package_destination_idx ON tour_package(destination_id);
CREATE INDEX tour_package_agency_idx ON tour_package(agency_id);
CREATE UNIQUE INDEX account_email_unique ON account(LOWER(email));
CREATE INDEX tour_schedule_package_idx ON tour_schedule(package_id);
CREATE INDEX booking_user_idx ON booking(user_id);
CREATE INDEX booking_schedule_idx ON booking(schedule_id);
CREATE INDEX review_package_idx ON review(package_id);
CREATE INDEX blog_account_idx ON blog(account_id);
CREATE INDEX agency_audit_log_agency_idx ON agency_audit_log(agency_id);

CREATE OR REPLACE FUNCTION validate_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
	schedule_package_id VARCHAR(30);
	package_max_seat INTEGER;
	booked_seats INTEGER;
BEGIN
	SELECT package_id INTO schedule_package_id
	FROM tour_schedule
	WHERE schedule_id = NEW.schedule_id;

	IF schedule_package_id IS NULL OR schedule_package_id <> NEW.package_id THEN
		RAISE EXCEPTION 'Booking package and schedule do not match';
	END IF;

	SELECT max_seat INTO package_max_seat
	FROM tour_package
	WHERE package_id = NEW.package_id;

	SELECT COALESCE(SUM(group_size), 0) INTO booked_seats
	FROM booking
	WHERE schedule_id = NEW.schedule_id
	  AND booking_id <> COALESCE(NEW.booking_id, '');

	IF booked_seats + NEW.group_size > package_max_seat THEN
		RAISE EXCEPTION 'Booking exceeds the schedule seat capacity';
	END IF;

	RETURN NEW;
END;
$$;

CREATE TRIGGER booking_validation_trigger
BEFORE INSERT OR UPDATE OF package_id, schedule_id, group_size ON booking
FOR EACH ROW
EXECUTE FUNCTION validate_booking();
