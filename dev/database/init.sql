-- Initialize the database for AREA application
-- This script will be executed when the PostgreSQL container starts

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: The users table will be created automatically by TypeORM
-- when the application starts with synchronize: true

-- Grant all necessary permissions to the user (already done by POSTGRES_USER env var)

-- Display connection info
SELECT 'PostgreSQL initialized successfully for AREA application' as message;