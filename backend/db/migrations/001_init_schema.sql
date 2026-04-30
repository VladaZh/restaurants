CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    reservation_date TIMESTAMP WITH TIME ZONE,
    number_of_guests INT CHECK (number_of_guests BETWEEN 1 AND 10)
);

CREATE INDEX IF NOT EXISTS ind_reservations on reservations(phone_number, reservation_date);