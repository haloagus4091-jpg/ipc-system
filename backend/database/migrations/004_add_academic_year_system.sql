-- Migration: Add Academic Year System for Long-term Support
-- This adds tahun_pelajaran and is_graduated columns to support 10-year student lifecycle
-- Academic year format: YYYY-YYYY (e.g., 2024-2025, starts July, ends June)

-- Add tahun_pelajaran column to users table
ALTER TABLE users
    ADD COLUMN tahun_pelajaran VARCHAR(9) DEFAULT NULL COMMENT 'Academic year when student first enrolled (YYYY-YYYY format)' AFTER grha;

-- Add is_graduated column to users table
ALTER TABLE users
    ADD COLUMN is_graduated TINYINT(1) DEFAULT 0 COMMENT 'Whether student has graduated (0=active, 1=graduated)' AFTER tahun_pelajaran;

-- Add index for faster queries on graduated students
CREATE INDEX idx_is_graduated ON users(is_graduated);
CREATE INDEX idx_tahun_pelajaran ON users(tahun_pelajaran);
