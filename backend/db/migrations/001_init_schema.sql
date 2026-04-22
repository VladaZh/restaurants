CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    phone_number VARCHAR(255),
    email VARCHAR(255),
    reservation_date TIMESTAMP WITH TIME ZONE,
    number_of_guests INT CHECK (value BETWEEN 2 AND 10)
);

CREATE INDEX IF NOT EXISTS ind_reservations on reservations(id);