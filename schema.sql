-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  fullname VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address VARCHAR(500),
  role VARCHAR(50) NOT NULL DEFAULT 'buyer',
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id SERIAL PRIMARY KEY,
  userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes VARCHAR(500),
  status VARCHAR(50) DEFAULT 'Active',
  realtor INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS realty (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) UNIQUE NOT NULL,
  description VARCHAR(1000) NOT NULL,
  isrental BOOLEAN DEFAULT false,
  price VARCHAR(50),
  amenities VARCHAR(500),
  address VARCHAR(255),
  realtor INTEGER REFERENCES users(id) ON DELETE CASCADE,
);

-- Insert demo users
INSERT INTO users (username, password, role, fullname, email, phone, address) VALUES
  ('buyer1', 'pass123', 'buyer', 'John Buyer', 'john.buyer@example.com', '555-0001', '123 Main St'),
  ('realtor2', 'pass123', 'realtor', 'Sarah Johnson', 'sarah.johnson@realty.com', '555-0002', '456 Oak Ave'),
  ('buyer3', 'pass123', 'buyer', 'Bob Johnson', 'bob@example.com', '555-0004', '321 Elm St')
ON CONFLICT (username) DO NOTHING;

-- Insert demo prospects (linked to realtor2 with buyer users)
INSERT INTO prospects (userid, notes, status, realtor, created_at, updated_at) VALUES
  (1, 'Interested in properties near downtown', 'Active', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 'Looking for family homes', 'Active', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 'Budget: 500k-750k', 'Pending', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert demo realty listings (from realtor2)
INSERT INTO realty (title, description, isrental, price, amenities, address, realtor, created_at) VALUES
  ('Modern Downtown Apartment', 'Stunning 2-bedroom apartment in the heart of downtown with city views', false, '450000', 'Gym, Pool, Doorman', '123 Main St', 2, CURRENT_TIMESTAMP),
  ('Suburban Family Home', 'Spacious 4-bedroom house perfect for families with large backyard', false, '650000', 'Garden, Garage, Shed', '456 Oak Ave', 2, CURRENT_TIMESTAMP),
  ('Beachfront Condo', 'Beautiful beachfront property with stunning ocean views', true, '3500/month', 'Beach Access, Balcony', '789 Pine Rd', 2, CURRENT_TIMESTAMP)
ON CONFLICT (title) DO NOTHING;
-- Reviews table
DROP TABLE IF EXISTS reviews;
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  realtor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
