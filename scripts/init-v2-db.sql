-- Initialize V2 Database
-- This script creates the webcraft_v2_db database

-- Create V2 database if it doesn't exist
SELECT 'CREATE DATABASE webcraft_v2_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'webcraft_v2_db')\gexec

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE webcraft_v2_db TO webcraft;