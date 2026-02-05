-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  fullname VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'buyer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo users
INSERT INTO users (username, password, role, fullname, email) VALUES
  ('buyer1', 'pass123', 'buyer', 'John Buyer', 'john.buyer@example.com'),
  ('realtor2', 'pass123', 'realtor', 'Sarah Johnson', 'sarah.johnson@realty.com')
ON CONFLICT (username) DO NOTHING;

-- Insert demo prospects
INSERT INTO prospects (name, email, phone, status) VALUES
  ('John Doe db', 'john@example.com', '555-0101', 'Active'),
  ('Jane Smith db', 'jane@example.com', '555-0102', 'Pending'),
  ('Bob Johnson db', 'bob@example.com', '555-0103', 'Active')
ON CONFLICT (email) DO NOTHING;
